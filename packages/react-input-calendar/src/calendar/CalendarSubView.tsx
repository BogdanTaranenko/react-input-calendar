import type { SlotAttributes, SlotName } from '../core/slots';
import { makeDate } from '../date/date-math';
import { getYearPageStart } from '../date/grid';
import type { CalendarLabels } from '../i18n/labels';
import type { LocaleInfo } from '../i18n/locale-info';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import type { CalendarState } from './use-calendar-state';
import { formatYearPage, YearView } from './YearView';

/** Where `CalendarView` moves DOM focus in the next commit. */
export type FocusTarget = 'tabStop' | 'caption';

export interface CalendarSubViewProps {
  state: CalendarState;
  captionId: string;
  selectedDates: readonly Date[];
  today: Date | null;
  min: Date | undefined;
  max: Date | undefined;
  localeInfo: LocaleInfo;
  labels: CalendarLabels;
  slot: (name: SlotName) => SlotAttributes;
  onFocusRequest: (target: FocusTarget) => void;
}

const YEAR_PAGE = 12;
const noop = () => undefined;

/** The month or year view: a header and a 3 × 4 grid, replacing every day month. */
export function CalendarSubView(props: CalendarSubViewProps) {
  return props.state.view === 'years' ? <YearSubView {...props} /> : <MonthSubView {...props} />;
}

function MonthSubView(props: CalendarSubViewProps) {
  const { state, onFocusRequest, ...viewProps } = props;
  const { localeInfo, labels } = viewProps;
  const caption = localeInfo.formatYear(state.viewFocus);

  return (
    <>
      <CalendarHeader
        month={state.viewFocus}
        caption={caption}
        captionId={props.captionId}
        captionLabel={`${caption}, ${labels.chooseYear}`}
        onCaption={() => {
          onFocusRequest('caption');
          state.showYears();
        }}
        previousLabel={labels.previousYears}
        nextLabel={labels.nextYears}
        showPrevious={false}
        showNext={false}
        previousDisabled
        nextDisabled
        onPrevious={noop}
        onNext={noop}
        slot={props.slot}
      />
      <MonthView
        {...viewProps}
        focusedMonth={state.viewFocus}
        onSelect={(month) => {
          onFocusRequest('tabStop');
          state.pickMonth(month);
        }}
        onFocus={(month) => {
          if (month.getMonth() !== state.viewFocus.getMonth()) state.focusView(month);
        }}
        onMove={(month) => {
          onFocusRequest('tabStop');
          state.moveView(month);
        }}
      />
    </>
  );
}

function YearSubView(props: CalendarSubViewProps) {
  const { state, onFocusRequest, ...viewProps } = props;
  const { localeInfo, labels, min, max } = viewProps;
  const focusedYear = state.viewFocus.getFullYear();
  const pageStart = getYearPageStart(focusedYear, YEAR_PAGE);
  // The focused month rides along, so picking a year keeps it in the month view.
  const toYear = (year: number) => makeDate(year, state.viewFocus.getMonth(), 1);

  return (
    <>
      <CalendarHeader
        month={state.viewFocus}
        caption={formatYearPage(focusedYear, localeInfo)}
        captionId={props.captionId}
        captionLabel={undefined}
        onCaption={() => {
          onFocusRequest('caption');
          state.showDays();
        }}
        previousLabel={labels.previousYears}
        nextLabel={labels.nextYears}
        showPrevious
        showNext
        previousDisabled={min !== undefined && pageStart <= min.getFullYear()}
        nextDisabled={max !== undefined && pageStart + YEAR_PAGE - 1 >= max.getFullYear()}
        onPrevious={() => {
          state.moveView(toYear(focusedYear - YEAR_PAGE));
        }}
        onNext={() => {
          state.moveView(toYear(focusedYear + YEAR_PAGE));
        }}
        slot={props.slot}
      />
      <YearView
        {...viewProps}
        focusedYear={focusedYear}
        onSelect={(year) => {
          onFocusRequest('tabStop');
          state.pickYear(year);
        }}
        onFocus={(year) => {
          if (year !== focusedYear) state.focusView(toYear(year));
        }}
        onMove={(year) => {
          onFocusRequest('tabStop');
          state.moveView(toYear(year));
        }}
      />
    </>
  );
}
