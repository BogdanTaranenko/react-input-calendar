import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { useCalendarConfig, useLabels } from '../core/config-context';
import { isDateUnavailable } from '../core/matchers';
import { getNextFocusedDate } from '../core/navigation';
import { useSlots } from '../core/slots';
import { useResolvedLocale } from '../core/use-resolved-locale';
import { useSwipe } from '../core/use-swipe';
import { addMonths, compareDay, isSameDay, isSameMonth, startOfMonth } from '../date/date-math';
import { parseISODate, toISODate } from '../date/iso';
import { getLocaleInfo } from '../i18n/locale-info';
import { SurfaceContext } from '../overlay/surface-context';
import { CalendarHeader } from './CalendarHeader';
import { CalendarSubView, type FocusTarget } from './CalendarSubView';
import type { DayFlags } from './DayCell';
import { DayGrid } from './DayGrid';
import { LiveRegion } from './LiveRegion';
import { createSelectionModel, getSelectedDates } from './selection-model';
import type { CalendarSelection, CalendarViewOptions } from './types';
import { useCalendarState, useToday } from './use-calendar-state';

export interface CalendarViewProps extends CalendarViewOptions {
  selection: CalendarSelection;
  /** Prefix for internal ids; caption `i` gets `${idBase}-caption-${i}`. Pickers name their dialog by it. */
  idBase?: string | undefined;
  /** Attached to the grid's tab stop, for a dialog's initial focus. */
  tabStopRef?: Ref<HTMLButtonElement> | undefined;
  /** Reports the day holding the tab stop on mount and whenever it moves to another day. */
  onFocusedDateChange?: ((date: Date) => void) | undefined;
}

const MAX_MONTHS = 3;

/** `button[tabindex="0"]` is the grid's tab stop in every view; `.ric-caption` always renders. */
const FOCUS_SELECTORS: Record<FocusTarget, string> = {
  tabStop: 'button[tabindex="0"]',
  caption: '.ric-caption',
};

function clampMonthCount(count: number | undefined): number {
  if (count === undefined || !Number.isFinite(count)) return 1;
  return Math.min(MAX_MONTHS, Math.max(1, Math.trunc(count)));
}

/**
 * The calendar body shared by `Calendar` and the pickers. Renders no `root` slot.
 *
 * With no month and no value there is nothing to show until "today" is known, which is only
 * after hydration: the server's clock (often UTC) and the browser's can disagree on the month.
 * Until then an empty, `aria-busy` shell renders, identically on the server and the client.
 */
export function CalendarView(props: CalendarViewProps) {
  const today = useToday();
  const slot = useSlots(props);
  const localeInfo = getLocaleInfo(useResolvedLocale(props.locale));
  const anchor = props.month ?? props.defaultMonth ?? getSelectedDates(props.selection)[0] ?? today;

  if (anchor === null) {
    return <div {...slot('calendar')} dir={localeInfo.dir} aria-busy="true" />;
  }
  return <CalendarBody {...props} anchor={anchor} today={today} />;
}

interface CalendarBodyProps extends CalendarViewProps {
  anchor: Date;
  today: Date | null;
}

