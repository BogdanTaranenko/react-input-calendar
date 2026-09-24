import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { defaultLabels } from '../i18n/labels';
import { HiddenInputs } from './HiddenInputs';
import { PickerField, type PickerFieldProps } from './PickerField';

const SEP_24 = new Date(2026, 8, 24);
const SEP_30 = new Date(2026, 8, 30);

/** Every hidden input, as `[name, value, disabled]`. */
function hiddenInputs() {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map(
    (input) => [input.name, input.value, input.disabled] as const,
  );
}

describe('HiddenInputs', () => {
  it('submits a single date as YYYY-MM-DD, and an empty one as an empty string', () => {
    const { rerender } = render(<HiddenInputs mode="single" name="start" value={SEP_24} />);
    expect(hiddenInputs()).toEqual([['start', '2026-09-24', false]]);

    rerender(<HiddenInputs mode="single" name="start" value={null} />);
    expect(hiddenInputs()).toEqual([['start', '', false]]);
  });

  it('submits a date with its time as YYYY-MM-DDTHH:mm', () => {
    render(<HiddenInputs mode="single" name="at" value={new Date(2026, 8, 24, 14, 30)} withTime />);
    expect(hiddenInputs()).toEqual([['at', '2026-09-24T14:30', false]]);
  });

  it('submits a range through its start and end names, the end empty while open', () => {
    const { rerender } = render(
      <HiddenInputs
        mode="range"
        startName="from"
        endName="to"
        value={{ from: SEP_24, to: SEP_30 }}
      />,
    );
    expect(hiddenInputs()).toEqual([
      ['from', '2026-09-24', false],
      ['to', '2026-09-30', false],
    ]);

    rerender(
      <HiddenInputs
        mode="range"
        startName="from"
        endName="to"
        value={{ from: SEP_24, to: null }}
      />,
    );
    expect(hiddenInputs()).toEqual([
      ['from', '2026-09-24', false],
      ['to', '', false],
    ]);

    rerender(<HiddenInputs mode="range" startName="from" value={null} />);
    expect(hiddenInputs()).toEqual([['from', '', false]]);
  });

  it('submits one input per date for multiple, and none when empty', () => {
    const { rerender } = render(
      <HiddenInputs mode="multiple" name="days" value={[SEP_24, SEP_30]} />,
    );
    expect(hiddenInputs()).toEqual([
      ['days', '2026-09-24', false],
      ['days', '2026-09-30', false],
    ]);

    rerender(<HiddenInputs mode="multiple" name="days" value={[]} />);
    expect(hiddenInputs()).toEqual([]);
  });

  it('renders nothing without a name', () => {
    render(
      <>
        <HiddenInputs mode="single" value={SEP_24} />
        <HiddenInputs mode="range" value={{ from: SEP_24, to: SEP_30 }} />
        <HiddenInputs mode="multiple" value={[SEP_24]} />
      </>,
    );
    expect(hiddenInputs()).toEqual([]);
  });

  it('disables every input of a disabled picker, so none is submitted', () => {
    render(
      <form>
        <HiddenInputs
          mode="range"
          startName="from"
          endName="to"
          value={{ from: SEP_24, to: SEP_30 }}
          disabled
        />
      </form>,
    );
    expect(hiddenInputs()).toEqual([
      ['from', '2026-09-24', true],
      ['to', '2026-09-30', true],
    ]);
    const form = document.querySelector('form') as HTMLFormElement;
    expect([...new FormData(form).keys()]).toEqual([]);
  });
});

const format = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);

type HarnessProps = Partial<PickerFieldProps> & {
  initial?: Date | null;
  onChange?: (value: Date | null) => void;
};

/** A field over plain state, the way `usePicker` drives it; the child picks Sep 24. */
function Harness({ initial = null, onChange, ...props }: HarnessProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState<Date | null>(initial);
  const [open, setOpen] = useState(false);
  const change = (next: Date | null) => {
    setValue(next);
    onChange?.(next);
  };
  return (
    <PickerField
      label="Start date"
      text={value ? format(value) : ''}
      hasValue={value !== null}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClear={() => {
        change(null);
      }}
      triggerRef={triggerRef}
      dir="ltr"
      colorScheme="system"
      labels={defaultLabels}
      formValue={{ mode: 'single', name: 'start', value }}
      {...props}
    >
      {open && (
        <button
          type="button"
          onClick={() => {
            change(SEP_24);
            setOpen(false);
          }}
        >
          Pick Sep 24
        </button>
      )}
    </PickerField>
  );
}

const root = () => document.querySelector('.ric-root') as HTMLElement;
const trigger = () => document.querySelector('.ric-trigger') as HTMLButtonElement;
const clearButton = () => screen.queryByRole('button', { name: 'Clear' });

