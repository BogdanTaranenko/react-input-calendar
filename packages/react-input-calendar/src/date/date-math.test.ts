import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  clampDay,
  compareDay,
  daysInMonth,
  differenceInDays,
  endOfMonth,
  endOfWeek,
  isAfterDay,
  isBeforeDay,
  isSameDay,
  isSameMonth,
  isValidDate,
  makeDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  withTime,
  type WeekStartsOn,
} from './date-math';

/** Local date built from components; month is 1-based for readability. */
const d = (y: number, m: number, day: number, h = 0, min = 0, s = 0, ms = 0) =>
  new Date(y, m - 1, day, h, min, s, ms);

const parts = (date: Date) => [
  date.getFullYear(),
  date.getMonth() + 1,
  date.getDate(),
  date.getHours(),
  date.getMinutes(),
  date.getSeconds(),
  date.getMilliseconds(),
];

describe('makeDate', () => {
  it('builds a local date from components', () => {
    expect(parts(makeDate(2026, 8, 24, 14, 30, 5, 9))).toEqual([2026, 9, 24, 14, 30, 5, 9]);
  });

  it('keeps two-digit years literal instead of mapping them to 19xx', () => {
    expect(makeDate(99, 0, 1).getFullYear()).toBe(99);
    expect(makeDate(0, 11, 31).getFullYear()).toBe(0);
  });

  it('normalises overflowing components for two-digit years too', () => {
    expect(parts(makeDate(50, 0, 32))).toEqual([50, 2, 1, 0, 0, 0, 0]);
    expect(parts(makeDate(99, 12, 1))).toEqual([100, 1, 1, 0, 0, 0, 0]);
    expect(parts(makeDate(10, 0, 1, 25))).toEqual([10, 1, 2, 1, 0, 0, 0]);
  });

  it('uses the literal year for leap-day rules (year 0 and 4 are leap, 1900 is not)', () => {
    expect(parts(makeDate(0, 1, 29))).toEqual([0, 2, 29, 0, 0, 0, 0]);
    expect(parts(makeDate(4, 1, 29))).toEqual([4, 2, 29, 0, 0, 0, 0]);
  });
});

describe('startOfDay', () => {
  it('drops the time of day', () => {
    expect(parts(startOfDay(d(2026, 9, 24, 23, 59, 59, 999)))).toEqual([2026, 9, 24, 0, 0, 0, 0]);
  });
});

describe('addDays', () => {
  it('adds and subtracts days across month and year boundaries', () => {
    expect(parts(addDays(d(2026, 1, 31), 1))).toEqual([2026, 2, 1, 0, 0, 0, 0]);
    expect(parts(addDays(d(2026, 12, 31), 1))).toEqual([2027, 1, 1, 0, 0, 0, 0]);
    expect(parts(addDays(d(2026, 1, 1), -1))).toEqual([2025, 12, 31, 0, 0, 0, 0]);
  });

  it('keeps the time of day', () => {
    expect(parts(addDays(d(2026, 9, 24, 14, 30), 7))).toEqual([2026, 10, 1, 14, 30, 0, 0]);
  });

  it('handles leap days', () => {
    expect(parts(addDays(d(2024, 2, 28), 1))).toEqual([2024, 2, 29, 0, 0, 0, 0]);
    expect(parts(addDays(d(2025, 2, 28), 1))).toEqual([2025, 3, 1, 0, 0, 0, 0]);
  });
});

describe('DST transition days (2026, both hemispheres)', () => {
  // New York: Mar 8 (23 h) and Nov 1 (25 h). Sydney: Apr 5 (25 h) and Oct 4 (23 h).
  // Every date runs in every TZ the suite is executed under (see `pnpm test:tz`).
  const transitions = [d(2026, 3, 8), d(2026, 11, 1), d(2026, 4, 5), d(2026, 10, 4)];

  it.each(transitions)('addDays(%s, 1) lands on the next calendar day at midnight', (day) => {
    const next = addDays(day, 1);
    expect(parts(next)).toEqual([day.getFullYear(), day.getMonth() + 1, day.getDate() + 1, 0, 0, 0, 0]);
    expect(differenceInDays(next, day)).toBe(1);
  });

  it.each(transitions)('addDays(%s, -1) lands on the previous calendar day at midnight', (day) => {
    const prev = addDays(day, -1);
    expect(prev.getHours()).toBe(0);
    expect(differenceInDays(day, prev)).toBe(1);
  });
});

