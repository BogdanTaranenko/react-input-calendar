import {
  constraintProps,
  dayRenderingProps,
  localeProps,
  rangeConstraintProps,
  slotProps,
} from './shared';
import type { PropDoc } from './types';

export const props: PropDoc[] = [
  {
    name: 'mode',
    type: "'single' | 'range' | 'multiple'",
    default: "'single'",
    description: 'Selection mode. It sets the type of `value`, `defaultValue` and `onChange`.',
  },
  {
    name: 'value',
    type: 'Date | null · DateRange | null · Date[]',
    description: 'Controlled value, by mode.',
  },
  {
    name: 'defaultValue',
    type: 'same as `value`',
    description: 'Initial value when uncontrolled.',
  },
  {
    name: 'onChange',
    type: '(value) => void',
    description: 'Called with the new value, at local midnight.',
  },
  ...rangeConstraintProps.map((row) => ({
    ...row,
    description: `${row.description} Range mode only.`,
  })),
  {
    name: 'maxSelected',
    type: 'number',
    description: 'Multiple mode only. Once this many days are picked, others cannot be added.',
  },
  { name: 'month', type: 'Date', description: 'Controlled visible month (any day in it).' },
  {
    name: 'defaultMonth',
    type: 'Date',
    default: 'the value, or today',
    description: 'Initial visible month. Pass it when rendering on the server.',
  },
  {
    name: 'onMonthChange',
    type: '(month: Date) => void',
    description: 'Called with the first day of the newly visible month.',
  },
  {
    name: 'numberOfMonths',
    type: 'number',
    default: '1',
    description: 'Months shown side by side, 1–3.',
  },
  ...constraintProps,
  ...localeProps,
  ...dayRenderingProps,
  {
    name: 'autoFocus',
    type: 'boolean',
    default: 'false',
    description: 'Focus the tabbable day on mount.',
  },
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
