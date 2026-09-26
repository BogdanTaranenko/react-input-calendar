export interface DataAttributeDoc {
  name: string;
  /** The slots that carry it. */
  on: string;
  description: string;
}

/**
 * State attributes are present or absent, never `"false"`, so style them with `[data-selected]`.
 * Enforced by `references.test.ts`.
 */
export const dataAttributes: DataAttributeDoc[] = [
  {
    name: 'data-selected',
    on: 'day, monthButton, yearButton, timeOption',
    description: 'Part of the value. On days: a single day or a range end, not the days between.',
  },
  { name: 'data-range-start', on: 'day', description: 'The first day of the range.' },
  { name: 'data-range-end', on: 'day', description: 'The last day of the range.' },
  {
    name: 'data-in-range',
    on: 'day',
    description: 'Strictly between the two ends of a complete range.',
  },
  { name: 'data-preview', on: 'day', description: 'Inside the range that hovering would pick.' },
  { name: 'data-today', on: 'day', description: 'Today.' },
  { name: 'data-outside', on: 'day', description: 'Belongs to the previous or next month.' },
  { name: 'data-weekend', on: 'day', description: 'Saturday or Sunday.' },
  {
    name: 'data-disabled',
    on: 'root, day, monthButton, yearButton, timeOption',
    description: 'Cannot be picked, or the whole picker is disabled.',
  },
  {
    name: 'data-focused',
    on: 'day, monthButton, yearButton, timeOption',
    description: 'Holds the keyboard focus position in its grid or column.',
  },
  {
    name: 'data-current',
    on: 'monthButton, yearButton',
    description: 'The month or year that contains today.',
  },
  {
    name: 'data-direction',
    on: 'grid',
    description: '`next` or `prev` while the month slides in.',
  },
  { name: 'data-nav', on: 'navButton', description: '`previous` or `next`.' },
  { name: 'data-active', on: 'preset', description: 'The preset whose range equals the value.' },
  { name: 'data-open', on: 'root', description: 'The popup is open.' },
  {
    name: 'data-invalid',
    on: 'root',
    description: 'The field has an `error`, or a `required` check failed.',
  },
  { name: 'data-readonly', on: 'root', description: 'The picker is read-only.' },
  {
    name: 'data-placeholder',
    on: 'triggerValue',
    description: 'The trigger shows the placeholder, not a value.',
  },
  { name: 'data-state', on: 'popover, backdrop', description: '`open` while the popup is shown.' },
  {
    name: 'data-ric-theme',
    on: 'root',
    description:
      '`light` or `dark` when `colorScheme` forces one. Put it on any ancestor to do the same.',
  },
];
