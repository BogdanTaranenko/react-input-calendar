import type { WeekStartsOn } from '../date/date-math';

/**
 * Fallback data for engines without `Intl.Locale` week/text info
 * (both the newer methods and the older getters are missing).
 */

const SUNDAY_START_REGIONS: ReadonlySet<string> = new Set([
  'US', 'CA', 'MX', 'BR', 'JP', 'KR', 'TW', 'HK', 'IL', 'IN', 'PH', 'ZA', 'AU',
]);

const SATURDAY_START_REGIONS: ReadonlySet<string> = new Set([
  'AF', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SA', 'SD', 'SY', 'AE',
]);

const RTL_LANGUAGES: ReadonlySet<string> = new Set([
  'ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'dv', 'ckb', 'ug',
]);

/** First day of the week for an ISO 3166 region code; Monday when unknown. */
export function fallbackWeekStartsOn(region: string | undefined): WeekStartsOn {
  if (region && SUNDAY_START_REGIONS.has(region)) return 0;
  if (region && SATURDAY_START_REGIONS.has(region)) return 6;
  return 1;
}

/** Text direction for a language subtag. */
export function fallbackDirection(language: string): 'ltr' | 'rtl' {
  return RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
}
