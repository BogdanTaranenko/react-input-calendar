import type { CSSProperties, ReactNode } from 'react';
import type { ColorScheme } from '../core/config-context';
import type { SlotProps } from '../core/slots';
import type { DateMatcher, DateRange, RangeConstraints } from '../core/types';
import type { TimeOfDay, WeekStartsOn } from '../date/date-math';
import type { CalendarLabels } from '../i18n/labels';
import type { HourCycle } from '../i18n/locale-info';
import type { DayRenderProps } from '../calendar/types';
import type { Placement } from '../overlay/compute-position';

/** Props every picker shares. `TFormatted` is the non-empty value `formatValue` receives. */
export interface SharedPickerProps<TFormatted> extends SlotProps {
  // Field
  label?: ReactNode;
  description?: ReactNode;
  /** Shown under the field; also marks it invalid. */
  error?: ReactNode;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  /** The trigger stays focusable and shows the value, but nothing opens or clears. */
  readOnly?: boolean | undefined;
  /** An empty picker blocks native form submission and focuses the trigger. */
  required?: boolean | undefined;
  /** The trigger button's id. */
  id?: string | undefined;
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  /** Default `true`. */
  clearable?: boolean | undefined;
  /** Replaces the calendar icon; `false` removes it. */
  icon?: ReactNode;

  // Calendar
  min?: Date | undefined;
  max?: Date | undefined;
  disabledDates?: DateMatcher | undefined;
  /** Default: the browser locale on the client, `en-US` during SSR. */
  locale?: string | undefined;
  weekStartsOn?: WeekStartsOn | undefined;
  /** Default `true`. */
  showOutsideDays?: boolean | undefined;
  renderDay?: ((day: DayRenderProps) => ReactNode) | undefined;
  /** Trigger text for a non-empty value, instead of the locale's medium date format. */
  formatValue?: ((value: TFormatted, locale: string) => string) | undefined;

  // Overlay
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Default `'bottom-start'`. */
  placement?: Placement | undefined;
  /** Below this viewport width the picker opens as a bottom sheet. Default 640; `false` never. */
  mobileBreakpoint?: number | false | undefined;

  // Look
  /** Default `'system'`. */
  colorScheme?: ColorScheme | undefined;
  /** Goes to the `root` slot. */
  className?: string | undefined;
  style?: CSSProperties | undefined;
  labels?: Partial<CalendarLabels> | undefined;
}

export interface DatePickerProps extends SharedPickerProps<Date> {
  value?: Date | null | undefined;
  defaultValue?: Date | null | undefined;
  /** Called with the picked day at local midnight, or `null` when cleared. */
  onChange?: ((value: Date | null) => void) | undefined;
  /** Submits the value as `YYYY-MM-DD` in a native form. */
  name?: string | undefined;
  /** Default `true`. */
  closeOnSelect?: boolean | undefined;
}

/** A one-click range offered beside the calendar. */
export interface RangePreset {
  label: ReactNode;
  /**
   * Called on click, so relative ranges ("last 7 days") use the current day, and on render to
   * mark the preset matching the value: keep it cheap and free of side effects. `from` must not
   * be after `to`; a `to` of `null` sets the start and leaves the picker open for the end.
   */
  value: () => DateRange;
}

export interface DateRangePickerProps extends SharedPickerProps<DateRange>, RangeConstraints {
  value?: DateRange | null | undefined;
  defaultValue?: DateRange | null | undefined;
  /**
   * Called with each change at local midnight: `{ from, to: null }` after the first click, the
   * full range after the second, or `null` when cleared.
   */
  onChange?: ((value: DateRange | null) => void) | undefined;
  /** Submits the start as `YYYY-MM-DD` in a native form. */
  startName?: string | undefined;
  /** Submits the end as `YYYY-MM-DD`, or an empty string while it is not picked. */
  endName?: string | undefined;
  /** Months shown side by side, 1–3. Default 2 in the popover, 1 in the bottom sheet. */
  numberOfMonths?: number | undefined;
  /**
   * One-click ranges, shown before the months. A preset sets its range as given, normalised to
   * local midnight: `minDays`, `maxDays` and `disabledDates` do not apply, since the consumer
   * decides what to offer.
   */
  presets?: RangePreset[] | undefined;
}

/**
 * The trigger lists up to three days as month and day, without the year even when they span
 * several (the calendar shows full dates), and a count beyond that. `formatValue` replaces it.
 */
export interface MultiDatePickerProps extends SharedPickerProps<Date[]> {
  value?: Date[] | undefined;
  defaultValue?: Date[] | undefined;
  /** Called on every toggle with the picked days at local midnight, sorted ascending. */
  onChange?: ((value: Date[]) => void) | undefined;
  /** Submits one `YYYY-MM-DD` field per day in a native form. */
  name?: string | undefined;
  /** Once this many days are picked, others cannot be added until one is removed. */
  maxSelected?: number | undefined;
}

/**
 * Every change is committed at once through `onChange`, so the picker closes only on Done,
 * Escape or an outside press, and Escape does not revert. `min` and `max` are exact moments:
 * a date-only `max` (midnight) allows no later time that day, so pass e.g. 23:59 for the whole
 * day. Picked times are clamped into the limits, then onto the nearest `minuteStep` inside them.
 * A time carried to a day where it does not exist (a DST spring-forward gap) moves forward by
 * the gap, e.g. 02:30 becomes 03:30.
 */
export interface DateTimePickerProps extends SharedPickerProps<Date> {
  value?: Date | null | undefined;
  defaultValue?: Date | null | undefined;
  /** Called on every day or time change, or with `null` when cleared. */
  onChange?: ((value: Date | null) => void) | undefined;
  /** Submits the value as `YYYY-MM-DDTHH:mm` in a native form. */
  name?: string | undefined;
  /** Default: the locale's clock. */
  hourCycle?: HourCycle | undefined;
  /** Minutes between time options. Default `5`. */
  minuteStep?: number | undefined;
  /** The time a first picked day gets. Default: now, rounded to `minuteStep`. */
  defaultTime?: TimeOfDay | undefined;
}
