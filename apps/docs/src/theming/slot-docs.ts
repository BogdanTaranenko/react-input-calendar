import type { SlotName } from '@b.taranenko/react-input-calendar';

/**
 * Where each slot renders. Typed against the public `SlotName`, so adding or removing a slot in
 * the library fails the docs typecheck until this list follows.
 */
export const slotDocs: Record<SlotName, string> = {
  root: 'The outer element of a picker or an inline calendar.',
  label: 'The visible label.',
  description: 'Helper text under the field.',
  error: 'Error text under the field.',
  field: 'The box that holds the trigger and the clear button.',
  trigger: 'The button that opens the popup.',
  triggerValue: 'The value or placeholder text inside the trigger.',
  triggerIcon: 'The calendar icon inside the trigger.',
  clearButton: 'The × button that clears the value.',
  popover: 'The popup on wide screens (a modal `<dialog>`).',
  sheet: 'The bottom sheet panel on narrow screens.',
  backdrop: 'The dimmed `<dialog>` behind the bottom sheet.',
  sheetHandle: 'The drag handle at the top of the sheet.',
  calendar: 'The calendar: header, months and views.',
  header: 'The row with the caption and the navigation buttons.',
  caption: 'The month and year button that opens the month view.',
  navButton: 'The previous and next buttons.',
  months: 'The row of months when several are shown.',
  month: 'One month: its header and grid.',
  grid: 'The day grid of one month (`role="grid"`).',
  weekdays: 'The row of weekday names.',
  weekday: 'One weekday name.',
  week: 'One row of days.',
  day: 'One grid cell. Carries the day state attributes and the range band.',
  dayButton: 'The button inside a day cell.',
  monthGrid: 'The 3 × 4 month view.',
  monthButton: 'One month in the month view.',
  yearGrid: 'The 3 × 4 year view.',
  yearButton: 'One year in the year view.',
  presets: 'The list of range presets.',
  preset: 'One preset button.',
  timePanel: 'The hour, minute and AM/PM columns.',
  timeColumn: 'One time column (`role="listbox"`).',
  timeOption: 'One option in a time column.',
  footer: 'The bar holding the Done button.',
  doneButton: 'The Done button of the multiple and date-time pickers.',
  liveRegion: 'The visually hidden region that announces month changes and counts.',
};

export const slotClass = (name: string) =>
  `ric-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
