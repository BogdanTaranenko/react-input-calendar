import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiDatePicker } from './MultiDatePicker';
import type { MultiDatePickerProps } from './types';

// Thursday, September 24, 2026, noon local time.
const TODAY = new Date(2026, 8, 24, 12);
const sep = (day: number) => new Date(2026, 8, day);

/** ICU emits U+2009 / U+202F in some formats; compare text with plain spaces. */
const norm = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');
const trigger = () => document.querySelector('.ric-trigger') as HTMLButtonElement;
const triggerText = () => norm(trigger().querySelector('.ric-trigger-value')?.textContent);
const dialog = () => screen.queryByRole('dialog');
const doneButton = () => screen.getByRole('button', { name: 'Done' });
const day = (day: number) =>
  screen.getByRole('button', { name: new RegExp(`^\\w+, September ${String(day)}, 2026`) });
const ymd = (dates: unknown) =>
  (dates as Date[]).map((d) => [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()]);

function renderPicker(props: Partial<MultiDatePickerProps> = {}) {
  return render(<MultiDatePicker label="Days off" locale="en-US" {...props} />);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('MultiDatePicker — opening', () => {
  it('opens a dialog named by the caption, with the grid focused and Done after the month', async () => {
    renderPicker();
    await userEvent.click(trigger());

    expect(dialog()).toHaveAccessibleName('September 2026');
    const grid = within(dialog() as HTMLElement).getByRole('grid');
    expect(grid).toContainElement(document.activeElement as HTMLElement);
    const footer = document.querySelector('.ric-footer') as HTMLElement;
    expect(footer).toContainElement(doneButton());
    expect(doneButton()).toHaveClass('ric-done-button');
    expect(doneButton()).toHaveAttribute('type', 'button');
    expect(grid.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('MultiDatePicker — choosing', () => {
  it('stays open on each toggle and lists up to three days on the trigger', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    await userEvent.click(trigger());
    await userEvent.click(day(9));
    await userEvent.click(day(3));
    await userEvent.click(day(12));

    expect(dialog()).not.toBeNull();
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(ymd(onChange.mock.lastCall?.[0])).toEqual([
      [2026, 9, 3, 0],
      [2026, 9, 9, 0],
      [2026, 9, 12, 0],
    ]);
    expect(triggerText()).toBe('Sep 3, Sep 9, and Sep 12');

    await userEvent.click(day(20));
    expect(triggerText()).toBe('4 dates');

    await userEvent.click(day(9));
    expect(ymd(onChange.mock.lastCall?.[0])).toEqual([
      [2026, 9, 3, 0],
      [2026, 9, 12, 0],
      [2026, 9, 20, 0],
    ]);
    expect(triggerText()).toBe('Sep 3, Sep 12, and Sep 20');
  });

  it('shows one day on its own and two joined', () => {
    const { rerender } = renderPicker({ value: [sep(3)] });
    expect(triggerText()).toBe('Sep 3');
    rerender(<MultiDatePicker locale="en-US" value={[sep(3), sep(9)]} />);
    expect(triggerText()).toBe('Sep 3 and Sep 9');
  });

  it('closes on Done and returns focus to the trigger, keeping the days', async () => {
    const onOpenChange = vi.fn();
    renderPicker({ onOpenChange });
    await userEvent.click(trigger());
    await userEvent.click(day(3));
    await userEvent.click(doneButton());

    expect(dialog()).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger()).toHaveFocus();
    expect(triggerText()).toBe('Sep 3');
  });

  it('closes on Escape, keeping the days already toggled', async () => {
    renderPicker();
    await userEvent.click(trigger());
    await userEvent.click(day(3));
    await userEvent.keyboard('{Escape}');
    expect(dialog()).toBeNull();
    expect(triggerText()).toBe('Sep 3');
  });

  it('blocks a third day with maxSelected=2 until one is removed', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, maxSelected: 2 });
    await userEvent.click(trigger());
    await userEvent.click(day(3));
    await userEvent.click(day(9));
    await userEvent.click(day(12));

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(triggerText()).toBe('Sep 3 and Sep 9');

    await userEvent.click(day(3));
    await userEvent.click(day(12));
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(triggerText()).toBe('Sep 9 and Sep 12');
  });

  it('clears to an empty list', async () => {
    const onChange = vi.fn();
    renderPicker({ defaultValue: [sep(3), sep(9)], onChange });
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith([]);
    expect(trigger()).toHaveAttribute('data-placeholder');
  });

  it('hands each picker its own empty list, so mutating a cleared value leaks nowhere', async () => {
    const mutate = (dates: Date[]) => {
      dates.push(sep(9));
    };
    const ui = (extra: Partial<MultiDatePickerProps> = {}) => (
      <>
        <MultiDatePicker locale="en-US" label="A" defaultValue={[sep(3)]} onChange={mutate} />
        <MultiDatePicker locale="en-US" label="B" placeholder="None yet" {...extra} />
      </>
    );
    const { rerender } = render(ui());
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    rerender(ui({ description: 'rerendered' }));

    const triggers = document.querySelectorAll('.ric-trigger');
    expect(triggers[1]).toHaveTextContent('None yet');
    render(<MultiDatePicker locale="en-US" placeholder="Fresh" />);
    expect(document.querySelectorAll('.ric-trigger')[2]).toHaveTextContent('Fresh');
  });

  it('formats the trigger with formatValue and the resolved locale', () => {
    const formatValue = vi.fn(() => 'custom');
    renderPicker({ defaultValue: [sep(3)], formatValue });
    expect(trigger()).toHaveTextContent('custom');
    expect(formatValue).toHaveBeenCalledWith([sep(3)], 'en-US');
  });

  it('uses custom done and count labels', async () => {
    renderPicker({
      defaultValue: [sep(1), sep(2), sep(3), sep(4)],
      labels: { done: 'Finish', selectedDates: (count) => `${String(count)} days` },
    });
    expect(triggerText()).toBe('4 days');
    await userEvent.click(trigger());
    expect(screen.getByRole('button', { name: 'Finish' })).not.toBeNull();
  });
});

describe('MultiDatePicker — forms', () => {
  it('submits one ISO date per day under its name', () => {
    render(
      <form>
        <MultiDatePicker locale="en-US" name="days" defaultValue={[sep(3), sep(9), sep(12)]} />
      </form>,
    );
    const form = document.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).getAll('days')).toEqual(['2026-09-03', '2026-09-09', '2026-09-12']);
  });

  it('blocks a required form while empty', () => {
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    render(
      <form>
        <MultiDatePicker locale="en-US" required />
      </form>,
    );
    const form = document.querySelector('form') as HTMLFormElement;
    form.addEventListener('submit', onSubmit);
    act(() => {
      form.requestSubmit();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector('.ric-root')).toHaveAttribute('data-invalid');
  });
});

