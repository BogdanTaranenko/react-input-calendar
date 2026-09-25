import { forwardRef, useId, useImperativeHandle, useRef, useState } from 'react';
import { CalendarView } from '../calendar/CalendarView';
import { applyTime } from '../core/selection';
import { useSlots } from '../core/slots';
import { startOfDay, withTime, type TimeOfDay } from '../date/date-math';
import { PickerField } from '../field/PickerField';
import { PickerSurface } from '../overlay/PickerSurface';
import { TimePanel } from '../time/TimePanel';
import { DEFAULT_MINUTE_STEP, roundToStep, snapToStepWithin } from '../time/time-utils';
import type { DateTimePickerProps } from './types';
import { usePicker } from './use-picker';

const timeOf = (date: Date): TimeOfDay => ({ hours: date.getHours(), minutes: date.getMinutes() });

/**
 * A date and time picker: calendar and time panel side by side (stacked in the sheet). Every
 * change is committed at once; the picker closes on Done, Escape or an outside press.
 */
export const DateTimePicker = forwardRef<HTMLButtonElement, DateTimePickerProps>(
  function DateTimePicker(props, ref) {
    const { formatValue, hourCycle, min, max } = props;
    const minuteStep = props.minuteStep ?? DEFAULT_MINUTE_STEP;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const tabStopRef = useRef<HTMLButtonElement>(null);
    // The day holding the calendar's tab stop: before any day is picked, a time goes on it and
    // the time panel checks the limits against it.
    const [focusedDay, setFocusedDay] = useState<Date | null>(null);
    const idBase = useId();
    const slot = useSlots(props);
    // PickerField always renders the trigger, and refs attach before layout effects run, so
    // the button exists by the time the handle is created. It never unmounts while the picker
    // is mounted, so the handle never needs to be recreated.
    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement, []);

    const picker = usePicker<Date | null>({
      ...props,
      triggerRef,
      defaultValue: props.defaultValue ?? null,
      emptyValue: null,
      isEmpty: (value) => value === null,
      format: (value, localeInfo, locale) =>
        formatValue?.(value, locale) ??
        localeInfo.formatDateTime(value, hourCycle ?? localeInfo.hourCycle),
    });
    const { value } = picker;

    // Clamped into the limits and, when clamping lands off the minute step, onto the step, so
    // the time panel can show it. A time that does not exist that day (a DST spring-forward
    // gap) moves forward by the gap, as Date does.
    const commit = (day: Date, time: TimeOfDay) => {
      const clamped = applyTime(day, time, { min, max });
      const wasClamped = clamped.getTime() !== withTime(day, time).getTime();
      picker.setValue(wasClamped ? snapToStepWithin(clamped, minuteStep, { min, max }) : clamped);
    };

    // A new day keeps the current time; a first one gets the default time, or now.
    const selectDay = (day: Date | null) => {
      // Only for the type: a single-mode calendar always selects, never clears.
      if (day === null) return;
      const time = value
        ? timeOf(value)
        : (props.defaultTime ?? timeOf(roundToStep(new Date(), minuteStep)));
      commit(day, time);
    };
    const selectTime = (time: TimeOfDay) => {
      commit(value ?? focusedDay ?? startOfDay(new Date()), time);
    };

    return (
      <PickerField
        {...picker.fieldProps}
        label={props.label}
        description={props.description}
        error={props.error}
        placeholder={props.placeholder}
        required={props.required}
        id={props.id}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        clearable={props.clearable}
        icon={props.icon}
        className={props.className}
        style={props.style}
        formValue={{ mode: 'single', name: props.name, value, withTime: true }}
      >
        <PickerSurface
          {...picker.surfaceProps}
          labelledBy={`${idBase}-caption-0`}
          initialFocusRef={tabStopRef}
        >
          <CalendarView
            {...picker.calendarProps}
            idBase={idBase}
            tabStopRef={tabStopRef}
            onFocusedDateChange={setFocusedDay}
            min={min}
            max={max}
            disabledDates={props.disabledDates}
            weekStartsOn={props.weekStartsOn}
            showOutsideDays={props.showOutsideDays}
            renderDay={props.renderDay}
            selection={{ mode: 'single', value, onChange: selectDay }}
          />
          <TimePanel
            {...picker.calendarProps}
            value={value}
            day={focusedDay}
            onChange={selectTime}
            hourCycle={hourCycle}
            minuteStep={minuteStep}
            min={min}
            max={max}
          />
          <div {...slot('footer')}>
            <button
              type="button"
              {...slot('doneButton')}
              onClick={() => {
                picker.close('done');
              }}
            >
              {picker.labels.done}
            </button>
          </div>
        </PickerSurface>
      </PickerField>
    );
  },
);
