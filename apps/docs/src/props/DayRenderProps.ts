import type { PropDoc } from './types';

const flag = (name: string, description: string): PropDoc => ({
  name,
  type: 'boolean',
  description,
});

/** What `renderDay` receives for each day cell. */
export const props: PropDoc[] = [
  { name: 'date', type: 'Date', description: 'The day, at local midnight.' },
  {
    name: 'formatted',
    type: 'string',
    description: "The day number in the locale's digits; the default cell content.",
  },
  flag('selected', 'The day is the value, or part of it.'),
  flag('rangeStart', 'The day starts the selected range.'),
  flag('rangeEnd', 'The day ends the selected range.'),
  flag('inRange', 'The day lies strictly between the two ends of a complete range.'),
  flag('today', 'The day is today.'),
  flag('outside', 'The day belongs to an adjacent month.'),
  flag('disabled', 'The day cannot be picked.'),
  flag('focused', 'The day holds keyboard focus in the grid.'),
  flag('weekend', 'The day is a Saturday or Sunday.'),
];
