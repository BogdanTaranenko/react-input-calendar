import { describe, expect, it } from 'vitest';
import { differenceInDays } from './date-math';
import { getMonthWeeks, getYearPageStart, getYearRange } from './grid';

const ymd = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];

/** Indexed access that fails the test instead of needing a non-null assertion. */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`no item at index ${String(index)}`);
  return item;
}

describe('getMonthWeeks', () => {
  it('always returns 6 weeks of 7 local-midnight days', () => {
    // February 2026 starts on a Sunday and fits in exactly 4 rows; still padded to 6.
    const weeks = getMonthWeeks(2026, 1, 0);
    expect(weeks).toHaveLength(6);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
      for (const day of week) expect(day.getHours()).toBe(0);
    }
  });

  it('starts on the week containing the 1st and runs 42 consecutive days', () => {
    // September 2026: the 1st is a Tuesday.
    const weeks = getMonthWeeks(2026, 8, 1);
    const days = weeks.flat();
    expect(ymd(at(days, 0))).toEqual([2026, 8, 31]);
    expect(ymd(at(days, 41))).toEqual([2026, 10, 11]);
    days.slice(1).forEach((day, i) => {
      expect(differenceInDays(day, at(days, i))).toBe(1);
    });
  });

  it.each([0, 1, 2, 3, 4, 5, 6] as const)('every row starts on weekStartsOn=%i', (weekStartsOn) => {
    const weeks = getMonthWeeks(2026, 8, weekStartsOn);
    for (const week of weeks) expect(at(week, 0).getDay()).toBe(weekStartsOn);
    const firstOfMonth = at(weeks, 0).find((day) => day.getMonth() === 8 && day.getDate() === 1);
    expect(firstOfMonth).toBeDefined();
  });

  it('starts on the 1st itself when the month begins on weekStartsOn', () => {
    // 2026-02-01 is a Sunday.
    expect(ymd(at(at(getMonthWeeks(2026, 1, 0), 0), 0))).toEqual([2026, 2, 1]);
  });

  it('crosses year boundaries', () => {
    const january = getMonthWeeks(2027, 0, 1);
    expect(ymd(at(at(january, 0), 0))).toEqual([2026, 12, 28]);
    const december = getMonthWeeks(2026, 11, 1);
    expect(ymd(at(at(december, 5), 6))).toEqual([2027, 1, 10]);
  });
});

describe('getYearRange', () => {
  it('returns the 12-year page that contains the year', () => {
    expect(getYearRange(2026)).toEqual([
      2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027,
    ]);
  });

  it('starts a new page on multiples of the page size', () => {
    expect(getYearRange(2028)[0]).toBe(2028);
    expect(getYearRange(2027)[0]).toBe(2016);
  });

  it('supports a custom page size', () => {
    expect(getYearRange(2026, 10)).toEqual([
      2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
    ]);
  });
});

describe('getYearPageStart', () => {
  it('returns the first year of the page containing the year', () => {
    expect(getYearPageStart(2026)).toBe(2016);
    expect(getYearPageStart(2028)).toBe(2028);
    expect(getYearPageStart(2026, 10)).toBe(2020);
  });

  it('pages negative years consistently', () => {
    expect(getYearPageStart(-1)).toBe(-12);
  });
});
