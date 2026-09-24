import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DateRange } from '../core/types';
import { addDays, makeDate } from '../date/date-math';
import { DateRangePicker } from './DateRangePicker';
import type { DateRangePickerProps, RangePreset } from './types';

// Thursday, September 24, 2026, noon local time.
const TODAY = new Date(2026, 8, 24, 12);
const SEP_3 = new Date(2026, 8, 3);
const SEP_9 = new Date(2026, 8, 9);

/** ICU emits U+2009 / U+202F around the dash; compare text with plain spaces. */
const norm = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');
const trigger = () => document.querySelector('.ric-trigger') as HTMLButtonElement;
const dialog = () => screen.queryByRole('dialog');
const captions = () => [...document.querySelectorAll('.ric-caption')].map((el) => el.textContent);
const day = (day: number, month = 'September') =>
  screen.getByRole('button', { name: new RegExp(`^\\w+, ${month} ${String(day)}, 2026`) });
const ymd = (date: Date | null | undefined) =>
  date ? [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours()] : null;
const rangeYmd = (range: unknown) => {
  const value = range as DateRange | null;
  return value ? { from: ymd(value.from), to: ymd(value.to) } : value;
};

const LAST_7_DAYS: RangePreset = {
  label: 'Last 7 days',
  value: () => ({ from: addDays(new Date(), -6), to: new Date() }),
};
const NEXT_MONTH: RangePreset = {
  label: 'November',
  value: () => ({ from: makeDate(2026, 10, 1), to: makeDate(2026, 10, 30) }),
};

function renderPicker(props: Partial<DateRangePickerProps> = {}) {
  return render(<DateRangePicker label="Stay" locale="en-US" {...props} />);
}

