import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import { CalendarView } from '../calendar/CalendarView';
import { useSlots } from '../core/slots';
import { PickerField } from '../field/PickerField';
import { PickerSurface } from '../overlay/PickerSurface';
import type { MultiDatePickerProps } from './types';
import { usePicker } from './use-picker';

/** Up to this many days are listed on the trigger; more show a count. */
const MAX_LISTED = 3;

/** A picker for any set of days. It stays open while days are toggled, until Done. */
export const MultiDatePicker = forwardRef<HTMLButtonElement, MultiDatePickerProps>(
  function MultiDatePicker(props, ref) {
    const { formatValue, maxSelected } = props;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const tabStopRef = useRef<HTMLButtonElement>(null);
    const idBase = useId();
    const slot = useSlots(props);
    // PickerField always renders the trigger, and refs attach before layout effects run, so
    // the button exists by the time the handle is created. It never unmounts while the picker
    // is mounted, so the handle never needs to be recreated.
    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement, []);

    const picker = usePicker<Date[]>({
      ...props,
      triggerRef,
      // Fresh arrays, never a shared constant: the empty value reaches onChange, and a consumer
      // that mutates it must not empty-poison other pickers.
      defaultValue: props.defaultValue ?? [],
      emptyValue: [],
      isEmpty: (value) => value.length === 0,
      format: (value, localeInfo, locale, labels) =>
        formatValue?.(value, locale) ??
        (value.length > MAX_LISTED
          ? labels.selectedDates(value.length)
          : localeInfo.formatList(value.map(localeInfo.formatShortDate))),
    });

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
        formValue={{ mode: 'multiple', name: props.name, value: picker.value }}
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
            selection={{
              mode: 'multiple',
              value: picker.value,
              onChange: picker.setValue,
              maxSelected,
            }}
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
