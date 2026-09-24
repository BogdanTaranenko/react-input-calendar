import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultLabels } from './labels';
import {
  getLocaleInfo,
  resolveDirection,
  resolveWeekStartsOn,
  type LocaleWithInfo,
} from './locale-info';

/** ICU emits U+2009 / U+202F in some formats; compare text with plain spaces. */
const norm = (text: string) => text.replace(/\s/g, ' ');

/** A locale-like object exposing only what the resolvers read. */
function fakeLocale(overrides: Partial<LocaleWithInfo>): LocaleWithInfo {
  return {
    language: 'xx',
    maximize: () => ({ region: undefined }),
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLocaleInfo — real Intl data', () => {
  it('en-US: Sunday start, 12-hour clock, left-to-right', () => {
    const info = getLocaleInfo('en-US');
    expect(info.locale).toBe('en-US');
    expect(info.weekStartsOn).toBe(0);
    expect(info.hourCycle).toBe(12);
    expect(info.dir).toBe('ltr');
  });

  it('en-GB: Monday start, 24-hour clock', () => {
    const info = getLocaleInfo('en-GB');
    expect(info.weekStartsOn).toBe(1);
    expect(info.hourCycle).toBe(24);
  });

  it('ar and he-IL are right-to-left', () => {
    expect(getLocaleInfo('ar').dir).toBe('rtl');
    expect(getLocaleInfo('he-IL').dir).toBe('rtl');
  });

  it('ar starts the week on Saturday', () => {
    expect(getLocaleInfo('ar').weekStartsOn).toBe(6);
  });

  it('builds month names (index 0 = January)', () => {
    const ja = getLocaleInfo('ja-JP');
    expect(ja.monthNames.long).toHaveLength(12);
    expect(ja.monthNames.long[8]).toBe('9月');
    const en = getLocaleInfo('en-US');
    expect(en.monthNames.long[0]).toBe('January');
    expect(en.monthNames.short[8]).toBe('Sep');
  });

  it('builds weekday names (index 0 = Sunday)', () => {
    const { weekdayNames } = getLocaleInfo('en-US');
    expect(weekdayNames.long).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    expect(weekdayNames.short[1]).toBe('Mon');
    expect(weekdayNames.narrow[6]).toBe('S');
  });

  it('formats the day aria label, month caption, trigger date and year', () => {
    const info = getLocaleInfo('en-US');
    const date = new Date(2026, 8, 24, 14, 30);
    expect(norm(info.formatDayLabel(date))).toBe('Thursday, September 24, 2026');
    expect(norm(info.formatMonthYear(date))).toBe('September 2026');
    expect(norm(info.formatDate(date))).toBe('Sep 24, 2026');
    expect(info.formatYear(date)).toBe('2026');
  });

  it('formats a date range with the shared parts collapsed', () => {
    const info = getLocaleInfo('en-US');
    expect(norm(info.formatDateRange(new Date(2026, 8, 3), new Date(2026, 8, 9)))).toBe(
      'Sep 3 – 9, 2026',
    );
    expect(norm(info.formatDateRange(new Date(2026, 11, 30), new Date(2027, 0, 2)))).toBe(
      'Dec 30, 2026 – Jan 2, 2027',
    );
    expect(norm(info.formatDateRange(new Date(2026, 8, 3), new Date(2026, 8, 3)))).toBe(
      'Sep 3, 2026',
    );
  });

  it('formats a short date without the year', () => {
    expect(norm(getLocaleInfo('en-US').formatShortDate(new Date(2026, 8, 3)))).toBe('Sep 3');
    expect(norm(getLocaleInfo('en-GB').formatShortDate(new Date(2026, 8, 3)))).toBe('3 Sept');
  });

  it('formats day numbers with the locale digits', () => {
    expect(getLocaleInfo('ar-EG').formatDayNumber(new Date(2026, 8, 24))).toBe('٢٤');
    expect(getLocaleInfo('en-US').formatDayNumber(new Date(2026, 8, 4))).toBe('4');
  });

  it('formats date + time with an explicit hour cycle, overriding the locale default', () => {
    const date = new Date(2026, 8, 24, 14, 30);
    expect(norm(getLocaleInfo('en-US').formatDateTime(date, 24))).toBe('Sep 24, 2026, 14:30');
    expect(norm(getLocaleInfo('en-US').formatDateTime(date, 12))).toBe('Sep 24, 2026, 2:30 PM');
    expect(norm(getLocaleInfo('en-GB').formatDateTime(date, 12))).toBe('24 Sept 2026, 02:30 pm');
  });

  it('joins lists with the long conjunction style', () => {
    expect(getLocaleInfo('en-US').formatList(['Sep 3', 'Sep 9', 'Sep 12'])).toBe(
      'Sep 3, Sep 9, and Sep 12',
    );
  });

  it('exposes the localized AM/PM names, even for 24-hour locales', () => {
    expect(getLocaleInfo('en-US').dayPeriodNames).toEqual({ am: 'AM', pm: 'PM' });
    expect(getLocaleInfo('en-GB').dayPeriodNames).toEqual({ am: 'am', pm: 'pm' });
  });

  it('returns the cached object for the same locale string', () => {
    expect(getLocaleInfo('de-DE')).toBe(getLocaleInfo('de-DE'));
  });

  it('falls back to en-US for an invalid locale string, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const info = getLocaleInfo('not a locale!!');
    expect(info.locale).toBe('en-US');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not a locale!!'));
  });

  it('prefers the getWeekInfo/getTextInfo methods on the real Intl.Locale when present', () => {
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
    const stubs = {
      getWeekInfo: () => ({ firstDay: 3 }),
      getTextInfo: () => ({ direction: 'rtl' }),
    };
    const originals = Object.fromEntries(
      Object.keys(stubs).map((key) => [key, Object.getOwnPropertyDescriptor(proto, key)]),
    );
    Object.assign(proto, stubs);
    try {
      // A locale string not used elsewhere, so the cache cannot hide the stub.
      const info = getLocaleInfo('en-AU');
      expect(info.weekStartsOn).toBe(3);
      expect(info.dir).toBe('rtl');
    } finally {
      for (const [key, descriptor] of Object.entries(originals)) {
        if (descriptor) Object.defineProperty(proto, key, descriptor);
        else Reflect.deleteProperty(proto, key);
      }
    }
  });
});

