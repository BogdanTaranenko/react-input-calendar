import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DateRange } from '../core/types';
import { Calendar } from './Calendar';

// Thursday, September 24, 2026, noon local time.
const TODAY = new Date(2026, 8, 24, 12);

const sep = (day: number) => `September ${String(day)}, 2026`;
const dayButton = (name: string | RegExp) => screen.getByRole('button', { name });
const cellFor = (day: string) => dayButton(new RegExp(day)).closest('td') as HTMLElement;
const ymd = (date: Date | null | undefined) =>
  date ? [date.getFullYear(), date.getMonth() + 1, date.getDate()] : null;
const rangeYmd = (range: DateRange | null | undefined) =>
  range ? { from: ymd(range.from), to: ymd(range.to) } : range;

function lastRange(onChange: ReturnType<typeof vi.fn>) {
  return rangeYmd(onChange.mock.lastCall?.[0] as DateRange | null);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Calendar mode="range" — selection', () => {
  it('builds a range from two clicks and marks start, middle and end', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar mode="range" locale="en-US" onChange={onChange} />);

    await user.click(dayButton(new RegExp(sep(8))));
    expect(lastRange(onChange)).toEqual({ from: [2026, 9, 8], to: null });
    await user.click(dayButton(new RegExp(sep(12))));
    expect(lastRange(onChange)).toEqual({ from: [2026, 9, 8], to: [2026, 9, 12] });

    expect(cellFor(sep(8))).toHaveAttribute('data-range-start');
    expect(cellFor(sep(8))).toHaveAttribute('data-selected');
    for (const day of [9, 10, 11]) {
      expect(cellFor(sep(day))).toHaveAttribute('data-in-range');
      expect(cellFor(sep(day))).not.toHaveAttribute('data-selected');
    }
    expect(cellFor(sep(12))).toHaveAttribute('data-range-end');
    for (const day of [8, 9, 10, 11, 12]) {
      expect(cellFor(sep(day))).toHaveAttribute('aria-selected', 'true');
    }
    expect(cellFor(sep(13))).toHaveAttribute('aria-selected', 'false');
  });

  it('names the range ends in their labels', () => {
    render(
      <Calendar
        mode="range"
        locale="en-US"
        defaultValue={{ from: new Date(2026, 8, 8), to: new Date(2026, 8, 12) }}
      />,
    );
    expect(dayButton(`Tuesday, ${sep(8)}, start of range`)).toBeInTheDocument();
    expect(dayButton(`Saturday, ${sep(12)}, end of range`)).toBeInTheDocument();
  });

  it('restarts the range when the second click is before the start', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar mode="range" locale="en-US" onChange={onChange} />);
    await user.click(dayButton(new RegExp(sep(8))));
    await user.click(dayButton(new RegExp(sep(5))));
    expect(lastRange(onChange)).toEqual({ from: [2026, 9, 5], to: null });
  });

  it('starts a new range when a complete one is clicked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        mode="range"
        locale="en-US"
        onChange={onChange}
        defaultValue={{ from: new Date(2026, 8, 8), to: new Date(2026, 8, 12) }}
      />,
    );
    await user.click(dayButton(new RegExp(sep(20))));
    expect(lastRange(onChange)).toEqual({ from: [2026, 9, 20], to: null });
  });

  it('respects a controlled range', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = { from: new Date(2026, 8, 8), to: new Date(2026, 8, 12) };
    render(<Calendar mode="range" locale="en-US" value={value} onChange={onChange} />);
    await user.click(dayButton(new RegExp(sep(20))));
    expect(onChange).toHaveBeenCalledOnce();
    expect(cellFor(sep(20))).not.toHaveAttribute('data-range-start');
    expect(cellFor(sep(8))).toHaveAttribute('data-range-start');
  });
});

describe('Calendar mode="range" — preview', () => {
  it('previews the days between the start and the hovered day', async () => {
    const user = userEvent.setup();
    render(<Calendar mode="range" locale="en-US" />);
    await user.click(dayButton(new RegExp(sep(8))));
    await user.hover(dayButton(new RegExp(sep(11))));

    for (const day of [9, 10, 11]) expect(cellFor(sep(day))).toHaveAttribute('data-preview');
    expect(cellFor(sep(8))).not.toHaveAttribute('data-preview');
    expect(cellFor(sep(12))).not.toHaveAttribute('data-preview');

    fireEvent.pointerLeave(screen.getByRole('grid').closest('.ric-months') as HTMLElement);
    expect(cellFor(sep(10))).not.toHaveAttribute('data-preview');
  });

  it('previews from keyboard focus too', async () => {
    const user = userEvent.setup();
    render(<Calendar mode="range" locale="en-US" />);
    await user.click(dayButton(new RegExp(sep(8))));
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(cellFor(sep(9))).toHaveAttribute('data-preview');
    expect(cellFor(sep(10))).toHaveAttribute('data-preview');
    expect(cellFor(sep(11))).not.toHaveAttribute('data-preview');
  });

  it('shows no preview once the range is complete', async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        mode="range"
        locale="en-US"
        defaultValue={{ from: new Date(2026, 8, 8), to: new Date(2026, 8, 12) }}
      />,
    );
    await user.hover(dayButton(new RegExp(sep(15))));
    expect(screen.getByRole('grid').querySelectorAll('[data-preview]')).toHaveLength(0);
  });
});