describe('MultiDatePicker — control', () => {
  it('respects a controlled open', async () => {
    const onOpenChange = vi.fn();
    renderPicker({ open: true, onOpenChange });
    expect(dialog()).not.toBeNull();
    await userEvent.click(doneButton());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog()).not.toBeNull();
  });

  it('forwards the calendar props', async () => {
    renderPicker({
      min: sep(2),
      max: sep(26),
      disabledDates: { dayOfWeek: [5] },
      weekStartsOn: 1,
      showOutsideDays: false,
      renderDay: (cell) => <i>{cell.formatted}*</i>,
    });
    await userEvent.click(trigger());
    const grid = within(dialog() as HTMLElement).getByRole('grid');
    expect(within(grid).getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Monday');
    for (const unavailable of [1, 25, 28]) {
      expect(day(unavailable)).toHaveAttribute('aria-disabled', 'true');
    }
    expect(within(grid).queryByRole('button', { name: /August 31, 2026/ })).toBeNull();
    expect(day(24)).toHaveTextContent('24*');
  });

  it('forwards its ref to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<MultiDatePicker ref={ref} locale="en-US" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(trigger());
  });

  it('puts classNames and styles on the footer slots, and className on the root', async () => {
    renderPicker({
      className: 'mine',
      classNames: { footer: 'f-row', doneButton: 'f-done', grid: 'f-grid' },
      styles: { doneButton: { color: 'red' } },
    });
    await userEvent.click(trigger());
    expect(document.querySelector('.ric-root')).toHaveClass('mine');
    expect(document.querySelector('.ric-footer')).toHaveClass('f-row');
    expect(doneButton()).toHaveClass('f-done');
    expect(doneButton()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(screen.getByRole('grid')).toHaveClass('f-grid');
  });
});
