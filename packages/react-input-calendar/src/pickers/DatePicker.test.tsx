import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatePicker } from './DatePicker';
import type { DatePickerProps } from './types';

// Thursday, September 24, 2026, noon local time.
const TODAY = new Date(2026, 8, 24, 12);
const SEP_10 = new Date(2026, 8, 10);

const trigger = () => document.querySelector('.ric-trigger') as HTMLButtonElement;
const dialog = () => screen.queryByRole('dialog');
const focusedLabel = () => document.activeElement?.getAttribute('aria-label');

function renderPicker(props: Partial<DatePickerProps> = {}) {
  return render(<DatePicker label="Start date" locale="en-US" {...props} />);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DatePicker — opening', () => {
  it('opens a dialog named by the caption, with today focused in the grid', async () => {
    renderPicker();
    expect(dialog()).toBeNull();
    await userEvent.click(trigger());

    expect(dialog()).toHaveAccessibleName('September 2026');
    expect(within(dialog() as HTMLElement).getByRole('grid')).toContainElement(
      document.activeElement as HTMLElement,
    );
    expect(focusedLabel()).toMatch(/^Thursday, September 24, 2026/);
  });

  it('focuses the selected day', async () => {
    renderPicker({ defaultValue: SEP_10 });
    await userEvent.click(trigger());
    expect(focusedLabel()).toMatch(/^Thursday, September 10, 2026/);
  });

  it('prefers the caption over the fallback dialog label, and follows the month', async () => {
    renderPicker({ labels: { calendarDialog: 'Pick a start date' } });
    await userEvent.click(trigger());
    expect(dialog()).not.toHaveAttribute('aria-label');
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(dialog()).toHaveAccessibleName('October 2026');
  });
});

describe('DatePicker — choosing', () => {
  it('picks the focused day with Enter at local midnight, closes and focuses the trigger', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    await userEvent.click(trigger());
    await userEvent.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledOnce();
    const picked = onChange.mock.calls[0]?.[0] as Date;
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()]).toEqual([2026, 8, 24]);
    expect([picked.getHours(), picked.getMinutes(), picked.getSeconds()]).toEqual([0, 0, 0]);
    expect(dialog()).toBeNull();
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveTextContent('Sep 24, 2026');
    expect(trigger()).toHaveAccessibleName('Start date Sep 24, 2026');
  });

  it('stays open after picking when closeOnSelect is false', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, closeOnSelect: false });
    await userEvent.click(trigger());
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenCalledOnce();
    expect(dialog()).not.toBeNull();
    expect(trigger()).toHaveTextContent('Sep 25, 2026');
  });

  it('closes on Escape without changing the value', async () => {
    const onChange = vi.fn();
    renderPicker({ defaultValue: SEP_10, onChange });
    await userEvent.click(trigger());
    await userEvent.keyboard('{ArrowRight}{Escape}');
    expect(dialog()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent('Sep 10, 2026');
    expect(trigger()).toHaveFocus();
  });

  it('does not pick an unavailable day', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, min: new Date(2026, 8, 20) });
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: /September 10, 2026/ }));
    expect(onChange).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
  });

  it('formats the trigger with formatValue and the resolved locale', () => {
    const formatValue = vi.fn(
      (date: Date, locale: string) => `${locale}:${String(date.getDate())}`,
    );
    renderPicker({ defaultValue: SEP_10, formatValue });
    expect(trigger()).toHaveTextContent('en-US:10');
  });

  it('submits the value through its name', () => {
    render(
      <form>
        <DatePicker name="start" defaultValue={SEP_10} locale="en-US" />
      </form>,
    );
    const form = document.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('start')).toBe('2026-09-10');
  });
});

describe('DatePicker — control', () => {
  it('respects a controlled open', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = renderPicker({ open: false, onOpenChange });
    await userEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(dialog()).toBeNull();

    rerender(<DatePicker label="Start date" locale="en-US" open onOpenChange={onOpenChange} />);
    expect(dialog()).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(dialog()).not.toBeNull();
  });

  it('follows a controlled value', async () => {
    function Controlled() {
      const [value, setValue] = useState<Date | null>(SEP_10);
      return (
        <>
          <DatePicker locale="en-US" value={value} onChange={setValue} />
          <output>{value ? value.getDate() : 'none'}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(trigger());
    await userEvent.keyboard('{ArrowLeft}{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('9');
    expect(trigger()).toHaveTextContent('Sep 9, 2026');
  });

  it('forwards the field props', () => {
    render(
      <form>
        <DatePicker
          locale="en-US"
          id="due"
          aria-label="Due date"
          description="Local time"
          error="Pick a day"
          placeholder="None yet"
          icon={<b data-testid="icon" />}
          required
        />
      </form>,
    );
    expect(trigger()).toHaveAttribute('id', 'due');
    expect(trigger()).toHaveAccessibleName('Due date None yet');
    expect(trigger()).toHaveAccessibleDescription('Local time Pick a day');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect((document.querySelector('form') as HTMLFormElement).checkValidity()).toBe(false);
  });

  it('forwards aria-labelledby, and clearable', () => {
    render(
      <>
        <span id="outside">Departure</span>
        <DatePicker
          locale="en-US"
          aria-labelledby="outside"
          defaultValue={SEP_10}
          clearable={false}
        />
      </>,
    );
    expect(trigger()).toHaveAccessibleName('Departure Sep 10, 2026');
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('forwards the calendar props', async () => {
    const onChange = vi.fn();
    renderPicker({
      onChange,
      max: new Date(2026, 8, 26),
      disabledDates: { dayOfWeek: [5] },
      weekStartsOn: 1,
      showOutsideDays: false,
      renderDay: (day) => <i>{day.formatted}*</i>,
    });
    await userEvent.click(trigger());
    const grid = within(dialog() as HTMLElement).getByRole('grid');
    expect(within(grid).getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Monday');
    expect(within(grid).getByRole('button', { name: /September 25, 2026/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(grid).getByRole('button', { name: /September 28, 2026/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(grid).queryByRole('button', { name: /August 31, 2026/ })).toBeNull();
    expect(within(grid).getByRole('button', { name: /September 24, 2026/ })).toHaveTextContent(
      '24*',
    );
  });

  it('forwards its ref to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<DatePicker ref={ref} locale="en-US" />);
    expect(ref.current).toBe(trigger());
  });

  it('puts className and style on the root and classNames on every part', async () => {
    renderPicker({
      className: 'mine',
      style: { width: 300 },
      classNames: { root: 'r', trigger: 't', popover: 'p', dayButton: 'd', caption: 'c' },
    });
    const root = document.querySelector('.ric-root') as HTMLElement;
    expect(root).toHaveClass('r', 'mine');
    expect(root).toHaveStyle({ width: '300px' });
    expect(trigger()).toHaveClass('t');

    await userEvent.click(trigger());
    expect(dialog()).toHaveClass('ric-popover', 'p');
    expect(root).toContainElement(dialog());
    expect(document.activeElement).toHaveClass('d');
    expect(document.querySelector('.ric-caption')).toHaveClass('c');
    // The root slot belongs to the field alone, never to the embedded calendar.
    expect(document.querySelectorAll('.r')).toHaveLength(1);
  });
});
