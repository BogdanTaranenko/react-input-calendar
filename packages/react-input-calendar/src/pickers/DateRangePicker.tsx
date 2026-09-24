import { forwardRef, useContext, useId, useImperativeHandle, useRef, useState } from 'react';
import { CalendarView, type CalendarViewProps } from '../calendar/CalendarView';
import { useSlots, type SlotProps } from '../core/slots';
import type { DateRange } from '../core/types';
import { isSameDay, startOfDay, startOfMonth } from '../date/date-math';
import { PickerField } from '../field/PickerField';
import type { LocaleInfo } from '../i18n/locale-info';
import { PickerSurface } from '../overlay/PickerSurface';
import { SurfaceContext } from '../overlay/surface-context';
import type { DateRangePickerProps, RangePreset } from './types';
import { usePicker } from './use-picker';

// Thin spaces around the dash, as ICU's formatRange puts them.
const formatPartialRange = (from: Date, localeInfo: LocaleInfo) =>
  `${localeInfo.formatDate(from)} – …`;

const isPresetActive = (preset: RangePreset, value: DateRange | null) => {
  if (!value?.to) return false;
  const range = preset.value();
  return isSameDay(range.from, value.from) && range.to !== null && isSameDay(range.to, value.to);
};

interface RangeContentProps extends SlotProps {
  calendar: Omit<CalendarViewProps, 'month' | 'onMonthChange' | 'numberOfMonths'>;
  value: DateRange | null;
  numberOfMonths?: number | undefined;
  presets?: RangePreset[] | undefined;
  presetsLabel: string;
  onPreset: (range: DateRange) => void;
}

/**
 * The surface's content. It mounts on open, so the visible month starts at the range again each
 * time, and it sits inside the surface, so it knows whether it is a sheet.
 */
function RangeContent({
  calendar,
  value,
  presets,
  presetsLabel,
  onPreset,
  ...props
}: RangeContentProps) {
  const surface = useContext(SurfaceContext);
  const slot = useSlots(props);
  const [month, setMonth] = useState(() => startOfMonth(value?.from ?? new Date()));
  const numberOfMonths = props.numberOfMonths ?? (surface?.isSheet ? 1 : 2);

  const pick = (preset: RangePreset) => {
    const range = preset.value();
    const from = startOfDay(range.from);
    setMonth(startOfMonth(from));
    onPreset({ from, to: range.to && startOfDay(range.to) });
  };

  return (
    <>
      {presets?.length ? (
        <div role="group" aria-label={presetsLabel} {...slot('presets')}>
          {presets.map((preset, index) => {
            const active = isPresetActive(preset, value);
            return (
              <button
                key={index}
                type="button"
                {...slot('preset')}
                aria-pressed={active}
                data-active={active || undefined}
                onClick={() => {
                  pick(preset);
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <CalendarView
        {...calendar}
        month={month}
        onMonthChange={setMonth}
        numberOfMonths={numberOfMonths}
      />
    </>
  );
}

/** A date-range picker: two months in a popover, one in a sheet, with optional presets. */
export const DateRangePicker = forwardRef<HTMLButtonElement, DateRangePickerProps>(
  function DateRangePicker(props, ref) {
    const { formatValue, minDays, maxDays } = props;
    const triggerRef = useRef<HTMLButtonElement>(null);
    const tabStopRef = useRef<HTMLButtonElement>(null);
    const idBase = useId();
    // PickerField always renders the trigger, and refs attach before layout effects run, so
    // the button exists by the time the handle is created. It never unmounts while the picker
    // is mounted, so the handle never needs to be recreated.
    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement, []);

    const picker = usePicker<DateRange | null>({
      ...props,
      triggerRef,
      defaultValue: props.defaultValue ?? null,
      emptyValue: null,
      isEmpty: (value) => value === null,
      // A half-picked range shows, and can be cleared, but does not satisfy `required`.
      isComplete: (value) => value?.to != null,
      format: (value, localeInfo, locale) =>
        formatValue?.(value, locale) ??
        (value.to
          ? localeInfo.formatDateRange(value.from, value.to)
          : formatPartialRange(value.from, localeInfo)),
    });

    // The first click starts the range and keeps the picker open; the second ends it. A preset
    // closes the picker the same way, so an open-ended one leaves it open for the end.
    const select = (range: DateRange | null) => {
      picker.setValue(range);
      if (range?.to) picker.close('select');
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
        formValue={{
          mode: 'range',
          startName: props.startName,
          endName: props.endName,
          value: picker.value,
        }}
      >
        <PickerSurface
          {...picker.surfaceProps}
          labelledBy={`${idBase}-caption-0`}
          initialFocusRef={tabStopRef}
        >
          <RangeContent
            value={picker.value}
            numberOfMonths={props.numberOfMonths}
            presets={props.presets}
            presetsLabel={picker.labels.presets}
            onPreset={select}
            classNames={props.classNames}
            styles={props.styles}
            calendar={{
              ...picker.calendarProps,
              idBase,
              tabStopRef,
              min: props.min,
              max: props.max,
              disabledDates: props.disabledDates,
              weekStartsOn: props.weekStartsOn,
              showOutsideDays: props.showOutsideDays,
              renderDay: props.renderDay,
              selection: { mode: 'range', value: picker.value, onChange: select, minDays, maxDays },
            }}
          />
        </PickerSurface>
      </PickerField>
    );
  },
);
