import {
  addDays,
  addMonths,
  addYears,
  clampDay,
  endOfWeek,
  startOfWeek,
  type WeekStartsOn,
} from '../date/date-math';
import { getYearPageStart } from '../date/grid';
import type { TextDirection } from '../i18n/locale-info';

/**
 * Keyboard models for the calendar views (WAI-ARIA APG date picker grid).
 * Each function returns the next focus target, or `null` for keys it does not handle.
 */

export interface DayNavigationOptions {
  dir: TextDirection;
  weekStartsOn: WeekStartsOn;
  shiftKey?: boolean | undefined;
  min?: Date | undefined;
  max?: Date | undefined;
}

/** Month and year views are 3 columns × 4 rows. */
const GRID_COLUMNS = 3;
const YEAR_PAGE_SIZE = 12;

/** +1 for "forward" in reading order: ArrowRight in LTR, ArrowLeft in RTL. */
function horizontalStep(key: string, dir: TextDirection): number | null {
  const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  if (key === forward) return 1;
  if (key === backward) return -1;
  return null;
}

function moveDay(current: Date, key: string, options: DayNavigationOptions): Date | null {
  const step = horizontalStep(key, options.dir);
  if (step !== null) return addDays(current, step);
  switch (key) {
    case 'ArrowUp':
      return addDays(current, -7);
    case 'ArrowDown':
      return addDays(current, 7);
    case 'Home':
      return startOfWeek(current, options.weekStartsOn);
    case 'End':
      return endOfWeek(current, options.weekStartsOn);
    case 'PageUp':
      return options.shiftKey ? addYears(current, -1) : addMonths(current, -1);
    case 'PageDown':
      return options.shiftKey ? addYears(current, 1) : addMonths(current, 1);
    default:
      return null;
  }
}

/** Next focused day (local midnight), clamped into `[min, max]`. Disabled days can be focused. */
export function getNextFocusedDate(
  current: Date,
  key: string,
  options: DayNavigationOptions,
): Date | null {
  const next = moveDay(current, key, options);
  return next && clampDay(next, options.min, options.max);
}

/** Moves within a 3-column grid; Home/End go to the start/end of the row. */
function moveInGrid(index: number, key: string, dir: TextDirection): number | null {
  const step = horizontalStep(key, dir);
  if (step !== null) return index + step;
  const rowStart = index - (index % GRID_COLUMNS);
  switch (key) {
    case 'ArrowUp':
      return index - GRID_COLUMNS;
    case 'ArrowDown':
      return index + GRID_COLUMNS;
    case 'Home':
      return rowStart;
    case 'End':
      return rowStart + GRID_COLUMNS - 1;
    default:
      return null;
  }
}

/** Next focused month (0 = January) in the month view; stays within January–December. */
export function getNextFocusedMonth(month: number, key: string, dir: TextDirection): number | null {
  const next = moveInGrid(month, key, dir);
  return next === null ? null : Math.min(11, Math.max(0, next));
}

/**
 * Next focused year in the year view. Rows are aligned to the 12-year page containing `year`;
 * moves may leave the page, and PageUp/PageDown jump a whole page.
 */
export function getNextFocusedYear(year: number, key: string, dir: TextDirection): number | null {
  if (key === 'PageUp') return year - YEAR_PAGE_SIZE;
  if (key === 'PageDown') return year + YEAR_PAGE_SIZE;
  const pageStart = getYearPageStart(year, YEAR_PAGE_SIZE);
  const next = moveInGrid(year - pageStart, key, dir);
  return next === null ? null : pageStart + next;
}
