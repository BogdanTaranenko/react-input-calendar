import {
  addDays,
  compareDay,
  differenceInDays,
  isBeforeDay,
  isSameDay,
  startOfDay,
  withTime,
  type TimeOfDay,
} from '../date/date-math';
import type { DateRange, RangeConstraints } from './types';

/**
 * Pure selection reducers: given the current value and a clicked day, return the next value.
 * Inputs are never mutated. When a click changes nothing, the `current` reference is returned
 * as-is so React can skip the update.
 */

export function selectSingle(_current: Date | null, clicked: Date): Date {
  return startOfDay(clicked);
}

function isLengthAllowed(from: Date, to: Date, { minDays, maxDays }: RangeConstraints): boolean {
  const length = differenceInDays(to, from) + 1;
  if (minDays !== undefined && length < minDays) return false;
  return maxDays === undefined || length <= maxDays;
}

export function selectRange(
  current: DateRange | null,
  clicked: Date,
  constraints: RangeConstraints = {},
): DateRange | null {
  const day = startOfDay(clicked);
  if (!current || current.to !== null || isBeforeDay(day, current.from)) {
    return { from: day, to: null };
  }
  if (!isLengthAllowed(current.from, day, constraints)) return current;
  return { from: current.from, to: day };
}

/** The range to highlight while hovering `hovered` during an in-progress range, or `null`. */
export function getRangePreview(
  current: DateRange | null,
  hovered: Date,
  constraints: RangeConstraints = {},
): DateRange | null {
  if (!current || current.to !== null || isBeforeDay(hovered, current.from)) return null;
  if (!isLengthAllowed(current.from, hovered, constraints)) return null;
  return { from: current.from, to: startOfDay(hovered) };
}

/**
 * Whether `candidate` can end a range started at `from`: within the length limits, with no
 * unavailable day in `[from, candidate]`. Days before `from` count as selectable because a click
 * there restarts the range (their own availability is checked separately).
 */
export function isRangeEndSelectable(
  from: Date,
  candidate: Date,
  constraints: RangeConstraints,
  isUnavailable: (date: Date) => boolean,
): boolean {
  if (isBeforeDay(candidate, from)) return true;
  if (!isLengthAllowed(from, candidate, constraints)) return false;
  for (let day = startOfDay(from); compareDay(day, candidate) <= 0; day = addDays(day, 1)) {
    if (isUnavailable(day)) return false;
  }
  return true;
}

export function toggleMultiple(
  current: Date[],
  clicked: Date,
  { maxSelected }: { maxSelected?: number | undefined } = {},
): Date[] {
  const day = startOfDay(clicked);
  if (current.some((date) => isSameDay(date, day))) {
    return current.filter((date) => !isSameDay(date, day));
  }
  if (maxSelected !== undefined && current.length >= maxSelected) return current;
  return [...current, day].sort((a, b) => a.getTime() - b.getTime());
}

/** Sets the time on `date`'s day, then clamps into `[min, max]` by exact time. */
export function applyTime(
  date: Date,
  time: TimeOfDay,
  { min, max }: { min?: Date | undefined; max?: Date | undefined } = {},
): Date {
  const result = withTime(date, time);
  if (min && result < min) return new Date(min.getTime());
  if (max && result > max) return new Date(max.getTime());
  return result;
}
