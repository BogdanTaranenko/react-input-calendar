import type { WeekStartsOn } from '../date/date-math';
import { fallbackDirection, fallbackWeekStartsOn } from './week-fallback';

export type TextDirection = 'ltr' | 'rtl';
export type HourCycle = 12 | 24;

export interface LocaleInfo {
  /** The locale Intl actually resolved to. */
  locale: string;
  dir: TextDirection;
  weekStartsOn: WeekStartsOn;
  hourCycle: HourCycle;
  /** Index 0 = January. */
  monthNames: { long: string[]; short: string[] };
  /** Index 0 = Sunday. */
  weekdayNames: { long: string[]; short: string[]; narrow: string[] };
  dayPeriodNames: { am: string; pm: string };
  /** Full date for a day cell's aria label, e.g. "Thursday, September 24, 2026". */
  formatDayLabel: (date: Date) => string;
  /** Calendar caption, e.g. "September 2026". */
  formatMonthYear: (date: Date) => string;
  /** Trigger text, e.g. "Sep 24, 2026". */
  formatDate: (date: Date) => string;
  /** Range trigger text with the shared parts collapsed, e.g. "Sep 3 – 9, 2026". */
  formatDateRange: (from: Date, to: Date) => string;
  formatDateTime: (date: Date, hourCycle: HourCycle) => string;
  /** Day number with locale digits, e.g. "٢٤" for ar-EG. */
  formatDayNumber: (date: Date) => string;
  formatYear: (date: Date) => string;
  formatList: (items: string[]) => string;
}

interface WeekInfo {
  firstDay: number;
}
interface TextInfo {
  direction?: string;
}

/**
 * The parts of `Intl.Locale` the resolvers read. Week/text info exists as methods in newer
 * engines, as getters in older ones (e.g. Node 22), and not at all in some browsers.
 */
export interface LocaleWithInfo {
  language: string;
  maximize: () => { region?: string | undefined };
  getWeekInfo?: () => WeekInfo;
  weekInfo?: WeekInfo;
  getTextInfo?: () => TextInfo;
  textInfo?: TextInfo;
}

const FALLBACK_LOCALE = 'en-US';

// Reference dates: 2026-01-04 is a Sunday, so day offsets 0–6 are Sunday–Saturday.
const monthDate = (month: number) => new Date(2026, month, 1);
const weekdayDate = (weekday: number) => new Date(2026, 0, 4 + weekday);

const cache = new Map<string, LocaleInfo>();

export function resolveWeekStartsOn(locale: LocaleWithInfo): WeekStartsOn {
  const info = locale.getWeekInfo?.() ?? locale.weekInfo;
  if (info) return (info.firstDay % 7) as WeekStartsOn;
  return fallbackWeekStartsOn(locale.maximize().region);
}

export function resolveDirection(locale: LocaleWithInfo): TextDirection {
  const info = locale.getTextInfo?.() ?? locale.textInfo;
  if (info?.direction === 'rtl' || info?.direction === 'ltr') return info.direction;
  return fallbackDirection(locale.language);
}

function formatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const format = new Intl.DateTimeFormat(locale, options);
  return (date: Date) => format.format(date);
}

function names(count: number, dateFor: (i: number) => Date, format: (d: Date) => string) {
  return Array.from({ length: count }, (_, i) => format(dateFor(i)));
}

function resolveDayPeriodNames(locale: string): { am: string; pm: string } {
  const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', hourCycle: 'h12' });
  const period = (hour: number) =>
    format.formatToParts(new Date(2026, 0, 1, hour)).find((part) => part.type === 'dayPeriod')
      ?.value;
  return { am: period(9) ?? 'AM', pm: period(21) ?? 'PM' };
}

function buildLocaleInfo(requested: string): LocaleInfo {
  const locale = new Intl.DateTimeFormat(requested).resolvedOptions().locale;
  const intlLocale = new Intl.Locale(locale) as unknown as LocaleWithInfo;
  const hc = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
  const dateTime = {
    12: formatter(locale, { dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h12' }),
    24: formatter(locale, { dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' }),
  };
  const dateRange = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const list = new Intl.ListFormat(locale, { type: 'conjunction', style: 'long' });

  return {
    locale,
    dir: resolveDirection(intlLocale),
    weekStartsOn: resolveWeekStartsOn(intlLocale),
    hourCycle: hc === 'h11' || hc === 'h12' ? 12 : 24,
    monthNames: {
      long: names(12, monthDate, formatter(locale, { month: 'long' })),
      short: names(12, monthDate, formatter(locale, { month: 'short' })),
    },
    weekdayNames: {
      long: names(7, weekdayDate, formatter(locale, { weekday: 'long' })),
      short: names(7, weekdayDate, formatter(locale, { weekday: 'short' })),
      narrow: names(7, weekdayDate, formatter(locale, { weekday: 'narrow' })),
    },
    dayPeriodNames: resolveDayPeriodNames(locale),
    formatDayLabel: formatter(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    formatMonthYear: formatter(locale, { month: 'long', year: 'numeric' }),
    formatDate: formatter(locale, { dateStyle: 'medium' }),
    formatDateRange: (from, to) => dateRange.formatRange(from, to),
    formatDateTime: (date, hourCycle) => dateTime[hourCycle](date),
    formatDayNumber: formatter(locale, { day: 'numeric' }),
    formatYear: formatter(locale, { year: 'numeric' }),
    formatList: (items) => list.format(items),
  };
}

/**
 * Everything the UI needs for a locale, derived from Intl and memoised per locale string.
 * An invalid locale string falls back to en-US with a console warning instead of throwing,
 * so one bad prop cannot crash the host app.
 */
export function getLocaleInfo(locale: string): LocaleInfo {
  const cached = cache.get(locale);
  if (cached) return cached;
  let info: LocaleInfo;
  try {
    info = buildLocaleInfo(locale);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    console.warn(
      `[react-input-calendar] Invalid locale "${locale}" (${error.message}); using ${FALLBACK_LOCALE}.`,
    );
    info = getLocaleInfo(FALLBACK_LOCALE);
  }
  cache.set(locale, info);
  return info;
}