function CalendarBody(props: CalendarBodyProps) {
  const { selection, min, max, disabledDates, today, autoFocus = false } = props;
  const config = useCalendarConfig();
  const localeInfo = getLocaleInfo(useResolvedLocale(props.locale));
  const weekStartsOn = props.weekStartsOn ?? config.weekStartsOn ?? localeInfo.weekStartsOn;
  const numberOfMonths = clampMonthCount(props.numberOfMonths);
  const showOutsideDays = numberOfMonths === 1 && (props.showOutsideDays ?? true);
  const labels = useLabels(props.labels);
  const slot = useSlots(props);
  const generatedId = useId();
  const baseId = props.idBase ?? generatedId;
  const [hovered, setHovered] = useState<Date | null>(null);

  const state = useCalendarState({
    anchor: props.anchor,
    numberOfMonths,
    focusCandidates: [...getSelectedDates(selection), today],
    month: props.month,
    onMonthChange: props.onMonthChange,
    min,
    max,
  });
  const { visibleMonth, focusedDate } = state;

  // Keyed by the day, not the Date object; the latest callback is read through a ref.
  const focusedDay = toISODate(focusedDate);
  const reportFocus = useRef(props.onFocusedDateChange);
  useLayoutEffect(() => {
    reportFocus.current = props.onFocusedDateChange;
  });
  useEffect(() => {
    const date = parseISODate(focusedDay);
    if (date) reportFocus.current?.(date);
  }, [focusedDay]);
  const months = Array.from({ length: numberOfMonths }, (_, i) => addMonths(visibleMonth, i));
  const captions = months.map((month) => localeInfo.formatMonthYear(month));
  const captionId = (index: number) => `${baseId}-caption-${String(index)}`;

  // Move DOM focus only in the commit after a keyboard move, a view switch (or on mount with
  // autoFocus), never on an ordinary render, so the calendar cannot steal focus. No deps: the
  // target is consumed by the very next commit, so it can never linger and fire later.
  const monthsRef = useRef<HTMLDivElement>(null);
  const focusTarget = useRef<FocusTarget | null>(autoFocus ? 'tabStop' : null);
  useLayoutEffect(() => {
    const target = focusTarget.current;
    if (target === null) return;
    focusTarget.current = null;
    monthsRef.current?.querySelector<HTMLElement>(FOCUS_SELECTORS[target])?.focus();
  });
  const requestFocus = (target: FocusTarget) => {
    focusTarget.current = target;
  };

  const isUnavailable = (date: Date) => isDateUnavailable(date, { min, max, disabledDates });
  const model = createSelectionModel(selection, {
    hovered,
    lastVisibleDay: state.lastVisibleDay,
    isUnavailable,
  });

  const dayFlags = (date: Date, month: Date): DayFlags => ({
    ...model.dayState(date),
    outside: !isSameMonth(date, month),
    today: today !== null && isSameDay(today, date),
    focused: isSameDay(focusedDate, date),
    unavailable: isUnavailable(date),
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const next = getNextFocusedDate(focusedDate, event.key, {
      dir: localeInfo.dir,
      weekStartsOn,
      shiftKey: event.shiftKey,
      min,
      max,
    });
    if (!next) return;
    event.preventDefault();
    requestFocus('tabStop');
    state.focusDate(next);
  };

  // Whatever put focus on a day (Tab, a click, a screen reader's cursor) makes it the tab
  // stop, so arrow keys always move from the day that actually has focus. It also previews.
  const handleFocus = (date: Date) => {
    setHovered(date);
    if (!isSameDay(date, focusedDate)) state.focusDate(date);
  };

  const handleSelect = (date: Date) => {
    state.focusDate(date);
    if (!isUnavailable(date)) model.select(date);
  };

  const previousDisabled = min !== undefined && compareDay(visibleMonth, startOfMonth(min)) <= 0;
  const lastMonth = addMonths(visibleMonth, numberOfMonths - 1);
  const nextDisabled = max !== undefined && compareDay(lastMonth, startOfMonth(max)) >= 0;
  const goToPrevious = () => {
    if (!previousDisabled) state.goToMonth(addMonths(visibleMonth, -1));
  };
  const goToNext = () => {
    if (!nextDisabled) state.goToMonth(addMonths(visibleMonth, 1));
  };

  // In a bottom sheet a horizontal swipe on the day grid turns the page, following the reading
  // direction: the next month comes in from the end side.
  const isSheet = useContext(SurfaceContext)?.isSheet ?? false;
  const rtl = localeInfo.dir === 'rtl';
  useSwipe(monthsRef, {
    enabled: isSheet && state.view === 'days',
    onSwipeLeft: rtl ? goToPrevious : goToNext,
    onSwipeRight: rtl ? goToNext : goToPrevious,
  });

  // Escape leaves the month and year views; defaultPrevented tells a surrounding dialog that
  // the key was used, so it stays open.
  const handleCalendarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (state.view === 'days' || event.key !== 'Escape') return;
    event.preventDefault();
    requestFocus('tabStop');
    state.showDays();
  };

  const openMonthView = (month: Date) => {
    requestFocus('caption');
    state.showMonths(month);
  };

  const dayMonths = months.map((month, index) => {
    const caption = localeInfo.formatMonthYear(month);
    return (
      <div key={index} {...slot('month')}>
        <CalendarHeader
          month={month}
          caption={caption}
          captionId={captionId(index)}
          captionLabel={`${caption}, ${labels.chooseMonth}`}
          onCaption={openMonthView}
          previousLabel={labels.previousMonth}
          nextLabel={labels.nextMonth}
          showPrevious={index === 0}
          showNext={index === numberOfMonths - 1}
          previousDisabled={previousDisabled}
          nextDisabled={nextDisabled}
          onPrevious={goToPrevious}
          onNext={goToNext}
          slot={slot}
        />
        <DayGrid
          key={toISODate(month)}
          month={month}
          weekStartsOn={weekStartsOn}
          captionId={captionId(index)}
          direction={state.direction}
          multiselectable={selection.mode === 'multiple'}
          showOutsideDays={showOutsideDays}
          dayFlags={dayFlags}
          localeInfo={localeInfo}
          labels={labels}
          renderDay={props.renderDay}
          slot={slot}
          onSelect={handleSelect}
          onHover={setHovered}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          tabStopRef={props.tabStopRef}
        />
      </div>
    );
  });

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Escape bubbles up from the view's own controls
    <div {...slot('calendar')} dir={localeInfo.dir} onKeyDown={handleCalendarKeyDown}>
      <div
        {...slot('months')}
        ref={monthsRef}
        onPointerLeave={() => {
          setHovered(null);
        }}
      >
        {state.view === 'days'
          ? dayMonths
          : [
              // Key 0, like the first day month, so the caption button keeps its DOM node.
              <div key={0} {...slot('month')}>
                <CalendarSubView
                  state={state}
                  captionId={captionId(0)}
                  selectedDates={getSelectedDates(selection)}
                  today={today}
                  min={min}
                  max={max}
                  localeInfo={localeInfo}
                  labels={labels}
                  slot={slot}
                  onFocusRequest={requestFocus}
                />
              </div>,
            ]}
      </div>
      <LiveRegion message={state.navigated ? localeInfo.formatList(captions) : ''} slot={slot} />
    </div>
  );
}
