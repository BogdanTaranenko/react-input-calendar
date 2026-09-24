/**
 * Immutable, dependency-free helpers for native `Date` values in the local time zone.
 *
 * Every result is built from calendar components (never millisecond arithmetic),
 * which keeps day math correct across DST transitions. No function mutates its arguments.
 */

/** First day of the week: 0 = Sunday … 6 = Saturday (same numbering as `Date#getDay`). */
export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeOfDay {
  hours: number;
  minutes: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * `new Date(y, m, d, …)` from components, except that years 0–99 stay literal
 * (the native constructor maps them to 1900–1999). `month` is 0-based.
 */
export function makeDate(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0,
): Date {
  if (year < 0 || year >= 100) {
    return new Date(year, month, day, hours, minutes, seconds, ms);
  }
  // setFullYear takes the year literally (and applies that year's leap rules).
  // Mutates only the object created here, never an argument.
  const date = new Date(0);
  date.setFullYear(year, month, day);
  date.setHours(hours, minutes, seconds, ms);
  return date;
}

export function startOfDay(date: Date): Date {
  return makeDate(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds calendar days, keeping the time of day. */
export function addDays(date: Date, amount: number): Date {
  return makeDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + amount,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

/** 0-based `month`. */
export function daysInMonth(year: number, month: number): number {
  return makeDate(year, month + 1, 0).getDate();
}

/** Adds months, clamping the day to the target month's length (Jan 31 + 1 → Feb 28/29). */
export function addMonths(date: Date, amount: number): Date {
  const target = makeDate(date.getFullYear(), date.getMonth() + amount, 1);
  const day = Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth()));
  return makeDate(
    target.getFullYear(),
    target.getMonth(),
    day,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

export function addYears(date: Date, amount: number): Date {
  return addMonths(date, amount * 12);
}

export function startOfMonth(date: Date): Date {
  return makeDate(date.getFullYear(), date.getMonth(), 1);
}

/** The last day of the month, at local midnight. */
export function endOfMonth(date: Date): Date {
  return makeDate(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfWeek(date: Date, weekStartsOn: WeekStartsOn = 0): Date {
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  return makeDate(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

/** The last day of the week, at local midnight. */
export function endOfWeek(date: Date, weekStartsOn: WeekStartsOn = 0): Date {
  return addDays(startOfWeek(date, weekStartsOn), 6);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Signed number of calendar days from `b` to `a` (`a - b`), independent of DST and time of day. */
export function differenceInDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / MS_PER_DAY);
}

/** Compares calendar days: -1 if `a` is earlier, 1 if later, 0 if the same day. */
export function compareDay(a: Date, b: Date): -1 | 0 | 1 {
  const diff = differenceInDays(a, b);
  if (diff === 0) return 0;
  return diff < 0 ? -1 : 1;
}

export function isBeforeDay(a: Date, b: Date): boolean {
  return compareDay(a, b) < 0;
}

export function isAfterDay(a: Date, b: Date): boolean {
  return compareDay(a, b) > 0;
}

/** Clamps `date` into the inclusive calendar-day range `[min, max]`; returns local midnight. */
export function clampDay(date: Date, min?: Date, max?: Date): Date {
  if (min && isBeforeDay(date, min)) return startOfDay(min);
  if (max && isAfterDay(date, max)) return startOfDay(max);
  return startOfDay(date);
}

/** Same calendar day with the given hours and minutes; seconds and milliseconds are zeroed. */
export function withTime(date: Date, time: TimeOfDay): Date {
  return makeDate(date.getFullYear(), date.getMonth(), date.getDate(), time.hours, time.minutes);
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
