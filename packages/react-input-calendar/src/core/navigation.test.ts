import { describe, expect, it } from 'vitest';
import { getNextFocusedDate, getNextFocusedMonth, getNextFocusedYear } from './navigation';

const d = (y: number, m: number, day: number, h = 0) => new Date(y, m - 1, day, h);
const ymd = (date: Date | null) =>
  date ? [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours()] : date;

// Thursday 2026-09-24.
const current = d(2026, 9, 24);
const ltr = { dir: 'ltr', weekStartsOn: 1 } as const;
const rtl = { dir: 'rtl', weekStartsOn: 1 } as const;

describe('getNextFocusedDate — every key in both directions', () => {
  it.each([
    // key, shiftKey, ltr result, rtl result
    ['ArrowLeft', false, [2026, 9, 23], [2026, 9, 25]],
    ['ArrowRight', false, [2026, 9, 25], [2026, 9, 23]],
    ['ArrowUp', false, [2026, 9, 17], [2026, 9, 17]],
    ['ArrowDown', false, [2026, 10, 1], [2026, 10, 1]],
    ['Home', false, [2026, 9, 21], [2026, 9, 21]], // Monday (weekStartsOn: 1)
    ['End', false, [2026, 9, 27], [2026, 9, 27]], // Sunday
    ['PageUp', false, [2026, 8, 24], [2026, 8, 24]],
    ['PageDown', false, [2026, 10, 24], [2026, 10, 24]],
    ['PageUp', true, [2025, 9, 24], [2025, 9, 24]],
    ['PageDown', true, [2027, 9, 24], [2027, 9, 24]],
  ] as const)('%s (shift: %s)', (key, shiftKey, ltrExpected, rtlExpected) => {
    expect(ymd(getNextFocusedDate(current, key, { ...ltr, shiftKey }))).toEqual([...ltrExpected, 0]);
    expect(ymd(getNextFocusedDate(current, key, { ...rtl, shiftKey }))).toEqual([...rtlExpected, 0]);
  });

  it('Home/End follow weekStartsOn', () => {
    const sunday = { dir: 'ltr', weekStartsOn: 0 } as const;
    expect(ymd(getNextFocusedDate(current, 'Home', sunday))).toEqual([2026, 9, 20, 0]);
    expect(ymd(getNextFocusedDate(current, 'End', sunday))).toEqual([2026, 9, 26, 0]);
  });

  it('returns null for keys it does not handle', () => {
    expect(getNextFocusedDate(current, 'Enter', ltr)).toBeNull();
    expect(getNextFocusedDate(current, 'a', ltr)).toBeNull();
  });

  it('returns local midnight even when the focused date has a time', () => {
    expect(ymd(getNextFocusedDate(d(2026, 9, 24, 15), 'ArrowRight', ltr))).toEqual([2026, 9, 25, 0]);
  });
});

describe('getNextFocusedDate — month-end clamping', () => {
  it('Mar 31 + PageUp → Feb 28 (non-leap) / Feb 29 (leap)', () => {
    expect(ymd(getNextFocusedDate(d(2026, 3, 31), 'PageUp', ltr))).toEqual([2026, 2, 28, 0]);
    expect(ymd(getNextFocusedDate(d(2024, 3, 31), 'PageUp', ltr))).toEqual([2024, 2, 29, 0]);
  });

  it('Feb 29 + Shift+PageDown → Feb 28 next year', () => {
    expect(ymd(getNextFocusedDate(d(2024, 2, 29), 'PageDown', { ...ltr, shiftKey: true }))).toEqual([
      2025, 2, 28, 0,
    ]);
  });
});

describe('getNextFocusedDate — min/max', () => {
  const min = d(2026, 9, 20, 12);
  const max = d(2026, 9, 26, 12);

  it('clamps moves past min or max to the boundary day', () => {
    expect(ymd(getNextFocusedDate(current, 'PageUp', { ...ltr, min, max }))).toEqual([2026, 9, 20, 0]);
    expect(ymd(getNextFocusedDate(current, 'ArrowDown', { ...ltr, min, max }))).toEqual([
      2026, 9, 26, 0,
    ]);
  });

  it('leaves moves inside the bounds alone', () => {
    expect(ymd(getNextFocusedDate(current, 'ArrowLeft', { ...ltr, min, max }))).toEqual([
      2026, 9, 23, 0,
    ]);
  });
});

describe('getNextFocusedMonth — 3 × 4 month grid (0 = January)', () => {
  it.each([
    ['ArrowLeft', 3, 5],
    ['ArrowRight', 5, 3],
    ['ArrowUp', 1, 1],
    ['ArrowDown', 7, 7],
    ['Home', 3, 3],
    ['End', 5, 5],
  ] as const)('%s from May (4) → ltr %i, rtl %i', (key, ltrExpected, rtlExpected) => {
    expect(getNextFocusedMonth(4, key, 'ltr')).toBe(ltrExpected);
    expect(getNextFocusedMonth(4, key, 'rtl')).toBe(rtlExpected);
  });

  it('stays inside January–December', () => {
    expect(getNextFocusedMonth(0, 'ArrowLeft', 'ltr')).toBe(0);
    expect(getNextFocusedMonth(1, 'ArrowUp', 'ltr')).toBe(0);
    expect(getNextFocusedMonth(11, 'ArrowRight', 'ltr')).toBe(11);
    expect(getNextFocusedMonth(10, 'ArrowDown', 'ltr')).toBe(11);
  });

  it('returns null for keys it does not handle', () => {
    expect(getNextFocusedMonth(4, 'PageUp', 'ltr')).toBeNull();
    expect(getNextFocusedMonth(4, 'Enter', 'ltr')).toBeNull();
  });
});

describe('getNextFocusedYear — 3 × 4 grid of a 12-year page', () => {
  // Page 2016–2027; 2021 sits in the row 2019–2021.
  it.each([
    ['ArrowLeft', 2020, 2022],
    ['ArrowRight', 2022, 2020],
    ['ArrowUp', 2018, 2018],
    ['ArrowDown', 2024, 2024],
    ['Home', 2019, 2019],
    ['End', 2021, 2021],
    ['PageUp', 2009, 2009],
    ['PageDown', 2033, 2033],
  ] as const)('%s from 2021 → ltr %i, rtl %i', (key, ltrExpected, rtlExpected) => {
    expect(getNextFocusedYear(2021, key, 'ltr')).toBe(ltrExpected);
    expect(getNextFocusedYear(2021, key, 'rtl')).toBe(rtlExpected);
  });

  it('can move off the current page (the view then pages)', () => {
    expect(getNextFocusedYear(2016, 'ArrowLeft', 'ltr')).toBe(2015);
    expect(getNextFocusedYear(2027, 'ArrowDown', 'ltr')).toBe(2030);
  });

  it('returns null for keys it does not handle', () => {
    expect(getNextFocusedYear(2021, 'Enter', 'ltr')).toBeNull();
  });
});
