import { addDays, makeDate, startOfWeek, type WeekStartsOn } from './date-math';

const WEEKS_PER_GRID = 6;
const DAYS_PER_WEEK = 7;

/**
 * The days shown for a month: always 6 weeks × 7 days at local midnight, starting on the
 * `weekStartsOn` day of the week that contains the 1st. A fixed row count keeps the
 * calendar's height stable while paging between months. `month` is 0-based.
 */
export function getMonthWeeks(year: number, month: number, weekStartsOn: WeekStartsOn): Date[][] {
  const gridStart = startOfWeek(makeDate(year, month, 1), weekStartsOn);
  return Array.from({ length: WEEKS_PER_GRID }, (_, week) =>
    Array.from({ length: DAYS_PER_WEEK }, (_, day) =>
      addDays(gridStart, week * DAYS_PER_WEEK + day),
    ),
  );
}

/** First year of the `pageSize`-year page containing `year`; pages start at multiples of `pageSize`. */
export function getYearPageStart(year: number, pageSize = 12): number {
  return year - (((year % pageSize) + pageSize) % pageSize);
}

/** The page of `pageSize` consecutive years containing `year`. */
export function getYearRange(year: number, pageSize = 12): number[] {
  const first = getYearPageStart(year, pageSize);
  return Array.from({ length: pageSize }, (_, i) => first + i);
}
