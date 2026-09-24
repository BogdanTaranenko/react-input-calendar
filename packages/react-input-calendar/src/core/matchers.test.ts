import { describe, expect, it } from 'vitest';
import { isDateUnavailable, matchesDate } from './matchers';

const d = (y: number, m: number, day: number, h = 0) => new Date(y, m - 1, day, h);

describe('matchesDate', () => {
  const thursday = d(2026, 9, 24, 15);

  it('a Date matches the same calendar day, ignoring time', () => {
    expect(matchesDate(thursday, d(2026, 9, 24))).toBe(true);
    expect(matchesDate(thursday, d(2026, 9, 25))).toBe(false);
  });

  it('an interval matches inclusively by calendar day', () => {
    const interval = { from: d(2026, 9, 24, 23), to: d(2026, 9, 30, 1) };
    expect(matchesDate(d(2026, 9, 24), interval)).toBe(true);
    expect(matchesDate(d(2026, 9, 30, 22), interval)).toBe(true);
    expect(matchesDate(d(2026, 9, 23, 23), interval)).toBe(false);
    expect(matchesDate(d(2026, 10, 1), interval)).toBe(false);
  });

  it('a reversed interval covers the same span', () => {
    expect(matchesDate(d(2026, 9, 27), { from: d(2026, 9, 30), to: d(2026, 9, 24) })).toBe(true);
    expect(matchesDate(d(2026, 10, 1), { from: d(2026, 9, 30), to: d(2026, 9, 24) })).toBe(false);
  });

  it('dayOfWeek matches weekdays (0 = Sunday)', () => {
    const weekends = { dayOfWeek: [0, 6] };
    expect(matchesDate(d(2026, 9, 26), weekends)).toBe(true); // Saturday
    expect(matchesDate(d(2026, 9, 27), weekends)).toBe(true); // Sunday
    expect(matchesDate(thursday, weekends)).toBe(false);
  });

  it('a predicate is called with a copy that it cannot use to mutate the original', () => {
    const original = d(2026, 9, 24);
    const before = original.getTime();
    const matched = matchesDate(original, (date) => {
      date.setFullYear(1999);
      return date !== original;
    });
    expect(matched).toBe(true);
    expect(original.getTime()).toBe(before);
  });

  it('an array matches if any member matches, and nests', () => {
    const matcher = [d(2026, 1, 1), [{ dayOfWeek: [4] }, () => false]];
    expect(matchesDate(thursday, matcher)).toBe(true);
    expect(matchesDate(d(2026, 1, 1), matcher)).toBe(true);
    expect(matchesDate(d(2026, 9, 25), matcher)).toBe(false);
    expect(matchesDate(thursday, [])).toBe(false);
  });
});

describe('isDateUnavailable', () => {
  const min = d(2026, 9, 10, 18);
  const max = d(2026, 9, 20, 6);

  it('is false with no constraints', () => {
    expect(isDateUnavailable(d(2026, 9, 24), {})).toBe(false);
  });

  it('treats min and max as inclusive calendar days', () => {
    expect(isDateUnavailable(d(2026, 9, 10), { min, max })).toBe(false);
    expect(isDateUnavailable(d(2026, 9, 20, 23), { min, max })).toBe(false);
    expect(isDateUnavailable(d(2026, 9, 9, 23), { min, max })).toBe(true);
    expect(isDateUnavailable(d(2026, 9, 21), { min, max })).toBe(true);
  });

  it('applies disabledDates', () => {
    expect(isDateUnavailable(d(2026, 9, 15), { min, max, disabledDates: d(2026, 9, 15) })).toBe(
      true,
    );
    expect(isDateUnavailable(d(2026, 9, 16), { disabledDates: { dayOfWeek: [3] } })).toBe(true);
    expect(isDateUnavailable(d(2026, 9, 17), { disabledDates: { dayOfWeek: [3] } })).toBe(false);
  });
});
