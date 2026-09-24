import type { KeyboardEvent } from 'react';
import { getNextFocusedMonth } from '../core/navigation';
import type { SlotAttributes, SlotName } from '../core/slots';
import { compareDay, endOfMonth, isSameMonth, makeDate } from '../date/date-math';
import type { CalendarLabels } from '../i18n/labels';
import type { LocaleInfo } from '../i18n/locale-info';
import { ViewGrid, type ViewCell } from './ViewGrid';

export interface MonthViewProps {
  /** First of the month holding the tab stop; its year is the one shown. */
  focusedMonth: Date;
  selectedDates: readonly Date[];
  today: Date | null;
  min: Date | undefined;
  max: Date | undefined;
  captionId: string;
  localeInfo: LocaleInfo;
  labels: CalendarLabels;
  slot: (name: SlotName) => SlotAttributes;
  onSelect: (month: Date) => void;
  onFocus: (month: Date) => void;
  /** A keyboard move: the caller clamps it and moves DOM focus after the update. */
  onMove: (month: Date) => void;
}

/** True when no day of `month` is inside [min, max]. */
export function isMonthOutside(month: Date, min: Date | undefined, max: Date | undefined): boolean {
  return (
    (min !== undefined && compareDay(endOfMonth(month), min) < 0) ||
    (max !== undefined && compareDay(month, max) > 0)
  );
}

/** Twelve months of one year, for jumping straight to a month. */
export function MonthView(props: MonthViewProps) {
  const { focusedMonth, localeInfo, today } = props;
  const year = focusedMonth.getFullYear();

  const cells: ViewCell[] = localeInfo.monthNames.short.map((text, index) => {
    const date = makeDate(year, index, 1);
    const disabled = isMonthOutside(date, props.min, props.max);
    const name = localeInfo.monthNames.long[index] ?? text;
    return {
      date,
      text,
      label: disabled ? `${name}, ${props.labels.unavailable}` : name,
      selected: props.selectedDates.some((selected) => isSameMonth(selected, date)),
      current: today !== null && isSameMonth(today, date),
      focused: isSameMonth(focusedMonth, date),
      disabled,
    };
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = getNextFocusedMonth(focusedMonth.getMonth(), event.key, localeInfo.dir);
    if (next === null) return;
    event.preventDefault();
    props.onMove(makeDate(year, next, 1));
  };

  return (
    <ViewGrid
      cells={cells}
      captionId={props.captionId}
      gridSlot="monthGrid"
      buttonSlot="monthButton"
      slot={props.slot}
      onSelect={props.onSelect}
      onFocus={props.onFocus}
      onKeyDown={handleKeyDown}
    />
  );
}
