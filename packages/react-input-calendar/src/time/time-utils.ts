import { devWarn } from '../core/dev-warn';
import { withTime } from '../date/date-math';
import type { HourCycle } from '../i18n/locale-info';

/** Minutes between time options when no `minuteStep` is given. */
export const DEFAULT_MINUTE_STEP = 5;

/** Hour options in display order: 12, 1–11 on a 12-hour clock; 0–23 on a 24-hour clock. */
export function getHourOptions(hourCycle: HourCycle): number[] {
  if (hourCycle === 12) return [12, ...Array.from({ length: 11 }, (_, i) => i + 1)];
  return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Minute options, 0–59 by `step`. An invalid step falls back to 1 (anything else could loop
 * forever or show nothing); a step that does not divide 60 still works. Both warn in development.
 */
export function getMinuteOptions(step: number): number[] {
  const valid = Number.isInteger(step) && step >= 1 && step <= 60;
  if (!valid) {
    devWarn(`minuteStep must be a whole number from 1 to 60; got ${String(step)}. Using 1.`);
  } else if (60 % step !== 0) {
    devWarn(
      `minuteStep ${String(step)} does not divide 60, so the minutes do not repeat evenly each hour.`,
    );
  }
  const safeStep = valid ? step : 1;
  return Array.from({ length: Math.ceil(60 / safeStep) }, (_, i) => i * safeStep);
}

export type DayPeriod = 'am' | 'pm';

/** 12-hour clock to 0–23: 12 AM is 0, 12 PM is 12. */
export function to24h(hour12: number, period: DayPeriod): number {
  return (hour12 % 12) + (period === 'pm' ? 12 : 0);
}

/** 0–23 to a 12-hour value (1–12) and its period. */
export function from24h(hour24: number): { hour12: number; period: DayPeriod } {
  return { hour12: hour24 % 12 || 12, period: hour24 < 12 ? 'am' : 'pm' };
}

/**
 * `date` with its time rounded to the nearest minute option (halves round up), seconds cleared.
 * The next hour's :00 counts as an option, except at the end of the day: it never leaves the day.
 */
export function roundToStep(date: Date, step: number): Date {
  const options = getMinuteOptions(step);
  const minute = date.getMinutes() + date.getSeconds() / 60 + date.getMilliseconds() / 60_000;
  const nearest = [...options, 60].reduce((best, option) =>
    Math.abs(option - minute) <= Math.abs(best - minute) ? option : best,
  );
  const hours = date.getHours();
  if (hours === 23 && nearest === 60)
    return withTime(date, { hours, minutes: Math.max(...options) });
  return withTime(date, { hours, minutes: nearest });
}

/**
 * `date` moved onto the minute step without leaving its day or the limits: up to the next step,
 * or down to the previous one when up would pass `max`. Kept as it is when already on the step
 * or when no step fits, as when an off-step `min` and `max` are closer together than a step.
 */
export function snapToStepWithin(
  date: Date,
  step: number,
  { min, max }: { min?: Date | undefined; max?: Date | undefined },
): Date {
  const onStep = date.getSeconds() === 0 && date.getMilliseconds() === 0;
  const options = getMinuteOptions(step);
  if (onStep && options.includes(date.getMinutes())) return date;

  const sameDay = Array.from({ length: 24 }, (_, hours) =>
    options.map((minutes) => withTime(date, { hours, minutes })),
  ).flat();
  const inLimits = (time: Date) => (!min || time >= min) && (!max || time <= max);
  const up = sameDay.find((time) => time > date);
  if (up && inLimits(up)) return up;
  const earlier = sameDay.filter((time) => time < date);
  const down = earlier[earlier.length - 1];
  return down && inLimits(down) ? down : date;
}

/**
 * True when `hours:minutes` on `date`'s day is before `min` or after `max` (exact time), or does
 * not exist that day: in a DST spring-forward gap `Date` silently shifts it to a later time.
 */
export function isTimeUnavailable(
  date: Date,
  hours: number,
  minutes: number,
  { min, max }: { min?: Date | undefined; max?: Date | undefined },
): boolean {
  const time = withTime(date, { hours, minutes });
  if (time.getHours() !== hours || time.getMinutes() !== minutes) return true;
  return (min !== undefined && time < min) || (max !== undefined && time > max);
}
