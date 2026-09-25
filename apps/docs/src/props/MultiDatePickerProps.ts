import { sharedPickerProps } from './shared';
import type { PropDoc } from './types';

export const props: PropDoc[] = [
  { name: 'value', type: 'Date[]', description: 'Controlled value.' },
  { name: 'defaultValue', type: 'Date[]', description: 'Initial value when uncontrolled.' },
  {
    name: 'onChange',
    type: '(value: Date[]) => void',
    description: 'Called on every toggle with the picked days at local midnight, sorted ascending.',
  },
  {
    name: 'formatValue',
    type: '(value: Date[], locale: string) => string',
    default: 'up to three days, then a count',
    description: 'Trigger text for a non-empty value.',
  },
  {
    name: 'name',
    type: 'string',
    description: 'Submits one `YYYY-MM-DD` field per day in a native form.',
  },
  {
    name: 'maxSelected',
    type: 'number',
    description: 'Once this many days are picked, others cannot be added until one is removed.',
  },
  ...sharedPickerProps,
];
