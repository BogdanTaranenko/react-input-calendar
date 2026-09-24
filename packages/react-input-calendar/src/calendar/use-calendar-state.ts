import { useMemo, useState, useSyncExternalStore } from 'react';
import { useControllableState } from '../core/use-controllable-state';
import {
  addMonths,
  clampDay,
  compareDay,
  endOfMonth,
  isBeforeDay,
  isSameMonth,
  makeDate,
  startOfMonth,
} from '../date/date-math';
import { parseISODate, toISODate } from '../date/iso';

export type CalendarViewMode = 'days' | 'months' | 'years';
export type SlideDirection = 'next' | 'prev';

const noop = () => undefined;
const subscribeNever = () => noop;
// A string snapshot: a new Date per call would make React re-render forever.
const getTodaySnapshot = () => toISODate(new Date());
const getServerToday = () => null;

/** Today at local midnight; `null` on the server and during hydration, so SSR marks no day. */
export function useToday(): Date | null {
  const iso = useSyncExternalStore(subscribeNever, getTodaySnapshot, getServerToday);
  return useMemo(() => (iso === null ? null : parseISODate(iso)), [iso]);
}

export interface CalendarStateOptions {
  /** A day in the month to show first (already SSR-safe: never a raw `new Date()`). */
  anchor: Date;
  numberOfMonths: number;
  /** Where the tab stop goes when nothing was focused explicitly, in order of preference. */
  focusCandidates: readonly (Date | null)[];
  month?: Date | undefined;
  onMonthChange?: ((month: Date) => void) | undefined;
  min?: Date | undefined;
  max?: Date | undefined;
}

export interface CalendarState {
  /** First day of the first visible month. */
  visibleMonth: Date;
  /** Last day of the last visible month. */
  lastVisibleDay: Date;
  /** The day holding the single tab stop; always inside the visible months. */
  focusedDate: Date;
  direction: SlideDirection;
  view: CalendarViewMode;
  /** First of the month holding the tab stop in the month and year views; inside [min, max]. */
  viewFocus: Date;
  /** Opens the month view on `month`'s year, with the tab stop on `month`. */
  showMonths: (month: Date) => void;
  showYears: () => void;
  showDays: () => void;
  /** Moves the month/year-view tab stop by keyboard or paging, clamped into [min, max]. */
  moveView: (month: Date) => void;
  /** Makes the month/year cell that received DOM focus the tab stop, exactly as it is. */
  focusView: (month: Date) => void;
  /** Shows `month` in the days view. */
  pickMonth: (month: Date) => void;
  /** Opens the month view on `year`, keeping the focused month where it can. */
  pickYear: (year: number) => void;
  /** True once the user has changed month, so the live region starts announcing. */
  navigated: boolean;
  goToMonth: (month: Date) => void;
  focusDate: (date: Date) => void;
}

/**
 * The tab stop. A day the user actually focused wins as it is, even outside [min, max], so the
 * tab stop always matches DOM focus (keyboard moves are clamped before they get here).
 * Otherwise: the first candidate inside the visible months (else the first visible day),
 * clamped into [min, max]. If the clamp would leave the visible months, the in-view day wins:
 * the grid must always keep one tabbable day, even when every visible day is unavailable.
 */
function resolveFocus(
  inView: (date: Date) => boolean,
  visibleMonth: Date,
  explicit: Date | null,
  candidates: readonly (Date | null)[],
  min: Date | undefined,
  max: Date | undefined,
): Date {
  if (explicit !== null && inView(explicit)) return explicit;
  const base = candidates.find((date): date is Date => date !== null && inView(date)) ?? visibleMonth;
  const clamped = clampDay(base, min, max);
  return inView(clamped) ? clamped : base;
}

export function useCalendarState(options: CalendarStateOptions): CalendarState {
  const { numberOfMonths, min, max } = options;
  const [initialMonth] = useState(() => startOfMonth(clampDay(options.anchor, min, max)));
  const [visibleMonth, setVisibleMonth] = useControllableState<Date>({
    value: options.month && startOfMonth(options.month),
    defaultValue: initialMonth,
    onChange: options.onMonthChange,
  });
  const [explicitFocus, setExplicitFocus] = useState<Date | null>(null);
  const [direction, setDirection] = useState<SlideDirection>('next');
  const [view, setView] = useState<CalendarViewMode>('days');
  const [viewFocus, setViewFocus] = useState(initialMonth);
  const [navigated, setNavigated] = useState(false);

  const lastVisibleDay = endOfMonth(addMonths(visibleMonth, numberOfMonths - 1));
  const inView = (date: Date) =>
    compareDay(date, visibleMonth) >= 0 && compareDay(date, lastVisibleDay) <= 0;

  const goToMonth = (month: Date) => {
    const next = startOfMonth(month);
    if (isSameMonth(next, visibleMonth)) return;
    setDirection(isBeforeDay(next, visibleMonth) ? 'prev' : 'next');
    setNavigated(true);
    setVisibleMonth(next);
  };

  // Leaving the view scrolls by as little as possible: the day's month becomes the first
  // visible month when moving back, and the last one when moving forward.
  const focusDate = (date: Date) => {
    setExplicitFocus(date);
    if (inView(date)) return;
    goToMonth(isBeforeDay(date, visibleMonth) ? date : addMonths(date, 1 - numberOfMonths));
  };

  const moveView = (month: Date) => {
    setViewFocus(startOfMonth(clampDay(startOfMonth(month), min, max)));
  };

  return {
    visibleMonth,
    lastVisibleDay,
    focusedDate: resolveFocus(inView, visibleMonth, explicitFocus, options.focusCandidates, min, max),
    direction,
    view,
    viewFocus,
    showMonths: (month) => {
      moveView(month);
      setView('months');
    },
    showYears: () => {
      setView('years');
    },
    showDays: () => {
      setView('days');
    },
    moveView,
    focusView: (month) => {
      setViewFocus(startOfMonth(month));
    },
    pickMonth: (month) => {
      goToMonth(month);
      setView('days');
    },
    pickYear: (year) => {
      moveView(makeDate(year, viewFocus.getMonth(), 1));
      setView('months');
    },
    navigated,
    goToMonth,
    focusDate,
  };
}
