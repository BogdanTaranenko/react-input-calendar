import type { PropDoc } from './types';

export const slotProps: PropDoc[] = [
  {
    name: 'classNames',
    type: 'Partial<Record<SlotName, string>>',
    description: 'Extra classes per rendered part. They add to the default `ric-*` class.',
  },
  {
    name: 'styles',
    type: 'Partial<Record<SlotName, CSSProperties>>',
    description: 'Inline styles per rendered part.',
  },
];

export const localeProps: PropDoc[] = [
  {
    name: 'locale',
    type: 'string',
    default: 'browser locale (`en-US` during SSR)',
    description:
      'BCP 47 tag. Drives month and weekday names, formatting, week start, direction and clock.',
  },
  {
    name: 'weekStartsOn',
    type: '0 | 1 | 2 | 3 | 4 | 5 | 6',
    default: "the locale's",
    description: 'First day of the week, 0 = Sunday.',
  },
  {
    name: 'labels',
    type: 'Partial<CalendarLabels>',
    description: 'Overrides the English button text and aria labels that Intl cannot provide.',
  },
];

export const constraintProps: PropDoc[] = [
  { name: 'min', type: 'Date', description: 'Earliest selectable day.' },
  { name: 'max', type: 'Date', description: 'Latest selectable day.' },
  {
    name: 'disabledDates',
    type: 'DateMatcher',
    description:
      'Days that cannot be picked: a `Date`, `{ from, to }`, `{ dayOfWeek }`, a predicate, or an array of these. They are announced as unavailable.',
  },
];

export const rangeConstraintProps: PropDoc[] = [
  {
    name: 'minDays',
    type: 'number',
    description: 'Minimum range length in days, counting both ends.',
  },
  {
    name: 'maxDays',
    type: 'number',
    description: 'Maximum range length in days, counting both ends.',
  },
];

export const dayRenderingProps: PropDoc[] = [
  {
    name: 'showOutsideDays',
    type: 'boolean',
    default: 'true',
    description:
      'Show the leading and trailing days of adjacent months. Always off with several months.',
  },
  {
    name: 'renderDay',
    type: '(day: DayRenderProps) => ReactNode',
    description:
      'Replaces the content of each day cell. The button, its state and its keyboard handling stay.',
  },
];

/** Props every picker shares, in the order the pages list them. */
export const sharedPickerProps: PropDoc[] = [
  // Field
  { name: 'label', type: 'ReactNode', description: 'Visible label, tied to the trigger.' },
  { name: 'description', type: 'ReactNode', description: 'Helper text under the field.' },
  {
    name: 'error',
    type: 'ReactNode',
    description: 'Error text under the field. Also marks the field invalid.',
  },
  { name: 'placeholder', type: 'string', description: 'Trigger text while the value is empty.' },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Nothing opens, clears or submits.',
  },
  {
    name: 'readOnly',
    type: 'boolean',
    default: 'false',
    description: 'The trigger stays focusable and shows the value, but nothing opens or clears.',
  },
  {
    name: 'required',
    type: 'boolean',
    default: 'false',
    description: 'An empty picker blocks native form submission and focuses the trigger.',
  },
  { name: 'id', type: 'string', description: "The trigger button's id." },
  {
    name: 'aria-label',
    type: 'string',
    description: 'Accessible name when there is no visible label.',
  },
  {
    name: 'aria-labelledby',
    type: 'string',
    description: 'Id of an element that names the trigger.',
  },
  {
    name: 'clearable',
    type: 'boolean',
    default: 'true',
    description: 'Show a clear button while there is a value.',
  },
  {
    name: 'icon',
    type: 'ReactNode',
    description: 'Replaces the calendar icon; `false` removes it.',
  },
  // Calendar
  ...constraintProps,
  ...localeProps,
  ...dayRenderingProps,
  // Overlay
  { name: 'open', type: 'boolean', description: 'Controlled open state.' },
  {
    name: 'defaultOpen',
    type: 'boolean',
    default: 'false',
    description: 'Initial open state when uncontrolled.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: 'Called when the popup opens or closes.',
  },
  {
    name: 'placement',
    type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'",
    default: "'bottom-start'",
    description: 'Preferred popover side. It flips when there is no room.',
  },
  {
    name: 'mobileBreakpoint',
    type: 'number | false',
    default: '640',
    description:
      'Below this viewport width the picker opens as a bottom sheet; `false` never does.',
  },
  // Look
  {
    name: 'colorScheme',
    type: "'system' | 'light' | 'dark'",
    default: "'system'",
    description: 'Force a scheme. An ancestor `data-ric-theme` attribute also works.',
  },
  { name: 'className', type: 'string', description: 'Goes to the `root` slot.' },
  { name: 'style', type: 'CSSProperties', description: 'Goes to the `root` slot.' },
  ...slotProps,
];
