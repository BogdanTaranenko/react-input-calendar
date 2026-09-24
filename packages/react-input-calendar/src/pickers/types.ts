import type { CSSProperties, ReactNode } from 'react';
import type { ColorScheme } from '../core/config-context';
import type { SlotProps } from '../core/slots';
import type { DateMatcher } from '../core/types';
import type { WeekStartsOn } from '../date/date-math';
import type { CalendarLabels } from '../i18n/labels';
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
