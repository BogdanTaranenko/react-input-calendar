import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useCalendarConfig, useLabels, type ColorScheme } from '../core/config-context';
import type { SlotClassNames, SlotStyles } from '../core/slots';
import { useControllableState } from '../core/use-controllable-state';
import { useResolvedLocale } from '../core/use-resolved-locale';
import type { CalendarLabels } from '../i18n/labels';
import { getLocaleInfo, type LocaleInfo, type TextDirection } from '../i18n/locale-info';
import type { Placement } from '../overlay/compute-position';
import type { CloseReason } from '../overlay/use-modal-dialog';

export interface UsePickerOptions<T> {
  /**
   * The trigger button, owned by the picker: reading a ref-named property off this hook's
   * result during render would trip React Compiler's ref rules.
   */
  triggerRef: RefObject<HTMLButtonElement | null>;
  value?: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** What the clear button sets. */
  emptyValue: T;
  isEmpty: (value: T) => boolean;
  /** Whether a non-empty value satisfies `required`. Default: any non-empty value does. */
  isComplete?: ((value: T) => boolean) | undefined;
  /** Trigger text for a non-empty value. */
  format: (
    value: NonNullable<T>,
    localeInfo: LocaleInfo,
    locale: string,
    labels: CalendarLabels,
  ) => string;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  locale?: string | undefined;
  labels?: Partial<CalendarLabels> | undefined;
  colorScheme?: ColorScheme | undefined;
  placement?: Placement | undefined;
  mobileBreakpoint?: number | false | undefined;
  classNames?: SlotClassNames | undefined;
  styles?: SlotStyles | undefined;
}

/**
 * State and wiring every picker shares: the value and open state (each controlled or not),
 * the resolved locale, merged labels and config defaults. The picker spreads `fieldProps` on
 * `PickerField`, `surfaceProps` on `PickerSurface` and `calendarProps` on its calendar.
 */
export function usePicker<T>(options: UsePickerOptions<T>) {
  const { triggerRef, disabled = false, readOnly = false, classNames, styles } = options;
  const config = useCalendarConfig();
  const locale = useResolvedLocale(options.locale);
  const localeInfo = getLocaleInfo(locale);
  const labels = useLabels(options.labels);

  const [value, setValue] = useControllableState({
    value: options.value,
    defaultValue: options.defaultValue,
    onChange: options.onChange,
  });
  const [open, setOpen] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
  });

  // A native reset restores the default, as it does for an <input>. The listener sits on the
  // document so it runs after the form's own handlers (React's included) and can skip a
  // cancelled reset. The form is read once at mount: a trigger moved to another form later
  // (a changed `form` attribute) keeps listening to the first one.
  const onReset = useRef<() => void>(() => undefined);
  useLayoutEffect(() => {
    onReset.current = () => {
      setValue(options.defaultValue);
    };
  });
  useEffect(() => {
    const form = triggerRef.current?.form;
    if (!form) return;
    const document = form.ownerDocument;
    const listener = (event: Event) => {
      if (event.target === form && !event.defaultPrevented) onReset.current();
    };
    document.addEventListener('reset', listener);
    return () => {
      document.removeEventListener('reset', listener);
    };
  }, [triggerRef]);

  // Every reason closes the same way; focus returns to the trigger through useModalDialog.
  const close: (reason: CloseReason) => void = () => {
    setOpen(false);
  };
  const hasValue = !options.isEmpty(value);
  const dir: TextDirection = localeInfo.dir;

  return {
    value,
    setValue,
    close,
    locale,
    localeInfo,
    labels,
    fieldProps: {
      // isEmpty is the runtime check that rules out null here.
      text: hasValue ? options.format(value as NonNullable<T>, localeInfo, locale, labels) : '',
      hasValue,
      complete: hasValue && (options.isComplete?.(value) ?? true),
      open,
      onOpen: () => {
        if (!disabled && !readOnly) setOpen(true);
      },
      onClear: () => {
        setValue(options.emptyValue);
      },
      triggerRef,
      dir,
      colorScheme: options.colorScheme ?? config.colorScheme ?? 'system',
      labels,
      disabled,
      readOnly,
      classNames,
      styles,
    },
    surfaceProps: {
      open,
      onClose: close,
      anchorRef: triggerRef,
      placement: options.placement,
      dir,
      mobileBreakpoint: options.mobileBreakpoint,
      label: labels.calendarDialog,
      classNames,
      styles,
    },
    // The calendar merges labels with the provider itself, so it gets the raw prop.
    calendarProps: { locale, labels: options.labels, classNames, styles },
  };
}
