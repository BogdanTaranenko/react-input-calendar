import { rangeConstraintProps, sharedPickerProps } from './shared';
import type { PropDoc } from './types';

export const props: PropDoc[] = [
  { name: 'value', type: 'DateRange | null', description: 'Controlled value, `{ from, to }`.' },
  {
    name: 'defaultValue',
    type: 'DateRange | null',
    description: 'Initial value when uncontrolled.',
  },
  {
    name: 'onChange',
    type: '(value: DateRange | null) => void',
    description:
      'Called with `{ from, to: null }` after the first click, the full range after the second, or `null` when cleared.',
  },
  {
    name: 'formatValue',
    type: '(value: DateRange, locale: string) => string',
    default: "the locale's medium dates",
    description: 'Trigger text for a non-empty value.',
  },
  {
    name: 'startName',
    type: 'string',
    description: 'Submits the start as `YYYY-MM-DD` in a native form.',
  },
  {
    name: 'endName',
    type: 'string',
    description: 'Submits the end as `YYYY-MM-DD`, or an empty string while it is not picked.',
  },
  ...rangeConstraintProps,
  {
    name: 'numberOfMonths',
    type: 'number',
    default: '2 in the popover, 1 in the sheet',
    description: 'Months shown side by side, 1–3.',
  },
  {
    name: 'presets',
    type: 'RangePreset[]',
    description:
      'One-click ranges `{ label, value: () => DateRange }`, shown before the months. `minDays`, `maxDays` and `disabledDates` do not apply to them.',
  },
  ...sharedPickerProps,
];
