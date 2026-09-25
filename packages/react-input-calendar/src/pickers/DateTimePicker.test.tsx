import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DateTimePicker } from './DateTimePicker';
import type { DateTimePickerProps } from './types';

// Thursday, September 24, 2026, noon local time.
const TODAY = new Date(2026, 8, 24, 12);
const sep = (day: number, hours = 0, minutes = 0) => new Date(2026, 8, day, hours, minutes);

/** ICU emits U+2009 / U+202F in some formats; compare text with plain spaces. */
const norm = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');
const trigger = () => document.querySelector('.ric-trigger') as HTMLButtonElement;
const triggerText = () => norm(trigger().querySelector('.ric-trigger-value')?.textContent);
const dialog = () => screen.queryByRole('dialog');
const doneButton = () => screen.getByRole('button', { name: 'Done' });
const day = (day: number) =>
  screen.getByRole('button', { name: new RegExp(`^\\w+, September ${String(day)}, 2026`) });
const column = (name: string) => screen.getByRole('listbox', { name });
const option = (name: string, label: string) =>
  within(column(name)).getByRole('option', { name: label });
const parts = (value: unknown) => {
  const date = value as Date;
  return [date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()];
};

function renderPicker(props: Partial<DateTimePickerProps> = {}) {
  return render(<DateTimePicker label="Meeting" locale="en-US" hourCycle={24} {...props} />);
}

beforeEach(() => {
  Element.prototype.scrollTo = vi.fn();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DateTimePicker — layout', () => {
  it('shows the calendar, then the time panel, then Done, with the grid focused', async () => {
    renderPicker();
    await userEvent.click(trigger());

    expect(dialog()).toHaveAccessibleName('September 2026');
    const grid = within(dialog() as HTMLElement).getByRole('grid');
    expect(grid).toContainElement(document.activeElement as HTMLElement);
    const panel = document.querySelector('.ric-time-panel') as HTMLElement;
    const footer = document.querySelector('.ric-footer') as HTMLElement;
    expect(grid.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(panel.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(footer).toContainElement(doneButton());
    expect(doneButton()).toHaveAttribute('type', 'button');
  });
});

describe('DateTimePicker — choosing', () => {
  it('picks a day and then 14:30, committing each change and staying open', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    await userEvent.click(trigger());
    await userEvent.click(day(24));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 24, 12, 0]);

    await userEvent.click(option('Hours', '14'));
    await userEvent.click(option('Minutes', '30'));
    expect(onChange).toHaveBeenCalledTimes(3);
    const picked = onChange.mock.lastCall?.[0] as Date;
    expect(parts(picked)).toEqual([9, 24, 14, 30]);
    expect([picked.getSeconds(), picked.getMilliseconds()]).toEqual([0, 0]);
    expect(dialog()).not.toBeNull();
    expect(triggerText()).toBe('Sep 24, 2026, 14:30');
  });

  it('gives a first day the current time rounded to minuteStep', async () => {
    vi.setSystemTime(new Date(2026, 8, 24, 12, 8));
    const onChange = vi.fn();
    renderPicker({ onChange, minuteStep: 15 });
    await userEvent.click(trigger());
    await userEvent.click(day(10));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 10, 12, 15]);
  });

  it('gives a first day the defaultTime', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, defaultTime: { hours: 9, minutes: 15 } });
    await userEvent.click(trigger());
    await userEvent.click(day(10));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 10, 9, 15]);
  });

  it('keeps the time when another day is picked', async () => {
    const onChange = vi.fn();
    renderPicker({
      onChange,
      defaultValue: sep(10, 14, 30),
      defaultTime: { hours: 9, minutes: 0 },
    });
    await userEvent.click(trigger());
    await userEvent.click(day(12));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 12, 14, 30]);
  });

  it('applies a time picked before any day to the focused day', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    await userEvent.click(trigger());
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await userEvent.click(option('Hours', '08'));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 26, 8, 0]);
  });

  it("changes the time on the value's day even when focus has moved to another day", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, defaultValue: sep(10, 9, 0) });
    await userEvent.click(trigger());
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.click(option('Hours', '15'));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 10, 15, 0]);
  });

  it('closes on Done and returns focus, keeping the value', async () => {
    const onOpenChange = vi.fn();
    renderPicker({ onOpenChange });
    await userEvent.click(trigger());
    await userEvent.click(day(24));
    await userEvent.click(doneButton());
    expect(dialog()).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger()).toHaveFocus();
    expect(triggerText()).toBe('Sep 24, 2026, 12:00');
  });

  it('closes on Escape without reverting, since every change is already committed', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, defaultValue: sep(10, 9, 0) });
    await userEvent.click(trigger());
    await userEvent.click(day(12));
    await userEvent.keyboard('{Escape}');
    expect(dialog()).toBeNull();
    expect(onChange).toHaveBeenCalledOnce();
    expect(triggerText()).toBe('Sep 12, 2026, 09:00');
  });

  it('clears to null', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, defaultValue: sep(10, 9, 0) });
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(trigger()).toHaveAttribute('data-placeholder');
  });
});

