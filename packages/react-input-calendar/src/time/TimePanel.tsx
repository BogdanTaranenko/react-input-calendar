import { useMemo } from 'react';
import { useLabels } from '../core/config-context';
import { useSlots, type SlotProps } from '../core/slots';
import { useResolvedLocale } from '../core/use-resolved-locale';
import type { TimeOfDay } from '../date/date-math';
import type { CalendarLabels } from '../i18n/labels';
import { getLocaleInfo, type HourCycle } from '../i18n/locale-info';
import { TimeColumn, type TimeColumnOption } from './TimeColumn';
import {
  from24h,
  getHourOptions,
  getMinuteOptions,
  isTimeUnavailable,
  to24h,
  type DayPeriod,
} from './time-utils';

export interface TimePanelProps extends SlotProps {
  /** The date whose time is shown; its day is the one `min`/`max` are checked against. */
  value: Date | null;
  onChange: (time: TimeOfDay) => void;
  /** Default: the locale's clock. */
  hourCycle?: HourCycle | undefined;
  /** Default `5`. */
  minuteStep?: number | undefined;
  min?: Date | undefined;
  max?: Date | undefined;
  locale?: string | undefined;
  labels?: Partial<CalendarLabels> | undefined;
}

const PERIODS: readonly DayPeriod[] = ['am', 'pm'];

function numberOption(value: number, label: string, disabled: boolean): TimeColumnOption {
  return { value, label, disabled, keys: [String(value), String(value).padStart(2, '0'), label] };
}

/** Hours, minutes and (on a 12-hour clock) AM/PM columns. DOM order never changes; CSS follows `dir`. */
export function TimePanel(props: TimePanelProps) {
  const { value, min, max, onChange } = props;
  const locale = useResolvedLocale(props.locale);
  const localeInfo = getLocaleInfo(locale);
  const labels = useLabels(props.labels);
  const slot = useSlots(props);
  const hourCycle = props.hourCycle ?? localeInfo.hourCycle;
  const minuteStep = props.minuteStep ?? 5;
  // Memoised so an odd step warns once, not on every render.
  const minuteOptions = useMemo(() => getMinuteOptions(minuteStep), [minuteStep]);
  const digits = useMemo(() => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }), [locale]);

  const hours = value?.getHours() ?? null;
  const minutes = value?.getMinutes() ?? null;
  const period: DayPeriod = hours !== null && hours >= 12 ? 'pm' : 'am';

  // Without a value there is no day to check the limits against.
  const unavailable = (h: number, m: number) =>
    value !== null && isTimeUnavailable(value, h, m, { min, max });
  // Computed once per render and shared by the hour and AM/PM columns: hour 0–23 is
  // unavailable when none of its minute options is allowed.
  const blockedHours = Array.from({ length: 24 }, (_, h) => minuteOptions.every((m) => unavailable(h, m)));
  const hourUnavailable = (h: number) => blockedHours[h] === true;
  // A value off the minute step selects no option; focus starts on the nearest one instead.
  const nearestMinute =
    minutes === null
      ? null
      : minuteOptions.reduce((best, m) => (Math.abs(m - minutes) < Math.abs(best - minutes) ? m : best));
  const toHour24 = (hour: number) => (hourCycle === 12 ? to24h(hour, period) : hour);

  const hourColumn = getHourOptions(hourCycle).map((hour) =>
    numberOption(hour, digits.format(hour), hourUnavailable(toHour24(hour))),
  );
  const minuteColumn = minuteOptions.map((minute) =>
    numberOption(minute, digits.format(minute), hours !== null && unavailable(hours, minute)),
  );
  const periodColumn = PERIODS.map((name, index): TimeColumnOption => {
    const label = localeInfo.dayPeriodNames[name];
    const disabled = getHourOptions(12).every((hour) => hourUnavailable(to24h(hour, name)));
    return { value: index, label, disabled, keys: [label.toLowerCase(), name] };
  });

  const selectedHour = hours === null ? null : hourCycle === 12 ? from24h(hours).hour12 : hours;

  return (
    <div {...slot('timePanel')}>
      <TimeColumn
        label={labels.hours}
        options={hourColumn}
        selected={selectedHour}
        onSelect={(hour) => {
          onChange({ hours: toHour24(hour), minutes: minutes ?? 0 });
        }}
        slot={slot}
      />
      <TimeColumn
        label={labels.minutes}
        options={minuteColumn}
        selected={minutes}
        defaultFocus={nearestMinute}
        onSelect={(minute) => {
          onChange({ hours: hours ?? 0, minutes: minute });
        }}
        slot={slot}
      />
      {hourCycle === 12 && (
        <TimeColumn
          label={labels.dayPeriod}
          options={periodColumn}
          selected={hours === null ? null : PERIODS.indexOf(period)}
          onSelect={(index) => {
            onChange({ hours: ((hours ?? 0) % 12) + (index === 1 ? 12 : 0), minutes: minutes ?? 0 });
          }}
          slot={slot}
        />
      )}
    </div>
  );
}
