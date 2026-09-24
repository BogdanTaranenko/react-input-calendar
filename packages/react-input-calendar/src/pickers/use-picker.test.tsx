import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useRef, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarConfigProvider, type CalendarConfig } from '../core/config-context';
import type { LocaleInfo } from '../i18n/locale-info';
import { usePicker, type UsePickerOptions } from './use-picker';

const SEP_24 = new Date(2026, 8, 24);

type Options = Partial<UsePickerOptions<Date | null>>;

const triggerRef = createRef<HTMLButtonElement>();

function setup(options: Options = {}, config?: CalendarConfig) {
  const wrapper = config
    ? ({ children }: { children: ReactNode }) => (
        <CalendarConfigProvider {...config}>{children}</CalendarConfigProvider>
      )
    : undefined;
  return renderHook(
    (props: Options) =>
      usePicker<Date | null>({
        triggerRef,
        defaultValue: null,
        emptyValue: null,
        isEmpty: (value) => value === null,
        format: (value, localeInfo) => localeInfo.formatDate(value),
        locale: 'en-US',
        ...props,
      }),
    { initialProps: options, wrapper },
  );
}

describe('usePicker — value', () => {
  it('keeps an uncontrolled value and formats it for the trigger', () => {
    const onChange = vi.fn();
    const { result } = setup({ onChange });
    expect(result.current.value).toBeNull();
    expect(result.current.fieldProps).toMatchObject({ text: '', hasValue: false });

    act(() => {
      result.current.setValue(SEP_24);
    });
    expect(result.current.value).toBe(SEP_24);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(SEP_24);
    expect(result.current.fieldProps).toMatchObject({ text: 'Sep 24, 2026', hasValue: true });
  });

  it('follows a controlled value', () => {
    const onChange = vi.fn();
    const { result, rerender } = setup({ value: SEP_24, onChange });
    act(() => {
      result.current.setValue(null);
    });
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
    expect(result.current.value).toBe(SEP_24);

    rerender({ value: null, onChange });
    expect(result.current.value).toBeNull();
  });

  it('passes the format the resolved locale and its info', () => {
    const format = vi.fn(
      (_: Date | null, info: LocaleInfo, locale: string) => `${locale}|${info.dir}`,
    );
    const { result } = setup({ defaultValue: SEP_24, format, locale: 'ar' });
    expect(result.current.fieldProps.text).toBe('ar|rtl');
  });

  it('clears to the empty value', () => {
    const onChange = vi.fn();
    const { result } = setup({ defaultValue: SEP_24, onChange });
    act(() => {
      result.current.fieldProps.onClear();
    });
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
    expect(result.current.fieldProps.hasValue).toBe(false);
  });
});

