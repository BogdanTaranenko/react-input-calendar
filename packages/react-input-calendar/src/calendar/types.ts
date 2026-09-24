import type { CSSProperties, ReactNode } from 'react';
import type { ColorScheme } from '../core/config-context';
import type { SlotProps } from '../core/slots';
import type { DateMatcher, DateRange, RangeConstraints } from '../core/types';
import type { WeekStartsOn } from '../date/date-math';
import type { CalendarLabels } from '../i18n/labels';

/** What `renderDay` receives for each day cell. */
export interface DayRenderProps {
  date: Date;
  /** The day number in the locale's digits; the default cell content. */
  formatted: string;
  selected: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
  today: boolean;
  outside: boolean;
  disabled: boolean;
  focused: boolean;
  weekend: boolean;
}

/** Options shared by the inline `Calendar` and the calendar inside every picker. */
export interface CalendarViewOptions extends SlotProps {
  /** Controlled visible month (any day in it). */
  month?: Date | undefined;
  defaultMonth?: Date | undefined;
  /** Called with the first day of the newly visible month. */
  onMonthChange?: ((month: Date) => void) | undefined;
  min?: Date | undefined;
  max?: Date | undefined;
  disabledDates?: DateMatcher | undefined;
  locale?: string | undefined;
  weekStartsOn?: WeekStartsOn | undefined;
  /** Months shown side by side, 1–3. Default `1`. */
  numberOfMonths?: number | undefined;
  /** Show the leading and trailing days of adjacent months. Default `true`; always off with several months. */
  showOutsideDays?: boolean | undefined;
  renderDay?: ((day: DayRenderProps) => ReactNode) | undefined;
  labels?: Partial<CalendarLabels> | undefined;
  /** Focus the tabbable day on mount. */
  autoFocus?: boolean | undefined;
}

interface CalendarRootProps extends CalendarViewOptions {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  colorScheme?: ColorScheme | undefined;
}

export interface CalendarSingleProps extends CalendarRootProps {
  mode?: 'single' | undefined;
  value?: Date | null | undefined;
  defaultValue?: Date | null | undefined;
  onChange?: ((value: Date | null) => void) | undefined;
}

export interface CalendarRangeProps extends CalendarRootProps, RangeConstraints {
  mode: 'range';
  value?: DateRange | null | undefined;
  defaultValue?: DateRange | null | undefined;
  onChange?: ((value: DateRange | null) => void) | undefined;
}

export interface CalendarMultipleProps extends CalendarRootProps {
  mode: 'multiple';
  value?: Date[] | undefined;
  defaultValue?: Date[] | undefined;
  onChange?: ((value: Date[]) => void) | undefined;
  maxSelected?: number | undefined;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps | CalendarMultipleProps;

/** The value, its setter and the mode's constraints, as `CalendarView` receives them. */
export type CalendarSelection =
  | { mode: 'single'; value: Date | null; onChange: (value: Date | null) => void }
  | ({ mode: 'range'; value: DateRange | null; onChange: (value: DateRange | null) => void } & RangeConstraints)
  | {
      mode: 'multiple';
      value: Date[];
      onChange: (value: Date[]) => void;
      maxSelected?: number | undefined;
    };
