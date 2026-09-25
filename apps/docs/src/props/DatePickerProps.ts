import { sharedPickerProps } from './shared';
import type { PropDoc } from './types';

export const props: PropDoc[] = [
  { name: 'value', type: 'Date | null', description: 'Controlled value.' },
  { name: 'defaultValue', type: 'Date | null', description: 'Initial value when uncontrolled.' },
  {
    name: 'onChange',
    type: '(value: Date | null) => void',
    description: 'Called with the picked day at local midnight, or `null` when cleared.',
  },
  {
    name: 'formatValue',
    type: '(value: Date, locale: string) => string',
    default: "the locale's medium date",
    description: 'Trigger text for a non-empty value.',
  },
  {
    name: 'name',
    type: 'string',
    description: 'Submits the value as `YYYY-MM-DD` in a native form.',
  },
  {
    name: 'closeOnSelect',
    type: 'boolean',
    default: 'true',
    description: 'Close the popup when a day is picked.',
  },
  ...sharedPickerProps,
];
