// Public entry: named exports only, so every picker tree-shakes on its own.
export { Calendar } from './calendar/Calendar';
export { CalendarConfigProvider } from './core/config-context';
export { defaultLabels } from './i18n/labels';
export { DatePicker } from './pickers/DatePicker';
export { DateRangePicker } from './pickers/DateRangePicker';
export { DateTimePicker } from './pickers/DateTimePicker';
export { MultiDatePicker } from './pickers/MultiDatePicker';

export type { CalendarProps, DayRenderProps } from './calendar/types';
export type { CalendarConfigProviderProps } from './core/config-context';
export type { SlotName } from './core/slots';
export type { DateMatcher, DateRange } from './core/types';
export type { CalendarLabels } from './i18n/labels';
export type {
  DatePickerProps,
  DateRangePickerProps,
  DateTimePickerProps,
  MultiDatePickerProps,
  RangePreset,
} from './pickers/types';