describe('addMonths / addYears', () => {
  it('clamps to the end of shorter months', () => {
    expect(parts(addMonths(d(2026, 1, 31), 1))).toEqual([2026, 2, 28, 0, 0, 0, 0]);
    expect(parts(addMonths(d(2024, 1, 31), 1))).toEqual([2024, 2, 29, 0, 0, 0, 0]);
    expect(parts(addMonths(d(2026, 3, 31), -1))).toEqual([2026, 2, 28, 0, 0, 0, 0]);
  });

  it('crosses year boundaries in both directions', () => {
    expect(parts(addMonths(d(2026, 11, 15), 3))).toEqual([2027, 2, 15, 0, 0, 0, 0]);
    expect(parts(addMonths(d(2026, 2, 15), -14))).toEqual([2024, 12, 15, 0, 0, 0, 0]);
  });

  it('keeps the time of day', () => {
    expect(parts(addMonths(d(2026, 9, 24, 8, 15), 1))).toEqual([2026, 10, 24, 8, 15, 0, 0]);
  });

  it('moves a leap day to Feb 28 in a non-leap year', () => {
    expect(parts(addYears(d(2024, 2, 29), 1))).toEqual([2025, 2, 28, 0, 0, 0, 0]);
    expect(parts(addYears(d(2024, 2, 29), 4))).toEqual([2028, 2, 29, 0, 0, 0, 0]);
    expect(parts(addYears(d(2026, 9, 24), -10))).toEqual([2016, 9, 24, 0, 0, 0, 0]);
  });
});

describe('month boundaries', () => {
  it('startOfMonth returns the first day at midnight', () => {
    expect(parts(startOfMonth(d(2026, 9, 24, 13)))).toEqual([2026, 9, 1, 0, 0, 0, 0]);
  });

  it('endOfMonth returns the last day at midnight', () => {
    expect(parts(endOfMonth(d(2026, 2, 10)))).toEqual([2026, 2, 28, 0, 0, 0, 0]);
    expect(parts(endOfMonth(d(2024, 2, 10)))).toEqual([2024, 2, 29, 0, 0, 0, 0]);
    expect(parts(endOfMonth(d(2026, 12, 31, 23)))).toEqual([2026, 12, 31, 0, 0, 0, 0]);
  });

  it('daysInMonth counts days, including leap Februaries', () => {
    expect(daysInMonth(2026, 0)).toBe(31);
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(1900, 1)).toBe(28);
    expect(daysInMonth(2000, 1)).toBe(29);
    expect(daysInMonth(2026, 3)).toBe(30);
  });
});

describe('startOfWeek / endOfWeek', () => {
  // 2026-09-24 is a Thursday (getDay() === 4).
  const thursday = d(2026, 9, 24, 16, 45);
  const expectedStart: Record<WeekStartsOn, [number, number]> = {
    0: [9, 20], // Sunday
    1: [9, 21], // Monday
    2: [9, 22], // Tuesday
    3: [9, 23], // Wednesday
    4: [9, 24], // Thursday — the day itself
    5: [9, 18], // Friday
    6: [9, 19], // Saturday
  };

  it.each([0, 1, 2, 3, 4, 5, 6] as const)('weekStartsOn=%i', (weekStartsOn) => {
    const start = startOfWeek(thursday, weekStartsOn);
    const [month, day] = expectedStart[weekStartsOn];
    expect(parts(start)).toEqual([2026, month, day, 0, 0, 0, 0]);
    expect(start.getDay()).toBe(weekStartsOn);
    const end = endOfWeek(thursday, weekStartsOn);
    expect(differenceInDays(end, start)).toBe(6);
    expect(end.getHours()).toBe(0);
  });

  it('defaults to Sunday', () => {
    expect(startOfWeek(thursday).getDay()).toBe(0);
    expect(endOfWeek(thursday).getDay()).toBe(6);
  });

  it('crosses a year boundary', () => {
    expect(parts(startOfWeek(d(2027, 1, 1), 1))).toEqual([2026, 12, 28, 0, 0, 0, 0]);
  });
});

describe('comparisons by calendar day', () => {
  const morning = d(2026, 9, 24, 8);
  const evening = d(2026, 9, 24, 20);
  const nextDay = d(2026, 9, 25, 1);

  it('isSameDay ignores the time of day', () => {
    expect(isSameDay(morning, evening)).toBe(true);
    expect(isSameDay(evening, nextDay)).toBe(false);
    expect(isSameDay(d(2026, 9, 24), d(2025, 9, 24))).toBe(false);
    expect(isSameDay(d(2026, 9, 24), d(2026, 8, 24))).toBe(false);
  });

  it('isSameMonth compares year and month', () => {
    expect(isSameMonth(d(2026, 9, 1), d(2026, 9, 30))).toBe(true);
    expect(isSameMonth(d(2026, 9, 1), d(2025, 9, 1))).toBe(false);
    expect(isSameMonth(d(2026, 9, 1), d(2026, 10, 1))).toBe(false);
  });

  it('compareDay returns -1, 0 or 1', () => {
    expect(compareDay(morning, evening)).toBe(0);
    expect(compareDay(evening, nextDay)).toBe(-1);
    expect(compareDay(nextDay, morning)).toBe(1);
  });

  it('isBeforeDay / isAfterDay are strict and ignore time', () => {
    expect(isBeforeDay(evening, nextDay)).toBe(true);
    expect(isBeforeDay(morning, evening)).toBe(false);
    expect(isAfterDay(nextDay, evening)).toBe(true);
    expect(isAfterDay(evening, morning)).toBe(false);
  });

  it('differenceInDays counts calendar days, signed', () => {
    expect(differenceInDays(nextDay, morning)).toBe(1);
    expect(differenceInDays(morning, nextDay)).toBe(-1);
    expect(differenceInDays(evening, morning)).toBe(0);
    expect(differenceInDays(d(2027, 1, 1), d(2026, 1, 1))).toBe(365);
    expect(differenceInDays(d(2025, 1, 1), d(2024, 1, 1))).toBe(366);
  });
});