describe('usePicker — open state', () => {
  it('opens from the trigger and closes with close()', () => {
    const onOpenChange = vi.fn();
    const { result } = setup({ onOpenChange });
    expect(result.current.fieldProps.open).toBe(false);

    act(() => {
      result.current.fieldProps.onOpen();
    });
    expect(result.current.fieldProps.open).toBe(true);
    expect(result.current.surfaceProps.open).toBe(true);

    act(() => {
      result.current.close('select');
    });
    expect(result.current.surfaceProps.open).toBe(false);
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('closes when the surface asks to', () => {
    const { result } = setup({ defaultOpen: true });
    expect(result.current.surfaceProps.open).toBe(true);
    act(() => {
      result.current.surfaceProps.onClose('escape');
    });
    expect(result.current.fieldProps.open).toBe(false);
  });

  it('respects a controlled open', () => {
    const onOpenChange = vi.fn();
    const { result } = setup({ open: false, onOpenChange });
    act(() => {
      result.current.fieldProps.onOpen();
    });
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(result.current.surfaceProps.open).toBe(false);
  });

  it.each([
    ['disabled', { disabled: true }],
    ['read-only', { readOnly: true }],
  ] as const)('does not open when %s', (_, options) => {
    const onOpenChange = vi.fn();
    const { result } = setup({ ...options, onOpenChange });
    act(() => {
      result.current.fieldProps.onOpen();
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(result.current.fieldProps.open).toBe(false);
  });

  it('anchors the surface to the trigger and names it', () => {
    const { result } = setup({ placement: 'top-end', mobileBreakpoint: false });
    expect(result.current.surfaceProps).toMatchObject({
      anchorRef: triggerRef,
      placement: 'top-end',
      mobileBreakpoint: false,
      dir: 'ltr',
      label: 'Choose date',
    });
    expect(result.current.fieldProps.triggerRef).toBe(triggerRef);
  });
});

describe('usePicker — locale, labels and config', () => {
  it('uses the prop locale over the provider one', () => {
    const { result } = setup({ locale: 'ar' }, { locale: 'en-GB' });
    expect(result.current.locale).toBe('ar');
    expect(result.current.localeInfo.dir).toBe('rtl');
    expect(result.current.fieldProps.dir).toBe('rtl');
    expect(result.current.calendarProps.locale).toBe('ar');
  });

  it('falls back to the provider locale', () => {
    const { result } = setup({ locale: undefined }, { locale: 'de-DE' });
    expect(result.current.locale).toBe('de-DE');
  });

  it('merges labels: prop over provider over defaults', () => {
    const { result } = setup(
      { labels: { clear: 'Reset' } },
      { labels: { clear: 'Leeren', calendarDialog: 'Datum wählen' } },
    );
    expect(result.current.labels).toMatchObject({ clear: 'Reset', calendarDialog: 'Datum wählen' });
    expect(result.current.fieldProps.labels).toBe(result.current.labels);
    expect(result.current.surfaceProps.label).toBe('Datum wählen');
    expect(result.current.calendarProps.labels).toEqual({ clear: 'Reset' });
  });

  it('resolves the colour scheme: prop over provider over system', () => {
    expect(setup().result.current.fieldProps.colorScheme).toBe('system');
    expect(setup({}, { colorScheme: 'dark' }).result.current.fieldProps.colorScheme).toBe('dark');
    expect(
      setup({ colorScheme: 'light' }, { colorScheme: 'dark' }).result.current.fieldProps
        .colorScheme,
    ).toBe('light');
  });

  it('forwards slot classNames and styles to the field, surface and calendar', () => {
    const classNames = { trigger: 't' };
    const styles = { popover: { color: 'red' } };
    const { result } = setup({ classNames, styles });
    for (const props of [
      result.current.fieldProps,
      result.current.surfaceProps,
      result.current.calendarProps,
    ]) {
      expect(props).toMatchObject({ classNames, styles });
    }
  });
});

const SEP_30 = new Date(2026, 8, 30);

/** A picker's trigger inside a form, with a button that picks Sep 30. */
function FormPicker(props: Options) {
  const ownRef = useRef<HTMLButtonElement>(null);
  const picker = usePicker<Date | null>({
    triggerRef: ownRef,
    defaultValue: null,
    emptyValue: null,
    isEmpty: (value) => value === null,
    format: (value, localeInfo) => localeInfo.formatDate(value),
    locale: 'en-US',
    ...props,
  });
  return (
    <>
      <button ref={ownRef} type="button">
        {picker.fieldProps.text || 'Empty'}
      </button>
      <button
        type="button"
        onClick={() => {
          picker.setValue(SEP_30);
        }}
      >
        Pick Sep 30
      </button>
    </>
  );
}

describe('usePicker — native form reset', () => {
  it('restores the default value of an uncontrolled picker', async () => {
    render(
      <form>
        <FormPicker defaultValue={SEP_24} />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Pick Sep 30' }));
    expect(screen.getByText('Sep 30, 2026')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('Sep 24, 2026')).toBeInTheDocument();
  });

  it('reports the default value for a controlled picker', async () => {
    const onChange = vi.fn();
    render(
      <form>
        <FormPicker value={SEP_30} onChange={onChange} />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('ignores a cancelled reset, and resets of other forms', async () => {
    const onChange = vi.fn();
    render(
      <>
        <form
          onReset={(event) => {
            event.preventDefault();
          }}
        >
          <FormPicker value={SEP_30} onChange={onChange} />
          <button type="reset">Reset</button>
        </form>
        <form>
          <button type="reset">Reset other</button>
        </form>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset other' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('stops listening on unmount', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <form>
        <FormPicker value={SEP_30} onChange={onChange} />
        <button type="reset">Reset</button>
      </form>,
    );
    rerender(
      <form>
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