describe('DateTimePicker — clock', () => {
  it('shows AM/PM with hourCycle={12}, overriding a 24-hour locale', async () => {
    render(<DateTimePicker locale="en-GB" hourCycle={12} defaultValue={sep(24, 14, 30)} />);
    expect(triggerText()).toBe('24 Sept 2026, 02:30 pm');
    await userEvent.click(trigger());
    expect(column('AM/PM')).not.toBeNull();
  });

  it("has no AM/PM with hourCycle={24}, and follows the locale's clock by default", async () => {
    const { unmount } = renderPicker({ defaultValue: sep(24, 14, 30) });
    await userEvent.click(trigger());
    expect(screen.queryByRole('listbox', { name: 'AM/PM' })).toBeNull();
    unmount();

    render(<DateTimePicker locale="en-US" defaultValue={sep(24, 14, 30)} />);
    expect(triggerText()).toBe('Sep 24, 2026, 2:30 PM');
  });

  it('uses minuteStep for the minute options', async () => {
    renderPicker({ minuteStep: 15, defaultValue: sep(24, 9, 0) });
    await userEvent.click(trigger());
    const minutes = within(column('Minutes')).getAllByRole('option');
    expect(minutes.map((el) => el.textContent)).toEqual(['00', '15', '30', '45']);
  });
});

describe('DateTimePicker — limits', () => {
  it('disables times outside min and max on their days', async () => {
    renderPicker({ defaultValue: sep(24, 12, 0), min: sep(24, 10, 0), max: sep(24, 16, 0) });
    await userEvent.click(trigger());
    expect(option('Hours', '09')).toHaveAttribute('aria-disabled', 'true');
    expect(option('Hours', '10')).not.toHaveAttribute('aria-disabled');
    expect(option('Hours', '16')).not.toHaveAttribute('aria-disabled');
    expect(option('Hours', '17')).toHaveAttribute('aria-disabled', 'true');
  });

  it('clamps a picked day into min and max', async () => {
    const onChange = vi.fn();
    renderPicker({
      onChange,
      min: sep(24, 10, 0),
      max: sep(26, 16, 0),
      defaultTime: { hours: 8, minutes: 0 },
    });
    await userEvent.click(trigger());
    await userEvent.click(day(24));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 24, 10, 0]);

    await userEvent.click(option('Hours', '20'));
    await userEvent.click(day(26));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 26, 16, 0]);
  });
});

describe('DateTimePicker — limits before a day is picked', () => {
  it('greys out times outside the limits on the focused day, and follows the focus', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, min: sep(25, 10, 0) });
    await userEvent.click(trigger());
    // Today is before min, so the tab stop starts on Sep 25.
    expect(option('Hours', '08')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(option('Hours', '08'));
    expect(onChange).not.toHaveBeenCalled();

    day(25).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(option('Hours', '08')).not.toHaveAttribute('aria-disabled');
    await userEvent.click(option('Hours', '08'));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 26, 8, 0]);
  });
});

describe('DateTimePicker — clamping onto the minute step', () => {
  it('moves a time clamped to an off-step min up to the next step, and selects it', async () => {
    const onChange = vi.fn();
    renderPicker({
      onChange,
      minuteStep: 15,
      min: sep(24, 10, 7),
      defaultTime: { hours: 8, minutes: 0 },
    });
    await userEvent.click(trigger());
    await userEvent.click(day(24));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 24, 10, 15]);
    expect(option('Minutes', '15')).toHaveAttribute('aria-selected', 'true');
  });

  it('moves a time clamped to an off-step max down to the previous step', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, minuteStep: 15, max: sep(24, 16, 52), defaultValue: sep(24, 9, 0) });
    await userEvent.click(trigger());
    await userEvent.click(option('Hours', '16'));
    await userEvent.click(option('Minutes', '45'));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 24, 16, 45]);
    await userEvent.click(day(23));
    await userEvent.click(option('Hours', '20'));
    await userEvent.click(day(24));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 24, 16, 45]);
  });

  it("keeps a consumer's own off-step time when it is carried to another day", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, minuteStep: 15, defaultValue: sep(10, 9, 7) });
    await userEvent.click(trigger());
    await userEvent.click(day(12));
    expect(parts(onChange.mock.lastCall?.[0])).toEqual([9, 12, 9, 7]);
  });
});