describe('clampDay', () => {
  const min = d(2026, 9, 10, 15);
  const max = d(2026, 9, 20, 9);

  it('returns the day itself (at midnight) when inside the bounds', () => {
    expect(parts(clampDay(d(2026, 9, 15, 12), min, max))).toEqual([2026, 9, 15, 0, 0, 0, 0]);
  });

  it('treats the bounds as inclusive calendar days', () => {
    expect(parts(clampDay(d(2026, 9, 10, 1), min, max))).toEqual([2026, 9, 10, 0, 0, 0, 0]);
    expect(parts(clampDay(d(2026, 9, 20, 23), min, max))).toEqual([2026, 9, 20, 0, 0, 0, 0]);
  });

  it('clamps to the min or max day', () => {
    expect(parts(clampDay(d(2026, 9, 1), min, max))).toEqual([2026, 9, 10, 0, 0, 0, 0]);
    expect(parts(clampDay(d(2026, 12, 1), min, max))).toEqual([2026, 9, 20, 0, 0, 0, 0]);
  });

  it('allows either bound to be omitted', () => {
    expect(parts(clampDay(d(2000, 1, 1), undefined, max))).toEqual([2000, 1, 1, 0, 0, 0, 0]);
    expect(parts(clampDay(d(2030, 1, 1), min))).toEqual([2030, 1, 1, 0, 0, 0, 0]);
    expect(parts(clampDay(d(2030, 1, 1)))).toEqual([2030, 1, 1, 0, 0, 0, 0]);
  });
});

describe('withTime', () => {
  it('sets hours and minutes on the same calendar day, zeroing seconds', () => {
    expect(parts(withTime(d(2026, 9, 24, 3, 4, 5, 6), { hours: 14, minutes: 30 }))).toEqual([
      2026, 9, 24, 14, 30, 0, 0,
    ]);
  });
});

describe('isValidDate', () => {
  it('accepts real dates only', () => {
    expect(isValidDate(d(2026, 9, 24))).toBe(true);
    expect(isValidDate(new Date(Number.NaN))).toBe(false);
    expect(isValidDate('2026-09-24')).toBe(false);
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
    expect(isValidDate(1_790_000_000_000)).toBe(false);
  });
});

describe('immutability', () => {
  const calls: Array<[string, (date: Date) => unknown]> = [
    ['startOfDay', (x) => startOfDay(x)],
    ['addDays', (x) => addDays(x, 3)],
    ['addMonths', (x) => addMonths(x, 1)],
    ['addYears', (x) => addYears(x, 1)],
    ['startOfMonth', (x) => startOfMonth(x)],
    ['endOfMonth', (x) => endOfMonth(x)],
    ['startOfWeek', (x) => startOfWeek(x, 1)],
    ['endOfWeek', (x) => endOfWeek(x, 1)],
    ['isSameDay', (x) => isSameDay(x, x)],
    ['isSameMonth', (x) => isSameMonth(x, x)],
    ['compareDay', (x) => compareDay(x, x)],
    ['isBeforeDay', (x) => isBeforeDay(x, x)],
    ['isAfterDay', (x) => isAfterDay(x, x)],
    ['clampDay', (x) => clampDay(x, x, x)],
    ['differenceInDays', (x) => differenceInDays(x, x)],
    ['withTime', (x) => withTime(x, { hours: 1, minutes: 2 })],
    ['isValidDate', (x) => isValidDate(x)],
  ];

  it.each(calls)('%s leaves its argument untouched and returns a new object', (_name, call) => {
    const input = d(2026, 1, 31, 13, 14, 15, 16);
    const before = input.getTime();
    const result = call(input);
    expect(input.getTime()).toBe(before);
    if (result instanceof Date) expect(result).not.toBe(input);
  });
});
