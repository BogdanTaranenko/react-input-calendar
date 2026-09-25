import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  from24h,
  getHourOptions,
  getMinuteOptions,
  isTimeUnavailable,
  roundToStep,
  snapToStepWithin,
  to24h,
} from './time-utils';

const at = (h: number, min: number, s = 0, ms = 0) => new Date(2026, 8, 24, h, min, s, ms);
const hm = (date: Date) => [date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getHourOptions', () => {
  it('lists 12, then 1–11 on a 12-hour clock', () => {
    expect(getHourOptions(12)).toEqual([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('lists 0–23 on a 24-hour clock', () => {
    expect(getHourOptions(24)).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });
});

describe('getMinuteOptions', () => {
  const silence = () => vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  it('lists 0–59 by step', () => {
    expect(getMinuteOptions(15)).toEqual([0, 15, 30, 45]);
    expect(getMinuteOptions(1)).toHaveLength(60);
    expect(getMinuteOptions(60)).toEqual([0]);
  });

  it('still steps, with a dev warning, when the step does not divide 60', () => {
    const warn = silence();
    expect(getMinuteOptions(25)).toEqual([0, 25, 50]);
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[react-input-calendar] minuteStep 25 does not divide 60, so the minutes do not repeat evenly each hour.',
    );
  });

  it.each([0, -5, 1.5, 61, Number.NaN])(
    'falls back to 1 with a dev warning for step %s',
    (step) => {
      const warn = silence();
      expect(getMinuteOptions(step)).toHaveLength(60);
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        `[react-input-calendar] minuteStep must be a whole number from 1 to 60; got ${String(step)}. Using 1.`,
      );
    },
  );
});

describe('to24h / from24h', () => {
  it('maps 12 AM to 0 and 12 PM to 12', () => {
    expect(to24h(12, 'am')).toBe(0);
    expect(to24h(12, 'pm')).toBe(12);
    expect(to24h(1, 'am')).toBe(1);
    expect(to24h(11, 'pm')).toBe(23);
  });

  it('splits a 24-hour value into a 12-hour value and a period', () => {
    expect(from24h(0)).toEqual({ hour12: 12, period: 'am' });
    expect(from24h(11)).toEqual({ hour12: 11, period: 'am' });
    expect(from24h(12)).toEqual({ hour12: 12, period: 'pm' });
    expect(from24h(23)).toEqual({ hour12: 11, period: 'pm' });
  });

  it('round-trips every hour', () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const { hour12, period } = from24h(hour);
      expect(to24h(hour12, period)).toBe(hour);
    }
  });
});

describe('snapToStepWithin', () => {
  it('keeps a time already on the step', () => {
    const time = at(10, 15);
    expect(snapToStepWithin(time, 15, { min: at(10, 15) })).toBe(time);
  });

  it('moves a time up to the next step, within max', () => {
    expect(hm(snapToStepWithin(at(10, 7), 15, { min: at(10, 7) }))).toEqual([24, 10, 15, 0]);
    expect(hm(snapToStepWithin(at(10, 15, 23), 15, { min: at(10, 15, 23) }))).toEqual([
      24, 10, 30, 0,
    ]);
    expect(hm(snapToStepWithin(at(10, 52), 15, {}))).toEqual([24, 11, 0, 0]);
  });

  it('moves a time down to the previous step when up would pass max', () => {
    expect(hm(snapToStepWithin(at(16, 52), 15, { max: at(16, 52) }))).toEqual([24, 16, 45, 0]);
  });

  it('keeps the exact time when no step fits between min and max', () => {
    const time = at(10, 7);
    expect(snapToStepWithin(time, 15, { min: at(10, 5), max: at(10, 10) })).toBe(time);
  });

  it('never leaves the day', () => {
    expect(hm(snapToStepWithin(at(23, 52), 15, {}))).toEqual([24, 23, 45, 0]);
    const time = at(23, 52);
    expect(snapToStepWithin(time, 15, { min: at(23, 50) })).toBe(time);
  });
});