describe('DateTimePicker — DST spring-forward', () => {
  // Only one of these holds in a given zone; `pnpm test:tz` runs both.
  const newYorkGap = new Date(2026, 2, 8, 2, 30).getHours() !== 2;
  const sydneyGap = new Date(2026, 9, 4, 2, 30).getHours() !== 2;

  it.runIf(newYorkGap)('moves a carried 02:30 forward by the gap in America/New_York', async () => {
    const onChange = vi.fn();
    render(
      <DateTimePicker
        locale="en-US"
        hourCycle={24}
        defaultValue={new Date(2026, 2, 7, 2, 30)}
        onChange={onChange}
      />,
    );
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: /^Sunday, March 8, 2026/ }));
    const picked = onChange.mock.lastCall?.[0] as Date;
    expect([picked.getDate(), picked.getHours(), picked.getMinutes()]).toEqual([8, 3, 30]);
  });

  it.runIf(sydneyGap)('moves a carried 02:30 forward by the gap in Australia/Sydney', async () => {
    const onChange = vi.fn();
    render(
      <DateTimePicker
        locale="en-AU"
        hourCycle={24}
        defaultValue={new Date(2026, 9, 3, 2, 30)}
        onChange={onChange}
      />,
    );
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: /^Sunday,? 4 October 2026/ }));
    const picked = onChange.mock.lastCall?.[0] as Date;
    expect([picked.getDate(), picked.getHours(), picked.getMinutes()]).toEqual([4, 3, 30]);
  });
});

describe('DateTimePicker — forms', () => {
  it('submits the value as YYYY-MM-DDTHH:mm', async () => {
    render(
      <form>
        <DateTimePicker locale="en-US" hourCycle={24} name="startsAt" />
      </form>,
    );
    await userEvent.click(trigger());
    await userEvent.click(day(24));
    await userEvent.click(option('Hours', '14'));
    await userEvent.click(option('Minutes', '30'));
    const form = document.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('startsAt')).toBe('2026-09-24T14:30');
  });

  it('blocks a required form while empty', () => {
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    render(
      <form>
        <DateTimePicker locale="en-US" required />
      </form>,
    );
    const form = document.querySelector('form') as HTMLFormElement;
    form.addEventListener('submit', onSubmit);
    act(() => {
      form.requestSubmit();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('DateTimePicker — control', () => {
  it('respects a controlled open', async () => {
    const onOpenChange = vi.fn();
    renderPicker({ open: true, onOpenChange });
    await userEvent.click(doneButton());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog()).not.toBeNull();
  });

  it('follows a controlled value', () => {
    const { rerender } = renderPicker({ value: sep(24, 9, 5) });
    expect(triggerText()).toBe('Sep 24, 2026, 09:05');
    rerender(<DateTimePicker locale="en-US" hourCycle={24} value={null} placeholder="When?" />);
    expect(trigger()).toHaveTextContent('When?');
  });

  it('formats the trigger with formatValue and the resolved locale', () => {
    const formatValue = vi.fn(() => 'custom');
    renderPicker({ defaultValue: sep(24, 9, 5), formatValue });
    expect(trigger()).toHaveTextContent('custom');
    expect(formatValue).toHaveBeenCalledWith(sep(24, 9, 5), 'en-US');
  });

  it('forwards the calendar props', async () => {
    renderPicker({
      disabledDates: { dayOfWeek: [5] },
      weekStartsOn: 1,
      showOutsideDays: false,
      renderDay: (cell) => <i>{cell.formatted}*</i>,
      min: sep(2),
    });
    await userEvent.click(trigger());
    const grid = within(dialog() as HTMLElement).getByRole('grid');
    expect(within(grid).getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Monday');
    expect(day(25)).toHaveAttribute('aria-disabled', 'true');
    expect(day(1)).toHaveAttribute('aria-disabled', 'true');
    expect(within(grid).queryByRole('button', { name: /August 31, 2026/ })).toBeNull();
    expect(day(24)).toHaveTextContent('24*');
  });

  it('forwards its ref to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<DateTimePicker ref={ref} locale="en-US" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(trigger());
  });

  it('puts classNames and labels on the time panel and footer, and className on the root', async () => {
    renderPicker({
      className: 'mine',
      classNames: { timePanel: 't-panel', footer: 't-footer', doneButton: 't-done' },
      styles: { doneButton: { color: 'red' } },
      labels: { done: 'Finish', hours: 'Hour' },
    });
    await userEvent.click(trigger());
    expect(document.querySelector('.ric-root')).toHaveClass('mine');
    expect(document.querySelector('.ric-time-panel')).toHaveClass('t-panel');
    expect(document.querySelector('.ric-footer')).toHaveClass('t-footer');
    const done = screen.getByRole('button', { name: 'Finish' });
    expect(done).toHaveClass('t-done');
    expect(done).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(column('Hour')).not.toBeNull();
  });
});
