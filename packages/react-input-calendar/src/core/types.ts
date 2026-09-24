/** A date range; `to` is `null` while the range is in progress (only `from` chosen). */
export interface DateRange {
  from: Date;
  to: Date | null;
}

/**
 * Which dates a rule matches, all compared by calendar day:
 * a single date, an inclusive `{ from, to }` interval, weekdays (`0` = Sunday),
 * a predicate, or an array meaning "any of".
 */
export type DateMatcher =
  | Date
  | { from: Date; to: Date }
  | { dayOfWeek: readonly number[] }
  | ((date: Date) => boolean)
  | readonly DateMatcher[];

export type CalendarMode = 'single' | 'range' | 'multiple';

/** The value type for each calendar mode. */
export type ModeValue<M extends CalendarMode> = M extends 'single'
  ? Date | null
  : M extends 'range'
    ? DateRange | null
    : Date[];

export interface DateConstraints {
  min?: Date | undefined;
  max?: Date | undefined;
  disabledDates?: DateMatcher | undefined;
}

export interface RangeConstraints {
  /** Minimum length in days, counting both ends. */
  minDays?: number | undefined;
  /** Maximum length in days, counting both ends. */
  maxDays?: number | undefined;
}
