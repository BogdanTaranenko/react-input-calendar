import type { KeyboardEvent } from 'react';
import { getNextFocusedYear } from '../core/navigation';
import type { SlotAttributes, SlotName } from '../core/slots';
import { makeDate } from '../date/date-math';
import { getYearPageStart, getYearRange } from '../date/grid';
import type { CalendarLabels } from '../i18n/labels';
import type { LocaleInfo } from '../i18n/locale-info';
import { ViewGrid, type ViewCell } from './ViewGrid';

export interface YearViewProps {
  /** The year holding the tab stop; the page of 12 years around it is shown. */
  focusedYear: number;
  selectedDates: readonly Date[];
  today: Date | null;
  min: Date | undefined;
  max: Date | undefined;
  captionId: string;
  localeInfo: LocaleInfo;
  labels: CalendarLabels;
  slot: (name: SlotName) => SlotAttributes;
  onSelect: (year: number) => void;
  onFocus: (year: number) => void;
  /** A keyboard move: the caller clamps it and moves DOM focus after the update. */
  onMove: (year: number) => void;
}

const PAGE_SIZE = 12;

/** True when no day of `year` is inside [min, max]. */
export function isYearOutside(year: number, min: Date | undefined, max: Date | undefined): boolean {
  return (
    (min !== undefined && year < min.getFullYear()) ||
    (max !== undefined && year > max.getFullYear())
  );
}

/** The years caption, e.g. "2016 – 2027", in the locale's digits. */
export function formatYearPage(year: number, localeInfo: LocaleInfo): string {
  const first = getYearPageStart(year, PAGE_SIZE);
  const last = first + PAGE_SIZE - 1;
  return `${localeInfo.formatYear(makeDate(first, 0, 1))} – ${localeInfo.formatYear(makeDate(last, 0, 1))}`;
}

/** A page of 12 years, for jumping to a distant year (e.g. a birthday). */
export function YearView(props: YearViewProps) {
  const { focusedYear, localeInfo, today } = props;

  const cells: ViewCell[] = getYearRange(focusedYear, PAGE_SIZE).map((year) => {
    const date = makeDate(year, 0, 1);
    const disabled = isYearOutside(year, props.min, props.max);
    const text = localeInfo.formatYear(date);
    return {
      date,
      text,
      label: disabled ? `${text}, ${props.labels.unavailable}` : text,
      selected: props.selectedDates.some((selected) => selected.getFullYear() === year),
      current: today !== null && today.getFullYear() === year,
      focused: year === focusedYear,
      disabled,
    };
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = getNextFocusedYear(focusedYear, event.key, localeInfo.dir);
    if (next === null) return;
    event.preventDefault();
    props.onMove(next);
  };

  return (
    <ViewGrid
      cells={cells}
      captionId={props.captionId}
      gridSlot="yearGrid"
      buttonSlot="yearButton"
      slot={props.slot}
      onSelect={(date) => {
        props.onSelect(date.getFullYear());
      }}
      onFocus={(date) => {
        props.onFocus(date.getFullYear());
      }}
      onKeyDown={handleKeyDown}
    />
  );
}
