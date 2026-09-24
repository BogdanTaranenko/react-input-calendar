import type { KeyboardEvent, ReactNode, Ref } from 'react';
import type { SlotAttributes, SlotName } from '../core/slots';
import type { WeekStartsOn } from '../date/date-math';
import { getMonthWeeks } from '../date/grid';
import { toISODate } from '../date/iso';
import type { CalendarLabels } from '../i18n/labels';
import type { LocaleInfo } from '../i18n/locale-info';
import { DayCell, type DayFlags } from './DayCell';
import type { DayRenderProps } from './types';
import type { SlideDirection } from './use-calendar-state';

export interface DayGridProps {
  month: Date;
  weekStartsOn: WeekStartsOn;
  captionId: string;
  direction: SlideDirection;
  multiselectable: boolean;
  showOutsideDays: boolean;
  /** Everything a cell needs to know about its day, relative to this grid's month. */
  dayFlags: (date: Date, month: Date) => DayFlags;
  localeInfo: LocaleInfo;
  labels: CalendarLabels;
  renderDay: ((day: DayRenderProps) => ReactNode) | undefined;
  slot: (name: SlotName) => SlotAttributes;
  onSelect: (date: Date) => void;
  onHover: (date: Date) => void;
  onFocus: (date: Date) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTableElement>) => void;
  tabStopRef?: Ref<HTMLButtonElement> | undefined;
}

/** One month's day `grid`: a weekday header row and always 6 weeks. */
export function DayGrid(props: DayGridProps) {
  const { month, weekStartsOn, localeInfo, slot } = props;
  const weeks = getMonthWeeks(month.getFullYear(), month.getMonth(), weekStartsOn);
  const weekdays = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);

  return (
    <table
      {...slot('grid')}
      role="grid"
      aria-labelledby={props.captionId}
      aria-multiselectable={props.multiselectable || undefined}
      data-direction={props.direction}
      onKeyDown={props.onKeyDown}
    >
      <thead>
        <tr {...slot('weekdays')}>
          {weekdays.map((weekday) => (
            <th
              key={weekday}
              {...slot('weekday')}
              scope="col"
              abbr={localeInfo.weekdayNames.long[weekday]}
            >
              {localeInfo.weekdayNames.short[weekday]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, row) => (
          <tr key={row} {...slot('week')}>
            {week.map((date) => (
              <DayCell
                key={toISODate(date)}
                date={date}
                flags={props.dayFlags(date, month)}
                showOutsideDays={props.showOutsideDays}
                localeInfo={localeInfo}
                labels={props.labels}
                renderDay={props.renderDay}
                slot={slot}
                onSelect={props.onSelect}
                onHover={props.onHover}
                onFocus={props.onFocus}
                tabStopRef={props.tabStopRef}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
