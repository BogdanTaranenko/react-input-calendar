import { describe, expect, it } from 'vitest';
import {
  applyTime,
  getRangePreview,
  isRangeEndSelectable,
  selectRange,
  selectSingle,
  toggleMultiple,
} from './selection';
import type { DateRange } from './types';

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const ymd = (date: Date | null | undefined) =>
  date ? [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours()] : date;
const rangeYmd = (range: DateRange | null) =>
  range ? { from: ymd(range.from), to: ymd(range.to) } : range;

describe('selectSingle', () => {
  it('returns the clicked day at local midnight', () => {
    expect(ymd(selectSingle(null, d(2026, 9, 24, 15)))).toEqual([2026, 9, 24, 0]);
  });

  it('keeps the day selected when the selected day is clicked again', () => {
    const current = d(2026, 9, 24);
    expect(ymd(selectSingle(current, d(2026, 9, 24, 9)))).toEqual([2026, 9, 24, 0]);
  });
});

describe('selectRange', () => {
  const sep10 = d(2026, 9, 10);

  it('starts a range from nothing', () => {
    expect(rangeYmd(selectRange(null, d(2026, 9, 10, 8)))).toEqual({
      from: [2026, 9, 10, 0],
      to: null,
    });
  });

  it('completes an in-progress range with a later day', () => {
    expect(rangeYmd(selectRange({ from: sep10, to: null }, d(2026, 9, 14, 20)))).toEqual({
      from: [2026, 9, 10, 0],
      to: [2026, 9, 14, 0],
    });
  });

  it('allows a one-day range by clicking the start day again', () => {
    expect(rangeYmd(selectRange({ from: sep10, to: null }, sep10))).toEqual({
      from: [2026, 9, 10, 0],
      to: [2026, 9, 10, 0],
    });
  });

  it('restarts at an earlier day instead of completing backwards', () => {
    expect(rangeYmd(selectRange({ from: sep10, to: null }, d(2026, 9, 5)))).toEqual({
      from: [2026, 9, 5, 0],
      to: null,
    });
  });

  it('starts a new range after a complete one', () => {
    const complete = { from: sep10, to: d(2026, 9, 14) };
    expect(rangeYmd(selectRange(complete, d(2026, 9, 20)))).toEqual({
      from: [2026, 9, 20, 0],
      to: null,
    });
  });

  it('returns the current range unchanged when the end breaks minDays or maxDays', () => {
    const current = { from: sep10, to: null };
    // Sep 10 → Sep 11 is 2 days (both ends counted).
    expect(selectRange(current, d(2026, 9, 11), { minDays: 3 })).toBe(current);
    expect(selectRange(current, d(2026, 9, 17), { maxDays: 7 })).toBe(current);
  });

  it('accepts ends exactly at the minDays and maxDays limits', () => {
    const current = { from: sep10, to: null };
    expect(ymd(selectRange(current, d(2026, 9, 12), { minDays: 3 })?.to)).toEqual([2026, 9, 12, 0]);
    expect(ymd(selectRange(current, d(2026, 9, 16), { maxDays: 7 })?.to)).toEqual([2026, 9, 16, 0]);
  });

  it('does not mutate the current range', () => {
    const current = { from: sep10, to: null };
    const snapshot = { ...current, from: new Date(sep10.getTime()) };
    selectRange(current, d(2026, 9, 14));
    expect(current).toEqual(snapshot);
  });
});

describe('getRangePreview', () => {
  const inProgress = { from: d(2026, 9, 10), to: null };

  it('previews from the start to the hovered day', () => {
    expect(rangeYmd(getRangePreview(inProgress, d(2026, 9, 13, 11)))).toEqual({
      from: [2026, 9, 10, 0],
      to: [2026, 9, 13, 0],
    });
  });

  it('shows nothing without an in-progress range', () => {
    expect(getRangePreview(null, d(2026, 9, 13))).toBeNull();
    expect(getRangePreview({ from: d(2026, 9, 10), to: d(2026, 9, 12) }, d(2026, 9, 13))).toBeNull();
  });

  it('shows nothing when hovering before the start (a click there restarts)', () => {
    expect(getRangePreview(inProgress, d(2026, 9, 9))).toBeNull();
  });

  it('shows nothing when the hovered end would break minDays or maxDays', () => {
    expect(getRangePreview(inProgress, d(2026, 9, 11), { minDays: 3 })).toBeNull();
    expect(getRangePreview(inProgress, d(2026, 9, 30), { maxDays: 7 })).toBeNull();
  });
});

