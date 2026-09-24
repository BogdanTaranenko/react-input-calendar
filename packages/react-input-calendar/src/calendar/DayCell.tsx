import type { ReactNode, Ref } from 'react';
import type { SlotAttributes, SlotName } from '../core/slots';
import type { CalendarLabels } from '../i18n/labels';
import type { LocaleInfo } from '../i18n/locale-info';
import type { SelectionDayState } from './selection-model';
import type { DayRenderProps } from './types';

export interface DayFlags extends SelectionDayState {
  outside: boolean;
  today: boolean;
  focused: boolean;
  /** Outside min/max or matched by disabledDates. */
  unavailable: boolean;
}

export interface DayCellProps {
  date: Date;
  flags: DayFlags;
  showOutsideDays: boolean;
  localeInfo: LocaleInfo;
  labels: CalendarLabels;
  renderDay: ((day: DayRenderProps) => ReactNode) | undefined;
  slot: (name: SlotName) => SlotAttributes;
  onSelect: (date: Date) => void;
  /** The pointer entered the day (drives the range preview). */
  onHover: (date: Date) => void;
  /** The day's button received focus by any means (keyboard, pointer, screen reader). */
  onFocus: (date: Date) => void;
  /** Attached to the button while it is the grid's tab stop. */
  tabStopRef?: Ref<HTMLButtonElement> | undefined;
}

function buildLabel(date: Date, flags: DayFlags, disabled: boolean, props: DayCellProps): string {
  const { labels } = props;
  const parts = [props.localeInfo.formatDayLabel(date)];
  if (flags.rangeStart) parts.push(labels.rangeStart);
  if (flags.rangeEnd) parts.push(labels.rangeEnd);
  if (disabled) parts.push(labels.unavailable);
  return parts.join(', ');
}

/**
 * One `gridcell`. State is exposed as presence-only data attributes on the `td`.
 * `data-selected` marks the day itself or a range end; days inside a range get `data-in-range`.
 */
export function DayCell(props: DayCellProps) {
  const { date, flags, slot } = props;

  if (flags.outside && !props.showOutsideDays) {
    return <td {...slot('day')} role="gridcell" data-outside />;
  }

  const disabled = flags.unavailable || flags.blocked;
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const formatted = props.localeInfo.formatDayNumber(date);
  const dayProps: DayRenderProps = {
    date,
    formatted,
    selected: flags.selected,
    rangeStart: flags.rangeStart,
    rangeEnd: flags.rangeEnd,
    inRange: flags.inRange,
    today: flags.today,
    outside: flags.outside,
    disabled,
    focused: flags.focused,
    weekend,
  };

  return (
    <td
      {...slot('day')}
      role="gridcell"
      aria-selected={flags.selected}
      data-selected={(flags.selected && !flags.inRange) || undefined}
      data-range-start={flags.rangeStart || undefined}
      data-range-end={flags.rangeEnd || undefined}
      data-in-range={flags.inRange || undefined}
      data-preview={flags.preview || undefined}
      data-today={flags.today || undefined}
      data-outside={flags.outside || undefined}
      data-disabled={disabled || undefined}
      data-focused={flags.focused || undefined}
      data-weekend={weekend || undefined}
    >
      <button
        type="button"
        {...slot('dayButton')}
        ref={flags.focused ? props.tabStopRef : undefined}
        tabIndex={flags.focused ? 0 : -1}
        aria-label={buildLabel(date, flags, disabled, props)}
        aria-disabled={disabled || undefined}
        aria-current={flags.today ? 'date' : undefined}
        onClick={() => {
          props.onSelect(date);
        }}
        onPointerEnter={() => {
          props.onHover(date);
        }}
        onFocus={() => {
          props.onFocus(date);
        }}
      >
        {props.renderDay ? props.renderDay(dayProps) : formatted}
      </button>
    </td>
  );
}
