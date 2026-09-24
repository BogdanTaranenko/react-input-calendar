/**
 * Strings that Intl cannot provide (button text and aria labels). Override any subset
 * through the `labels` prop or `CalendarConfigProvider`.
 */
export interface CalendarLabels {
  previousMonth: string;
  nextMonth: string;
  previousYears: string;
  nextYears: string;
  chooseMonth: string;
  chooseYear: string;
  openCalendar: string;
  clear: string;
  done: string;
  close: string;
  selectedDates: (count: number) => string;
  hours: string;
  minutes: string;
  dayPeriod: string;
  calendarDialog: string;
  rangeStart: string;
  rangeEnd: string;
  unavailable: string;
  /** Names the group of range presets. */
  presets: string;
}

export const defaultLabels: Readonly<CalendarLabels> = Object.freeze({
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYears: 'Previous years',
  nextYears: 'Next years',
  chooseMonth: 'Choose month',
  chooseYear: 'Choose year',
  openCalendar: 'Open calendar',
  clear: 'Clear',
  done: 'Done',
  close: 'Close',
  selectedDates: (count: number) => `${String(count)} dates`,
  hours: 'Hours',
  minutes: 'Minutes',
  dayPeriod: 'AM/PM',
  calendarDialog: 'Choose date',
  rangeStart: 'start of range',
  rangeEnd: 'end of range',
  unavailable: 'unavailable',
  presets: 'Presets',
});