describe('isRangeEndSelectable', () => {
  const from = d(2026, 9, 10);
  const never = () => false;

  it('accepts ends within the length limits', () => {
    expect(isRangeEndSelectable(from, d(2026, 9, 14), {}, never)).toBe(true);
    expect(isRangeEndSelectable(from, d(2026, 9, 12), { minDays: 3, maxDays: 3 }, never)).toBe(true);
  });

  it('rejects ends that break minDays or maxDays', () => {
    expect(isRangeEndSelectable(from, d(2026, 9, 11), { minDays: 3 }, never)).toBe(false);
    expect(isRangeEndSelectable(from, d(2026, 9, 17), { maxDays: 7 }, never)).toBe(false);
  });

  it('rejects ends whose span contains an unavailable day, including the end itself', () => {
    const sep12Blocked = (date: Date) => date.getDate() === 12;
    expect(isRangeEndSelectable(from, d(2026, 9, 11), {}, sep12Blocked)).toBe(true);
    expect(isRangeEndSelectable(from, d(2026, 9, 12), {}, sep12Blocked)).toBe(false);
    expect(isRangeEndSelectable(from, d(2026, 9, 20), {}, sep12Blocked)).toBe(false);
  });

  it('treats days before the start as selectable (clicking them restarts the range)', () => {
    expect(isRangeEndSelectable(from, d(2026, 9, 1), { minDays: 30 }, never)).toBe(true);
  });
});

describe('toggleMultiple', () => {
  const sep3 = d(2026, 9, 3);
  const sep9 = d(2026, 9, 9);

  it('adds a day and keeps the list sorted ascending', () => {
    const result = toggleMultiple([sep9], d(2026, 9, 3, 14));
    expect(result.map(ymd)).toEqual([
      [2026, 9, 3, 0],
      [2026, 9, 9, 0],
    ]);
  });

  it('removes a day that is already selected, ignoring the time of day', () => {
    expect(toggleMultiple([sep3, sep9], d(2026, 9, 3, 18)).map(ymd)).toEqual([[2026, 9, 9, 0]]);
  });

  it('ignores additions beyond maxSelected but still allows removals', () => {
    const current = [sep3, sep9];
    expect(toggleMultiple(current, d(2026, 9, 12), { maxSelected: 2 })).toBe(current);
    expect(toggleMultiple(current, sep9, { maxSelected: 2 }).map(ymd)).toEqual([[2026, 9, 3, 0]]);
  });

  it('returns a new array and never mutates the input', () => {
    const current = [sep9];
    const result = toggleMultiple(current, sep3);
    expect(result).not.toBe(current);
    expect(current).toEqual([sep9]);
  });
});

describe('applyTime', () => {
  it('sets the time on the same day', () => {
    const result = applyTime(d(2026, 9, 24), { hours: 14, minutes: 30 });
    expect([result.getDate(), result.getHours(), result.getMinutes()]).toEqual([24, 14, 30]);
  });

  it('clamps to min and max by exact time', () => {
    const min = d(2026, 9, 24, 10, 0);
    const max = d(2026, 9, 24, 18, 0);
    const early = applyTime(d(2026, 9, 24), { hours: 9, minutes: 15 }, { min, max });
    expect(early.getTime()).toBe(min.getTime());
    expect(early).not.toBe(min);
    const late = applyTime(d(2026, 9, 24), { hours: 19, minutes: 0 }, { min, max });
    expect(late.getTime()).toBe(max.getTime());
    expect(late).not.toBe(max);
    const inside = applyTime(d(2026, 9, 24), { hours: 12, minutes: 0 }, { min, max });
    expect(inside.getHours()).toBe(12);
  });

  it('does not mutate the input date', () => {
    const date = d(2026, 9, 24, 8);
    applyTime(date, { hours: 20, minutes: 0 });
    expect(date.getHours()).toBe(8);
  });
});