/** `matchMedia` that reports a phone-sized viewport for every query. */
function stubPhoneViewport() {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: true,
    media,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('DateRangePicker — surface', () => {
  it('shows two months in the popover, named by the first caption, with the grid focused', async () => {
    renderPicker();
    await userEvent.click(trigger());
    expect(captions()).toEqual(['September 2026', 'October 2026']);
    expect(dialog()).toHaveAccessibleName('September 2026');
    expect(within(dialog() as HTMLElement).getAllByRole('grid')[0]).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it('shows one month in the bottom sheet', async () => {
    stubPhoneViewport();
    renderPicker();
    await userEvent.click(trigger());
    expect(document.querySelector('.ric-sheet')).not.toBeNull();
    expect(captions()).toEqual(['September 2026']);
  });

  it('takes an explicit numberOfMonths over the surface default', async () => {
    renderPicker({ numberOfMonths: 1 });
    await userEvent.click(trigger());
    expect(captions()).toEqual(['September 2026']);
  });

  it('pages both months together', async () => {
    renderPicker();
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(captions()).toEqual(['October 2026', 'November 2026']);
  });

  it('opens on the month of the start of the range', async () => {
    renderPicker({ defaultValue: { from: makeDate(2026, 11, 30), to: makeDate(2027, 0, 2) } });
    await userEvent.click(trigger());
    expect(captions()).toEqual(['December 2026', 'January 2027']);
  });
});

describe('DateRangePicker — choosing', () => {
  it('stays open after the first click and closes with the range after the second', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    await userEvent.click(trigger());

    await userEvent.click(day(3));
    expect(rangeYmd(onChange.mock.lastCall?.[0])).toEqual({ from: [2026, 9, 3, 0], to: null });
    expect(dialog()).not.toBeNull();

    await userEvent.click(day(9));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(rangeYmd(onChange.mock.lastCall?.[0])).toEqual({
      from: [2026, 9, 3, 0],
      to: [2026, 9, 9, 0],
    });
    expect(dialog()).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('shows the range with Intl formatRange, collapsing the shared parts', async () => {
    renderPicker();
    await userEvent.click(trigger());
    await userEvent.click(day(3));
    await userEvent.click(day(9));

    const expected = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).formatRange(
      SEP_3,
      SEP_9,
    );
    expect(norm(trigger().querySelector('.ric-trigger-value')?.textContent)).toBe(norm(expected));
    expect(norm(expected)).toBe('Sep 3 – 9, 2026');
  });

  it('shows a half-picked range as its start and an ellipsis', () => {
    renderPicker({ defaultValue: { from: SEP_3, to: null } });
    expect(norm(trigger().querySelector('.ric-trigger-value')?.textContent)).toBe(
      'Sep 3, 2026 – …',
    );
  });

  it('formats the trigger with formatValue and the resolved locale', () => {
    const formatValue = vi.fn(() => 'custom');
    renderPicker({ defaultValue: { from: SEP_3, to: SEP_9 }, formatValue });
    expect(trigger()).toHaveTextContent('custom');
    expect(formatValue).toHaveBeenCalledWith({ from: SEP_3, to: SEP_9 }, 'en-US');
  });

  it('enforces minDays end to end', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, minDays: 3 });
    await userEvent.click(trigger());
    await userEvent.click(day(3));
    await userEvent.click(day(4));

    expect(onChange).toHaveBeenCalledOnce();
    expect(dialog()).not.toBeNull();

    await userEvent.click(day(5));
    expect(rangeYmd(onChange.mock.lastCall?.[0])).toEqual({
      from: [2026, 9, 3, 0],
      to: [2026, 9, 5, 0],
    });
    expect(dialog()).toBeNull();
  });

  it('enforces maxDays end to end', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, maxDays: 5 });
    await userEvent.click(trigger());
    await userEvent.click(day(3));
    await userEvent.click(day(9));

    expect(onChange).toHaveBeenCalledOnce();
    expect(dialog()).not.toBeNull();
  });

  it('forwards the calendar props', async () => {
    renderPicker({
      numberOfMonths: 1,
      min: new Date(2026, 8, 2),
      max: new Date(2026, 8, 26),
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

  it('clears to null', async () => {
    const onChange = vi.fn();
    renderPicker({ defaultValue: { from: SEP_3, to: SEP_9 }, onChange });
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(trigger()).toHaveAttribute('data-placeholder');
  });
});

describe('DateRangePicker — presets', () => {
  it('renders nothing for presets without the prop, or with an empty list', async () => {
    const { unmount } = renderPicker();
    await userEvent.click(trigger());
    expect(dialog()).not.toBeNull();
    expect(document.querySelector('.ric-presets')).toBeNull();
    unmount();

    renderPicker({ presets: [] });
    await userEvent.click(trigger());
    expect(document.querySelector('.ric-presets')).toBeNull();
  });

  it('renders a named group of preset buttons before the months, keeping focus in the grid', async () => {
    renderPicker({ presets: [LAST_7_DAYS, NEXT_MONTH] });
    await userEvent.click(trigger());

    const group = screen.getByRole('group', { name: 'Presets' });
    expect(group).toHaveClass('ric-presets');
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Last 7 days', 'November']);
    for (const button of buttons) {
      expect(button).toHaveClass('ric-preset');
      expect(button).toHaveAttribute('type', 'button');
    }
    const months = document.querySelector('.ric-months') as HTMLElement;
    expect(group.compareDocumentPosition(months) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(group).not.toContainElement(document.activeElement as HTMLElement);

    // Shift+Tab passes the first month's header buttons, then reaches the last preset.
    for (let presses = 0; !group.contains(document.activeElement) && presses < 10; presses++) {
      await userEvent.tab({ shift: true });
    }
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('picks a preset at local midnight, closes, and shows it on the trigger', async () => {
    const onChange = vi.fn();
    renderPicker({ presets: [LAST_7_DAYS, NEXT_MONTH], onChange });
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(rangeYmd(onChange.mock.lastCall?.[0])).toEqual({
      from: [2026, 9, 18, 0],
      to: [2026, 9, 24, 0],
    });
    expect(dialog()).toBeNull();
    expect(trigger()).toHaveFocus();
    expect(norm(trigger().querySelector('.ric-trigger-value')?.textContent)).toBe(
      'Sep 18 – 24, 2026',
    );
  });

  it('keeps the picker open for an open-ended preset, until the end is picked', async () => {
    const onChange = vi.fn();
    const fromToday = { label: 'From today', value: () => ({ from: new Date(), to: null }) };
    renderPicker({ presets: [fromToday], onChange });
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'From today' }));

    expect(rangeYmd(onChange.mock.lastCall?.[0])).toEqual({ from: [2026, 9, 24, 0], to: null });
    expect(dialog()).not.toBeNull();

    await userEvent.click(day(28));
    expect(rangeYmd(onChange.mock.lastCall?.[0])).toEqual({
      from: [2026, 9, 24, 0],
      to: [2026, 9, 28, 0],
    });
    expect(dialog()).toBeNull();
  });

  it('bypasses minDays, maxDays and disabled dates', async () => {
    const onChange = vi.fn();
    renderPicker({
      presets: [LAST_7_DAYS],
      onChange,
      minDays: 10,
      maxDays: 12,
      disabledDates: { dayOfWeek: [0, 6] },
    });
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(rangeYmd(onChange.mock.lastCall?.[0])).toEqual({
      from: [2026, 9, 18, 0],
      to: [2026, 9, 24, 0],
    });
  });

  it('moves the calendar to the preset when the consumer keeps the picker open', async () => {
    const onOpenChange = vi.fn();
    renderPicker({ presets: [NEXT_MONTH], open: true, onOpenChange });
    expect(captions()).toEqual(['September 2026', 'October 2026']);

    await userEvent.click(screen.getByRole('button', { name: 'November' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(captions()).toEqual(['November 2026', 'December 2026']);
  });

  it('marks the preset matching the current value as active', async () => {
    const sameEnd = {
      label: 'Same end',
      value: () => ({ from: SEP_3, to: new Date(2026, 8, 24) }),
    };
    const sameStart = {
      label: 'Same start',
      value: () => ({ from: new Date(2026, 8, 18), to: new Date(2026, 8, 30) }),
    };
    renderPicker({
      presets: [LAST_7_DAYS, NEXT_MONTH, sameEnd, sameStart],
      defaultValue: { from: new Date(2026, 8, 18), to: new Date(2026, 8, 24) },
    });
    await userEvent.click(trigger());
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('data-active');
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    for (const name of ['November', 'Same end', 'Same start']) {
      expect(screen.getByRole('button', { name })).not.toHaveAttribute('data-active');
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('marks no preset active for a half-picked range with the same start', async () => {
    renderPicker({
      presets: [LAST_7_DAYS],
      defaultValue: { from: new Date(2026, 8, 18), to: null },
    });
    await userEvent.click(trigger());
    expect(screen.getByRole('button', { name: 'Last 7 days' })).not.toHaveAttribute('data-active');
  });
});

describe('DateRangePicker — forms', () => {
  it('submits the start and end through startName and endName', () => {
    render(
      <form>
        <DateRangePicker
          locale="en-US"
          startName="checkIn"
          endName="checkOut"
          defaultValue={{ from: SEP_3, to: SEP_9 }}
        />
      </form>,
    );
    const form = document.querySelector('form') as HTMLFormElement;
    expect([...new FormData(form).entries()]).toEqual([
      ['checkIn', '2026-09-03'],
      ['checkOut', '2026-09-09'],
    ]);
  });

  it('blocks a required form while the range is half-picked, and allows a full one', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    render(
      <form>
        <DateRangePicker locale="en-US" required defaultValue={{ from: SEP_3, to: null }} />
      </form>,
    );
    const form = document.querySelector('form') as HTMLFormElement;
    form.addEventListener('submit', onSubmit);
    expect(screen.getByRole('button', { name: 'Clear' })).not.toBeNull();

    act(() => {
      form.requestSubmit();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector('.ric-root')).toHaveAttribute('data-invalid');

    await userEvent.click(trigger());
    await userEvent.click(day(9));
    expect(form.checkValidity()).toBe(true);
  });
});

describe('DateRangePicker — control', () => {
  it('follows a controlled value', () => {
    const { rerender } = renderPicker({ value: { from: SEP_3, to: SEP_9 } });
    expect(norm(trigger().textContent)).toContain('Sep 3 – 9, 2026');
    rerender(<DateRangePicker label="Stay" locale="en-US" value={null} placeholder="Any dates" />);
    expect(trigger()).toHaveTextContent('Any dates');
  });

  it('forwards its ref to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<DateRangePicker ref={ref} locale="en-US" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(trigger());
  });

  it('puts classNames and styles on the preset slots, and className on the root', async () => {
    renderPicker({
      presets: [LAST_7_DAYS],
      className: 'mine',
      classNames: { presets: 'p-group', preset: 'p-button', months: 'p-months' },
      styles: { preset: { color: 'red' } },
    });
    await userEvent.click(trigger());
    expect(document.querySelector('.ric-root')).toHaveClass('mine');
    expect(screen.getByRole('group', { name: 'Presets' })).toHaveClass('p-group');
    const preset = screen.getByRole('button', { name: 'Last 7 days' });
    expect(preset).toHaveClass('p-button');
    expect(preset).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(document.querySelector('.ric-months')).toHaveClass('p-months');
  });

  it('uses a custom presets label', async () => {
    renderPicker({ presets: [LAST_7_DAYS], labels: { presets: 'Quick ranges' } });
    await userEvent.click(trigger());
    expect(screen.getByRole('group', { name: 'Quick ranges' })).not.toBeNull();
  });
});
