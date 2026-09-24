import { makeDate } from './date-math';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

/** `YYYY-MM-DD` from local calendar components (never `toISOString`, which is UTC). */
export function toISODate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DDTHH:mm` from local components — the format of `<input type="datetime-local">`. */
export function toISODateTime(date: Date): string {
  return `${toISODate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parses a strict `YYYY-MM-DD` string to local midnight; `null` if malformed or not a real day. */
export function parseISODate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = makeDate(year, month - 1, day);
  // Reject components the Date constructor silently rolled over (e.g. Feb 30 → Mar 2).
  const isExact =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isExact ? date : null;
}