describe('resolveWeekStartsOn — fallback chain', () => {
  it('uses the getWeekInfo() method first (Intl 1 = Mon … 7 = Sun → 0 = Sun)', () => {
    const locale = fakeLocale({
      getWeekInfo: () => ({ firstDay: 7 }),
      weekInfo: { firstDay: 1 },
    });
    expect(resolveWeekStartsOn(locale)).toBe(0);
  });

  it('uses the weekInfo getter when the method is missing', () => {
    expect(resolveWeekStartsOn(fakeLocale({ weekInfo: { firstDay: 6 } }))).toBe(6);
  });

  it.each([
    ['US', 0],
    ['JP', 0],
    ['SA', 6],
    ['EG', 6],
    ['DE', 1],
    [undefined, 1],
  ] as const)('falls back to the region table (%s → %i) when neither exists', (region, expected) => {
    const locale = fakeLocale({ maximize: () => ({ region }) });
    expect(resolveWeekStartsOn(locale)).toBe(expected);
  });
});

describe('resolveDirection — fallback chain', () => {
  it('uses the getTextInfo() method first', () => {
    const locale = fakeLocale({
      getTextInfo: () => ({ direction: 'rtl' }),
      textInfo: { direction: 'ltr' },
    });
    expect(resolveDirection(locale)).toBe('rtl');
  });

  it('uses the textInfo getter when the method is missing', () => {
    expect(resolveDirection(fakeLocale({ textInfo: { direction: 'rtl' } }))).toBe('rtl');
  });

  it.each([
    ['ar', 'rtl'],
    ['he', 'rtl'],
    ['fa', 'rtl'],
    ['ckb', 'rtl'],
    ['en', 'ltr'],
    ['ja', 'ltr'],
  ] as const)('falls back to the language list (%s → %s) when neither exists', (language, expected) => {
    expect(resolveDirection(fakeLocale({ language }))).toBe(expected);
  });
});

describe('defaultLabels', () => {
  it('provides English strings for every non-Intl label', () => {
    expect(defaultLabels.previousMonth).toBe('Previous month');
    expect(defaultLabels.selectedDates(5)).toBe('5 dates');
    expect(defaultLabels.presets).toBe('Presets');
    for (const value of Object.values(defaultLabels)) {
      expect(typeof value === 'string' ? value.length : typeof value).toBeTruthy();
    }
  });
});
