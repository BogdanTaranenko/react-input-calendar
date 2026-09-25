import { sharedPickerProps } from './shared';
import type { PropDoc } from './types';

export const props: PropDoc[] = [
  { name: 'value', type: 'Date | null', description: 'Controlled value.' },
  { name: 'defaultValue', type: 'Date | null', description: 'Initial value when uncontrolled.' },
  {
    name: 'onChange',
    type: '(value: Date | null) => void',
    description: 'Called on every day or time change, or with `null` when cleared.',
  },
  {
    name: 'formatValue',
    type: '(value: Date, locale: string) => string',
    default: "the locale's medium date and short time",
    description: 'Trigger text for a non-empty value.',
  },
  {
    name: 'name',
    type: 'string',
    description: 'Submits the value as `YYYY-MM-DDTHH:mm` in a native form.',
  },
  {
    name: 'hourCycle',
    type: '12 | 24',
    default: "the locale's clock",
    description: 'Clock used by the hour column.',
  },
  {
    name: 'minuteStep',
    type: 'number',
    default: '5',
    description: 'Minutes between time options.',
  },
  {
    name: 'defaultTime',
    type: '{ hours: number; minutes: number }',
    default: 'now, rounded to `minuteStep`',
    description: 'The time a first picked day gets.',
  },
  ...sharedPickerProps,
];
