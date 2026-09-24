import { useCalendarConfig } from '../core/config-context';
import { useSlots } from '../core/slots';
import { useControllableState } from '../core/use-controllable-state';
import type { DateRange } from '../core/types';
import { CalendarView } from './CalendarView';
import type {
  CalendarMultipleProps,
  CalendarProps,
  CalendarRangeProps,
  CalendarSelection,
  CalendarSingleProps,
} from './types';

type RootProps = Omit<CalendarSingleProps, 'mode' | 'value' | 'defaultValue' | 'onChange'>;

const NO_DATES: Date[] = [];

/** The `root` wrapper: theme attribute, className/style, then the calendar body. */
function CalendarRoot({
  className,
  style,
  colorScheme,
  selection,
  ...viewProps
}: RootProps & { selection: CalendarSelection }) {
  const config = useCalendarConfig();
  const scheme = colorScheme ?? config.colorScheme ?? 'system';
  const root = useSlots(viewProps)('root', className);
  return (
    <div
      className={root.className}
      style={{ ...root.style, ...style }}
      data-ric-theme={scheme === 'system' ? undefined : scheme}
    >
      <CalendarView {...viewProps} selection={selection} />
    </div>
  );
}

function SingleCalendar({ value, defaultValue = null, onChange, ...rest }: CalendarSingleProps) {
  const [date, setDate] = useControllableState<Date | null>({ value, defaultValue, onChange });
  return <CalendarRoot {...rest} selection={{ mode: 'single', value: date, onChange: setDate }} />;
}

function RangeCalendar(props: CalendarRangeProps) {
  const { value, defaultValue = null, onChange, minDays, maxDays, ...rest } = props;
  const [range, setRange] = useControllableState<DateRange | null>({
    value,
    defaultValue,
    onChange,
  });
  return (
    <CalendarRoot
      {...rest}
      selection={{ mode: 'range', value: range, onChange: setRange, minDays, maxDays }}
    />
  );
}

function MultipleCalendar(props: CalendarMultipleProps) {
  const { value, defaultValue = NO_DATES, onChange, maxSelected, ...rest } = props;
  const [dates, setDates] = useControllableState<Date[]>({ value, defaultValue, onChange });
  return (
    <CalendarRoot
      {...rest}
      selection={{ mode: 'multiple', value: dates, onChange: setDates, maxSelected }}
    />
  );
}

/**
 * An inline, always-visible calendar. `mode` picks single, range or multiple selection;
 * changing it remounts the calendar with that mode's own value.
 */
export function Calendar(props: CalendarProps) {
  switch (props.mode) {
    case 'range':
      return <RangeCalendar {...props} />;
    case 'multiple':
      return <MultipleCalendar {...props} />;
    default:
      return <SingleCalendar {...props} />;
  }
}
