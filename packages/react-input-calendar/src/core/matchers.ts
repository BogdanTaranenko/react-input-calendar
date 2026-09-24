import { compareDay, isAfterDay, isBeforeDay, isSameDay } from '../date/date-math';
import type { DateConstraints, DateMatcher } from './types';

function inInterval(date: Date, a: Date, b: Date): boolean {
  const [start, end] = compareDay(a, b) <= 0 ? [a, b] : [b, a];
  return compareDay(date, start) >= 0 && compareDay(date, end) <= 0;
}

// `Array.isArray` does not narrow readonly arrays out of a union, so guard explicitly.
function isMatcherList(matcher: DateMatcher): matcher is readonly DateMatcher[] {
  return Array.isArray(matcher);
}

/** Whether `date` matches `matcher`, comparing by calendar day. */
export function matchesDate(date: Date, matcher: DateMatcher): boolean {
  if (typeof matcher === 'function') return matcher(new Date(date.getTime()));
  if (matcher instanceof Date) return isSameDay(date, matcher);
  if (isMatcherList(matcher)) return matcher.some((item) => matchesDate(date, item));
  if ('dayOfWeek' in matcher) return matcher.dayOfWeek.includes(date.getDay());
  return inInterval(date, matcher.from, matcher.to);
}

/** Outside the inclusive `[min, max]` days, or matched by `disabledDates`. */
export function isDateUnavailable(date: Date, constraints: DateConstraints): boolean {
  const { min, max, disabledDates } = constraints;
  if (min && isBeforeDay(date, min)) return true;
  if (max && isAfterDay(date, max)) return true;
  return disabledDates !== undefined && matchesDate(date, disabledDates);
}