describe('PickerField — trigger', () => {
  it('announces a dialog and whether it is open', async () => {
    render(<Harness />);
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(root()).not.toHaveAttribute('data-open');

    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(root()).toHaveAttribute('data-open');
  });

  it('is named by the label and the value together', () => {
    render(<Harness initial={SEP_24} />);
    expect(screen.getByRole('button', { name: /Start date Sep 24, 2026/ })).toBe(trigger());
    expect(screen.getByText('Start date')).toHaveClass('ric-label');
  });

  it('takes aria-labelledby or aria-label over the label, still followed by the value', () => {
    const { unmount } = render(
      <>
        <span id="outside">Departure</span>
        <Harness initial={SEP_24} aria-labelledby="outside" />
      </>,
    );
    expect(trigger()).toHaveAccessibleName('Departure Sep 24, 2026');
    unmount();

    render(<Harness initial={SEP_24} label={undefined} aria-labelledby="elsewhere" />);
    expect(trigger()).not.toHaveAttribute('aria-label');
    cleanup();

    render(<Harness initial={SEP_24} aria-label="Due date" />);
    expect(trigger()).toHaveAccessibleName('Due date Sep 24, 2026');
  });

  it('falls back to the open-calendar label without any label', () => {
    render(<Harness initial={SEP_24} label={undefined} />);
    expect(trigger()).toHaveAccessibleName('Open calendar Sep 24, 2026');
    expect(document.querySelector('.ric-label')).toBeNull();
  });

  it('shows the placeholder, marked by a presence-only data-placeholder, until there is a value', async () => {
    render(<Harness placeholder="Pick a date" />);
    expect(trigger()).toHaveAttribute('data-placeholder');
    expect(trigger()).toHaveAccessibleName('Start date Pick a date');

    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Pick Sep 24' }));
    expect(trigger()).not.toHaveAttribute('data-placeholder');
  });

  it('uses the id prop for the trigger', () => {
    render(<Harness id="start-date" />);
    expect(trigger()).toHaveAttribute('id', 'start-date');
  });

  it('shows the calendar icon, a custom icon, or none', () => {
    const { rerender } = render(<Harness />);
    const icon = document.querySelector('.ric-trigger-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelector('svg')).not.toBeNull();

    rerender(<Harness icon={<b data-testid="custom" />} />);
    expect(screen.getByTestId('custom').parentElement).toHaveClass('ric-trigger-icon');

    rerender(<Harness icon={false} />);
    expect(document.querySelector('.ric-trigger-icon')).toBeNull();
  });
});

describe('PickerField — clear', () => {
  it('resets the value to null, focuses the trigger, and disappears', async () => {
    const onChange = vi.fn();
    render(<Harness initial={SEP_24} onChange={onChange} />);
    const clear = clearButton();
    expect(clear).toHaveClass('ric-clear-button');
    expect(clear?.parentElement).toBe(trigger().parentElement);

    await userEvent.click(clear as HTMLElement);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
    expect(trigger()).toHaveFocus();
    expect(clearButton()).toBeNull();
  });

  it('is not rendered when empty', () => {
    render(<Harness />);
    expect(clearButton()).toBeNull();
  });

  it.each([
    ['not clearable', { clearable: false }],
    ['disabled', { disabled: true }],
    ['read-only', { readOnly: true }],
  ] as const)('is not rendered when %s', (_, props) => {
    render(<Harness initial={SEP_24} {...props} />);
    expect(clearButton()).toBeNull();
  });
});

describe('PickerField — states', () => {
  it('stays focusable but inert when read-only', async () => {
    const onOpen = vi.fn();
    render(<Harness initial={SEP_24} readOnly onOpen={onOpen} />);
    expect(root()).toHaveAttribute('data-readonly');
    expect(trigger()).toBeEnabled();
    expect(trigger()).not.toHaveAttribute('aria-readonly');

    await userEvent.click(trigger());
    expect(trigger()).toHaveFocus();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('disables the trigger and the hidden input when disabled', () => {
    render(<Harness initial={SEP_24} disabled />);
    expect(root()).toHaveAttribute('data-disabled');
    expect(trigger()).toBeDisabled();
    expect(hiddenInputs()).toEqual([['start', '2026-09-24', true]]);
  });

  it('mirrors the value into a hidden input', () => {
    render(<Harness initial={SEP_24} />);
    expect(hiddenInputs()).toEqual([['start', '2026-09-24', false]]);
  });

  it('describes the trigger with the description and the error', () => {
    const { rerender } = render(<Harness />);
    expect(trigger()).not.toHaveAttribute('aria-describedby');
    expect(trigger()).not.toHaveAttribute('aria-invalid');
    expect(root()).not.toHaveAttribute('data-invalid');

    rerender(<Harness description="Local time" error="Required" />);
    expect(trigger()).toHaveAccessibleDescription('Local time Required');
    expect(screen.getByText('Local time')).toHaveClass('ric-description');
    expect(screen.getByText('Required')).toHaveClass('ric-error');
    expect(screen.getByText('Required')).not.toHaveAttribute('role');
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(root()).toHaveAttribute('data-invalid');
  });

  it.each([
    ['false', false],
    ['an empty string', ''],
    ['null', null],
  ] as const)('treats a label, description or error of %s as absent', (_, node) => {
    render(<Harness label={node} description={node} error={node} />);
    expect(document.querySelector('.ric-label, .ric-description, .ric-error')).toBeNull();
    expect(trigger()).not.toHaveAttribute('aria-invalid');
    expect(trigger()).not.toHaveAttribute('aria-describedby');
    expect(trigger()).toHaveAttribute('aria-label', 'Open calendar');
  });

  it('sets the text direction and a forced colour scheme on the root', () => {
    const { rerender } = render(<Harness dir="rtl" colorScheme="dark" />);
    expect(root()).toHaveAttribute('dir', 'rtl');
    expect(root()).toHaveAttribute('data-ric-theme', 'dark');

    rerender(<Harness colorScheme="system" />);
    expect(root()).not.toHaveAttribute('data-ric-theme');
  });

  it('renders its children (the surface) inside the root', async () => {
    render(<Harness />);
    await userEvent.click(trigger());
    expect(root()).toContainElement(screen.getByRole('button', { name: 'Pick Sep 24' }));
  });

  it('puts classNames and styles on every slot, and className and style on the root', () => {
    render(
      <Harness
        initial={SEP_24}
        description="d"
        error="e"
        className="mine"
        style={{ width: 300 }}
        classNames={{
          root: 'r',
          label: 'l',
          field: 'f',
          trigger: 't',
          triggerValue: 'v',
          triggerIcon: 'i',
          clearButton: 'c',
          description: 'd',
          error: 'x',
        }}
        styles={{ root: { color: 'red' }, trigger: { color: 'blue' } }}
      />,
    );
    expect(root()).toHaveClass('ric-root', 'r', 'mine');
    expect(root()).toHaveStyle({ color: 'rgb(255, 0, 0)', width: '300px' });
    expect(trigger()).toHaveClass('ric-trigger', 't');
    expect(trigger()).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    for (const [selector, extra] of [
      ['.ric-label', 'l'],
      ['.ric-field', 'f'],
      ['.ric-trigger-value', 'v'],
      ['.ric-trigger-icon', 'i'],
      ['.ric-clear-button', 'c'],
      ['.ric-description', 'd'],
      ['.ric-error', 'x'],
    ] as const) {
      expect(document.querySelector(selector)).toHaveClass(extra);
    }
  });
});

describe('PickerField — required', () => {
  function renderForm(props: HarnessProps = {}) {
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    const ui = (extra: HarnessProps) => (
      <form>
        <Harness required {...props} {...extra} />
      </form>
    );
    const view = render(ui({}));
    const form = document.querySelector('form') as HTMLFormElement;
    form.addEventListener('submit', onSubmit);
    return {
      form,
      onSubmit,
      rerender: (extra: HarnessProps) => {
        view.rerender(ui(extra));
      },
    };
  }

  it('blocks submission while empty, focusing the trigger and marking the field invalid', () => {
    const { form, onSubmit } = renderForm();
    expect(form.checkValidity()).toBe(false);
    // Registered after React's handler, so it sees whether the browser's bubble was cancelled
    // (which in real browsers also stops focus moving to the hidden input; see Step 16).
    const cancelled: boolean[] = [];
    form.querySelector('input[required]')?.addEventListener('invalid', (event) => {
      cancelled.push(event.defaultPrevented);
    });

    act(() => {
      form.requestSubmit();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(cancelled).toEqual([true]);
    expect(document.activeElement).toBe(trigger());
    expect(root()).toHaveAttribute('data-invalid');
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the invalid mark once a value exists, and then submits', async () => {
    const { form, onSubmit } = renderForm();
    act(() => {
      form.requestSubmit();
    });
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Pick Sep 24' }));
    expect(root()).not.toHaveAttribute('data-invalid');
    expect(form.checkValidity()).toBe(true);

    act(() => {
      form.requestSubmit();
    });
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('adds no named field, and stays out of the tab order and the accessibility tree', () => {
    const { form } = renderForm({ initial: SEP_24 });
    const validator = form.querySelector('input[required]') as HTMLInputElement;
    expect(validator).toHaveAttribute('tabindex', '-1');
    expect(validator).toHaveAttribute('aria-hidden', 'true');
    expect(validator.name).toBe('');
    expect([...new FormData(form).keys()]).toEqual(['start']);
  });

  it.each([
    ['disabled', { disabled: true }],
    ['read-only', { readOnly: true }],
  ] as const)('never blocks submission when %s, like a native input', (_, props) => {
    const { form, onSubmit } = renderForm(props);
    expect(form.checkValidity()).toBe(true);
    act(() => {
      form.requestSubmit();
    });
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(root()).not.toHaveAttribute('data-invalid');
  });

  it('drops the invalid mark when the field stops being required', () => {
    const { form, rerender } = renderForm();
    act(() => {
      form.requestSubmit();
    });
    expect(root()).toHaveAttribute('data-invalid');

    rerender({ required: false });
    expect(root()).not.toHaveAttribute('data-invalid');
    expect(trigger()).not.toHaveAttribute('aria-invalid');
  });

  it('renders no validator unless required', () => {
    render(<Harness />);
    expect(document.querySelector('input[required]')).toBeNull();
  });
});
