import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import { CalendarView } from '../calendar/CalendarView';
import { PickerField } from '../field/PickerField';
import { PickerSurface } from '../overlay/PickerSurface';
import type { DatePickerProps } from './types';
import { usePicker } from './use-picker';

/** A single-date picker: a trigger that opens a calendar in a popover, or a sheet on phones. */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  function DatePicker(props, ref) {
    const { formatValue, closeOnSelect = true } = props;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const tabStopRef = useRef<HTMLButtonElement>(null);
    const idBase = useId();
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
        formatValue?.(value, locale) ?? localeInfo.formatDate(value),
    });

    const select = (date: Date | null) => {
      picker.setValue(date);
      if (closeOnSelect) picker.close('select');
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
        formValue={{ mode: 'single', name: props.name, value: picker.value }}
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
            min={props.min}
            max={props.max}
            disabledDates={props.disabledDates}
            weekStartsOn={props.weekStartsOn}
            showOutsideDays={props.showOutsideDays}
            renderDay={props.renderDay}
            selection={{ mode: 'single', value: picker.value, onChange: select }}
          />
        </PickerSurface>
      </PickerField>
    );
  },
);
