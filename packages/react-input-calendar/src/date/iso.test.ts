import { describe, expect, it } from 'vitest';
import { makeDate } from './date-math';
import { parseISODate, toISODate, toISODateTime } from './iso';

/** Parses and fails the test on `null`, instead of needing a non-null assertion. */
function parsed(value: string): Date {
  const date = parseISODate(value);
  if (date === null) throw new Error(`expected ${value} to parse`);
  return date;
}

describe('toISODate', () => {
  it('formats local calendar components as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 8, 24))).toBe('2026-09-24');
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses the local day, not the UTC day (a toISOString shortcut fails in NY or Sydney)', () => {
    expect(toISODate(new Date(2026, 8, 24, 0, 30))).toBe('2026-09-24');
    expect(toISODate(new Date(2026, 8, 24, 23, 30))).toBe('2026-09-24');
  });

  it('zero-pads years below 1000 to four digits', () => {
    expect(toISODate(makeDate(50, 0, 1))).toBe('0050-01-01');
  });
});

describe('toISODateTime', () => {
  it('formats local components as YYYY-MM-DDTHH:mm (the datetime-local format)', () => {
    expect(toISODateTime(new Date(2026, 8, 24, 14, 30, 59))).toBe('2026-09-24T14:30');
    expect(toISODateTime(new Date(2026, 8, 24, 0, 5))).toBe('2026-09-24T00:05');
    expect(toISODateTime(new Date(2026, 8, 24, 23, 59))).toBe('2026-09-24T23:59');
  });
});

describe('parseISODate', () => {
  it('parses YYYY-MM-DD to local midnight', () => {
    const date = parsed('2026-09-24');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 8, 24, 0,
    ]);
  });

  it('round-trips with toISODate, including leap days and early years', () => {
    for (const iso of ['2024-02-29', '2026-12-31', '0050-01-01', '2000-02-29']) {
      expect(toISODate(parsed(iso))).toBe(iso);
    }
  });

  it.each([
    ['', 'empty'],
    ['2026-9-24', 'unpadded month'],
    ['2026-09-24T00:00', 'trailing time'],
    [' 2026-09-24', 'leading space'],
    ['2026/09/24', 'wrong separator'],
    ['2026-13-01', 'month 13'],
    ['2026-00-10', 'month 0'],
    ['2026-02-29', 'Feb 29 in a non-leap year'],
    ['2026-04-31', 'April 31'],
    ['2026-09-00', 'day 0'],
  ])('returns null for %j (%s)', (input) => {
    expect(parseISODate(input)).toBeNull();
  });
});