describe('Calendar mode="range" — constraints', () => {
  it('disables ends that would exceed maxDays while a range is in progress', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar mode="range" locale="en-US" maxDays={7} onChange={onChange} />);
    expect(cellFor(sep(15))).not.toHaveAttribute('data-disabled');

    await user.click(dayButton(new RegExp(sep(8))));
    expect(cellFor(sep(14))).not.toHaveAttribute('data-disabled');
    expect(cellFor(sep(15))).toHaveAttribute('data-disabled');
    expect(dayButton(new RegExp(sep(15)))).toHaveAttribute('aria-disabled', 'true');

    await user.click(dayButton(new RegExp(sep(15))));
    expect(lastRange(onChange)).toEqual({ from: [2026, 9, 8], to: null });
  });

  it('disables ends past an unavailable day, but not days before the start', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        mode="range"
        locale="en-US"
        disabledDates={new Date(2026, 8, 10)}
        onChange={onChange}
      />,
    );
    await user.click(dayButton(new RegExp(sep(8))));
    expect(cellFor(sep(9))).not.toHaveAttribute('data-disabled');
    expect(cellFor(sep(10))).toHaveAttribute('data-disabled');
    expect(cellFor(sep(12))).toHaveAttribute('data-disabled');
    expect(cellFor(sep(3))).not.toHaveAttribute('data-disabled');

    // selectRange knows nothing about unavailable days in between; the calendar must refuse.
    await user.click(dayButton(new RegExp(sep(12))));
    expect(lastRange(onChange)).toEqual({ from: [2026, 9, 8], to: null });
  });

  it('never previews a range that could not be selected', async () => {
    const user = userEvent.setup();
    render(<Calendar mode="range" locale="en-US" disabledDates={new Date(2026, 8, 10)} />);
    await user.click(dayButton(new RegExp(sep(8))));
    await user.hover(dayButton(new RegExp(sep(12))));
    expect(screen.getByRole('grid').querySelectorAll('[data-preview]')).toHaveLength(0);
    await user.hover(dayButton(new RegExp(sep(9))));
    expect(cellFor(sep(9))).toHaveAttribute('data-preview');
  });
});

describe('Calendar numberOfMonths', () => {
  const grids = () => screen.getAllByRole('grid');
  const captions = () => grids().map((grid) => grid.getAttribute('aria-labelledby'));

  it('renders side-by-side months with their own captions and one tab stop', () => {
    render(<Calendar mode="range" locale="en-US" numberOfMonths={2} />);
    expect(grids()).toHaveLength(2);
    expect(grids()[0]).toHaveAccessibleName('September 2026');
    expect(grids()[1]).toHaveAccessibleName('October 2026');
    expect(new Set(captions()).size).toBe(2);

    const buttons = grids().flatMap((grid) => within(grid).getAllByRole('button'));
    expect(buttons).toHaveLength(30 + 31);
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
  });

  it('hides outside days even when showOutsideDays is true', () => {
    render(<Calendar locale="en-US" numberOfMonths={2} showOutsideDays />);
    expect(screen.queryByRole('button', { name: /August 31, 2026/ })).not.toBeInTheDocument();
  });

  it('moves one month per header click and disables them at the edges', async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        locale="en-US"
        numberOfMonths={2}
        min={new Date(2026, 8, 1)}
        max={new Date(2026, 10, 30)}
      />,
    );
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(grids()[0]).toHaveAccessibleName('October 2026');
    expect(grids()[1]).toHaveAccessibleName('November 2026');
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
      'October 2026 and November 2026',
    );
  });

  it('keeps focus moves inside the visible months without shifting them', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" numberOfMonths={2} />);
    act(() => {
      dayButton(/Wednesday, September 30, 2026/).focus();
    });
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Wednesday, October 7, 2026');
    expect(grids()[0]).toHaveAccessibleName('September 2026');
  });

  it('shifts by one month when focus leaves the last visible month', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" numberOfMonths={2} />);
    act(() => {
      dayButton(/Thursday, October 29, 2026/).focus();
    });
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName('Thursday, November 5, 2026');
    expect(grids()[0]).toHaveAccessibleName('October 2026');
    expect(grids()[1]).toHaveAccessibleName('November 2026');
  });

  it('clamps numberOfMonths into 1–3', () => {
    const { rerender } = render(<Calendar locale="en-US" numberOfMonths={5} />);
    expect(grids()).toHaveLength(3);
    rerender(<Calendar locale="en-US" numberOfMonths={0} />);
    expect(grids()).toHaveLength(1);
  });
});
