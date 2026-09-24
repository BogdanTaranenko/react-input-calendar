import {
  getRangePreview,
  isRangeEndSelectable,
  selectRange,
  selectSingle,
  toggleMultiple,
} from '../core/selection';
import type { DateRange } from '../core/types';
import { addDays, compareDay, isAfterDay, isBeforeDay, isSameDay } from '../date/date-math';
import type { CalendarSelection } from './types';

/** How the selection mode sees one day. */
export interface SelectionDayState {
  /** Part of the value (aria-selected): the day, a range end, or a day inside the range. */
  selected: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
  /** Inside the hover/focus preview of an in-progress range. */
  preview: boolean;
  /** Cannot end the in-progress range (too long, too short, or past an unavailable day). */
  blocked: boolean;
}

export interface SelectionModel {
  dayState: (date: Date) => SelectionDayState;
  /** Applies a click on `date` and reports the new value; unavailable days are filtered earlier. */
  select: (date: Date) => void;
}

export interface SelectionContext {
  hovered: Date | null;
  /** Last day of the last visible month: blocked days are only searched up to here. */
  lastVisibleDay: Date;
  isUnavailable: (date: Date) => boolean;
}

const NOT_IN_VALUE: SelectionDayState = {
  selected: false,
  rangeStart: false,
  rangeEnd: false,
  inRange: false,
  preview: false,
  blocked: false,
};

const withinExclusive = (date: Date, from: Date, to: Date) =>
  isAfterDay(date, from) && isBeforeDay(date, to);

/** The selected days, in the order the tab stop prefers them. */
export function getSelectedDates(selection: CalendarSelection): Date[] {
  switch (selection.mode) {
    case 'single':
      return selection.value ? [selection.value] : [];
    case 'range':
      return selection.value ? [selection.value.from] : [];
    case 'multiple':
      return selection.value;
  }
}

function firstUnavailable(from: Date, until: Date, isUnavailable: (date: Date) => boolean) {
  for (let day = from; compareDay(day, until) <= 0; day = addDays(day, 1)) {
    if (isUnavailable(day)) return day;
  }
  return null;
}

function createRangeModel(
  selection: Extract<CalendarSelection, { mode: 'range' }>,
  context: SelectionContext,
): SelectionModel {
  const { value, onChange } = selection;
  const constraints = { minDays: selection.minDays, maxDays: selection.maxDays };
  const pending = value && value.to === null ? value.from : null;

  // Search the (possibly expensive) disabledDates matcher once per render instead of once per
  // cell: afterwards "is a day unavailable between the start and here" is one comparison.
  const blockedFrom =
    pending && firstUnavailable(pending, context.lastVisibleDay, context.isUnavailable);
  const isPastBlock = (day: Date) => blockedFrom !== null && !isBeforeDay(day, blockedFrom);
  const isBlocked = (day: Date) =>
    pending !== null && !isRangeEndSelectable(pending, day, constraints, isPastBlock);

  const hovered = context.hovered;
  const preview =
    hovered && !isBlocked(hovered) ? getRangePreview(value, hovered, constraints) : null;

  const dayState = (date: Date): SelectionDayState => {
    if (!value) return NOT_IN_VALUE;
    const rangeStart = isSameDay(value.from, date);
    const rangeEnd = value.to !== null && isSameDay(value.to, date);
    const inRange = value.to !== null && withinExclusive(date, value.from, value.to);
    return {
      selected: rangeStart || rangeEnd || inRange,
      rangeStart,
      rangeEnd,
      inRange,
      preview: isInPreview(date, preview),
      blocked: isBlocked(date),
    };
  };

  return {
    dayState,
    select: (date) => {
      if (isBlocked(date)) return;
      onChange(selectRange(value, date, constraints));
    },
  };
}

function isInPreview(date: Date, preview: DateRange | null): boolean {
  return preview?.to != null && isAfterDay(date, preview.from) && compareDay(date, preview.to) <= 0;
}

/** Per-mode rules for which days are part of the value and what a click does. */
export function createSelectionModel(
  selection: CalendarSelection,
  context: SelectionContext,
): SelectionModel {
  switch (selection.mode) {
    case 'single': {
      const { value, onChange } = selection;
      return {
        dayState: (date) =>
          value && isSameDay(value, date) ? { ...NOT_IN_VALUE, selected: true } : NOT_IN_VALUE,
        select: (date) => {
          onChange(selectSingle(value, date));
        },
      };
    }
    case 'multiple': {
      const { value, onChange, maxSelected } = selection;
      return {
        dayState: (date) =>
          value.some((day) => isSameDay(day, date))
            ? { ...NOT_IN_VALUE, selected: true }
            : NOT_IN_VALUE,
        select: (date) => {
          onChange(toggleMultiple(value, date, { maxSelected }));
        },
      };
    }
    case 'range':
      return createRangeModel(selection, context);
  }
}