describe('roundToStep', () => {
  it('rounds to the nearest step, halves up, and clears seconds', () => {
    expect(hm(roundToStep(at(10, 7, 29, 999), 15))).toEqual([24, 10, 0, 0]);
    expect(hm(roundToStep(at(10, 8), 15))).toEqual([24, 10, 15, 0]);
    expect(hm(roundToStep(at(10, 7, 30), 15))).toEqual([24, 10, 15, 0]);
    expect(hm(roundToStep(at(10, 53), 15))).toEqual([24, 11, 0, 0]);
    expect(roundToStep(at(10, 30, 5, 7), 1).getMilliseconds()).toBe(0);
  });

  it('rounds to the next hour when that is nearest, even for a step that does not divide 60', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(hm(roundToStep(at(10, 59), 7))).toEqual([24, 11, 0, 0]);
    expect(hm(roundToStep(at(10, 57), 7))).toEqual([24, 10, 56, 0]);
  });

  it('stays on the same day at the end of it', () => {
    expect(hm(roundToStep(at(23, 53), 15))).toEqual([24, 23, 45, 0]);
    expect(hm(roundToStep(at(23, 59, 59), 1))).toEqual([24, 23, 59, 0]);
  });

  it('does not change its argument', () => {
    const date = at(10, 8, 30);
    const time = date.getTime();
    roundToStep(date, 15);
    expect(date.getTime()).toBe(time);
  });
});

describe('isTimeUnavailable', () => {
  const day = new Date(2026, 8, 24);

  it('compares the time on that day with min and max exactly', () => {
    const limits = { min: at(10, 30), max: at(18, 0) };
    expect(isTimeUnavailable(day, 10, 29, limits)).toBe(true);
    expect(isTimeUnavailable(day, 10, 30, limits)).toBe(false);
    expect(isTimeUnavailable(day, 18, 0, limits)).toBe(false);
    expect(isTimeUnavailable(day, 18, 1, limits)).toBe(true);
  });

  it('treats a time that does not exist that day as unavailable, in any time zone', () => {
    // Out-of-range parts roll over, like a DST gap does (a 30-minute shift in Lord Howe).
    expect(isTimeUnavailable(day, 24, 0, {})).toBe(true);
    expect(isTimeUnavailable(day, 10, 60, {})).toBe(true);
  });

  it('ignores limits on other days and missing limits', () => {
    expect(isTimeUnavailable(day, 0, 0, { min: new Date(2026, 8, 23, 23) })).toBe(false);
    expect(isTimeUnavailable(day, 23, 59, { max: new Date(2026, 8, 25, 1) })).toBe(false);
    expect(isTimeUnavailable(day, 3, 0, {})).toBe(false);
  });
});

describe('isTimeUnavailable across a DST spring-forward gap', () => {
  // Only one of these holds in a given zone; `pnpm test:tz` runs both.
  const newYorkGap = new Date(2026, 2, 8, 2, 30).getHours() !== 2;
  const sydneyGap = new Date(2026, 9, 4, 2, 30).getHours() !== 2;

  it.runIf(newYorkGap)('marks the skipped hour unavailable in America/New_York', () => {
    const day = new Date(2026, 2, 8);
    expect(isTimeUnavailable(day, 2, 30, {})).toBe(true);
    expect(isTimeUnavailable(day, 3, 0, {})).toBe(false);
    expect(isTimeUnavailable(day, 1, 59, {})).toBe(false);
  });

  it.runIf(sydneyGap)('marks the skipped hour unavailable in Australia/Sydney', () => {
    const day = new Date(2026, 9, 4);
    expect(isTimeUnavailable(day, 2, 0, {})).toBe(true);
    expect(isTimeUnavailable(day, 3, 0, {})).toBe(false);
  });
});
