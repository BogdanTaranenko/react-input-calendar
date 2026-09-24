import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Calendar } from './Calendar';

// Thursday, September 24, 2026, noon local time.
const TODAY = new Date(2026, 8, 24, 12);

const grid = () => screen.getByRole('grid');
const gridButtons = () => within(grid()).getAllByRole('button');
const gridButton = (name: string | RegExp) => within(grid()).getByRole('button', { name });
const caption = (name: string | RegExp = /Choose/) => screen.getByRole('button', { name });
const tabStops = () => gridButtons().filter((button) => button.tabIndex === 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Calendar — month view', () => {
  it('names the caption after its visible text and what it does', () => {
    render(<Calendar locale="en-US" />);
    expect(caption()).toHaveAccessibleName('September 2026, Choose month');
    expect(grid()).toHaveAccessibleName('September 2026');
  });

  it('opens 12 months from the caption, then shows the picked month in the same year', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    await user.click(caption());

    expect(grid()).toHaveAccessibleName('2026');
    expect(gridButtons()).toHaveLength(12);
    expect(gridButtons().map((button) => button.textContent)).toContain('Mar');
    expect(caption()).toHaveAccessibleName('2026, Choose year');
    expect(caption()).toHaveFocus();

    await user.click(within(grid()).getByText('Mar'));
    expect(grid()).toHaveAccessibleName('March 2026');
    expect(gridButtons()).toHaveLength(42);
    expect(tabStops()[0]).toHaveFocus();
  });

  it('marks the current, selected and focused months with presence-only attributes', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" defaultValue={new Date(2026, 4, 12)} />);
    await user.click(caption());

    const may = gridButton('May');
    const september = gridButton('September');
    expect(may).toHaveAttribute('data-selected');
    expect(may).toHaveAttribute('data-focused');
    expect(may.closest('[role="gridcell"]')).toHaveAttribute('aria-selected', 'true');
    expect(september).toHaveAttribute('data-current');
    expect(september).toHaveAttribute('aria-current', 'date');
    expect(september).not.toHaveAttribute('data-selected');
    expect(september).not.toHaveAttribute('data-focused');
    expect(tabStops()).toEqual([may]);
    expect(within(grid()).getAllByRole('row')).toHaveLength(4);
  });

  it('moves with the arrow keys, stays within the year, and picks with Enter', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    await user.click(caption());
    act(() => {
      gridButton('September').focus();
    });

    await user.keyboard('{ArrowRight}');
    expect(gridButton('October')).toHaveFocus();
    await user.keyboard('{ArrowUp}{Home}');
    expect(gridButton('July')).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(gridButton('December')).toHaveFocus();
    await user.keyboard('a');
    expect(gridButton('December')).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(grid()).toHaveAccessibleName('December 2026');
  });

  it('moves from whichever month or year actually has focus, not only the tab stop', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    await user.click(caption());
    act(() => {
      gridButton('February').focus();
    });
    expect(tabStops()).toEqual([gridButton('February')]);
    await user.keyboard('{ArrowRight}');
    expect(gridButton('March')).toHaveFocus();

    await user.click(caption());
    act(() => {
      gridButton('2019').focus();
    });
    expect(tabStops()).toEqual([gridButton('2019')]);
    await user.keyboard('{ArrowDown}');
    expect(gridButton('2022')).toHaveFocus();
  });

  it('mirrors horizontal arrows in RTL locales', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="ar" />);
    await user.click(caption());
    const buttons = gridButtons();
    act(() => {
      buttons[8]?.focus();
    });
    await user.keyboard('{ArrowLeft}');
    expect(buttons[9]).toHaveFocus();
  });

  it('disables months wholly outside min/max and keeps keyboard moves inside them', async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        locale="en-US"
        defaultMonth={new Date(2026, 3, 1)}
        min={new Date(2026, 2, 31)}
        max={new Date(2026, 9, 1)}
      />,
    );
    await user.click(caption());

    expect(gridButton('February, unavailable')).toHaveAttribute('aria-disabled', 'true');
    expect(gridButton('February, unavailable')).toHaveAttribute('data-disabled');
    expect(gridButton('March')).not.toHaveAttribute('data-disabled');
    expect(gridButton('October')).not.toHaveAttribute('aria-disabled');
    expect(gridButton('November, unavailable')).toHaveAttribute('data-disabled');

    await user.click(gridButton('February, unavailable'));
    expect(grid()).toHaveAccessibleName('2026');

    act(() => {
      gridButton('April').focus();
    });
    await user.keyboard('{ArrowUp}');
    expect(gridButton('March')).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(gridButton('October')).toHaveFocus();
  });

  it('makes a clicked unavailable month the tab stop, so focus and tab stop agree', async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        locale="en-US"
        defaultMonth={new Date(2026, 3, 1)}
        min={new Date(2026, 2, 31)}
        max={new Date(2026, 9, 1)}
      />,
    );
    await user.click(caption());
    const february = gridButton('February, unavailable');
    await user.click(february);
    expect(february).toHaveFocus();
    expect(tabStops()).toEqual([february]);
    await user.keyboard('{ArrowRight}');
    expect(gridButton('March')).toHaveFocus();
  });

  it('reports the picked month through onMonthChange', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<Calendar locale="en-US" onMonthChange={onMonthChange} />);
    await user.click(caption());
    await user.click(gridButton('January'));
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 0, 1));
  });

  it('shows one month grid for several months and starts the view at the picked month', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" numberOfMonths={2} />);
    await user.click(caption('October 2026, Choose month'));

    expect(screen.getAllByRole('grid')).toHaveLength(1);
    expect(gridButton('October')).toHaveAttribute('data-focused');
    expect(caption()).toHaveFocus();

    await user.click(gridButton('March'));
    const grids = screen.getAllByRole('grid');
    expect(grids).toHaveLength(2);
    expect(grids[0]).toHaveAccessibleName('March 2026');
    expect(grids[1]).toHaveAccessibleName('April 2026');
  });

  it('applies the monthGrid and monthButton slots', async () => {
    const user = userEvent.setup();
    render(
      <Calendar locale="en-US" classNames={{ monthGrid: 'my-grid', monthButton: 'my-month' }} />,
    );
    await user.click(caption());
    expect(grid()).toHaveClass('ric-month-grid', 'my-grid');
    for (const button of gridButtons()) expect(button).toHaveClass('ric-month-button', 'my-month');
  });

  it('hides previous and next in the month view', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    await user.click(caption());
    expect(screen.queryByRole('button', { name: /Previous|Next/ })).toBeNull();
  });
});

async function openYears(user: ReturnType<typeof userEvent.setup>) {
  await user.click(caption());
  await user.click(caption());
}

describe('Calendar — year view', () => {
  it('opens a page of 12 years containing the current year on the second caption click', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    await openYears(user);

    expect(grid()).toHaveAccessibleName('2016 – 2027');
    expect(gridButtons().map((button) => button.textContent)).toEqual(
      Array.from({ length: 12 }, (_, i) => String(2016 + i)),
    );
    const current = gridButton('2026');
    expect(current).toHaveAttribute('data-current');
    expect(current).toHaveAttribute('aria-current', 'date');
    expect(current).toHaveAttribute('data-focused');
    expect(tabStops()).toEqual([current]);
    expect(caption('2016 – 2027')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Previous years' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next years' })).toBeEnabled();
  });

  it('marks the selected year and applies the yearGrid and yearButton slots', async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        locale="en-US"
        defaultValue={new Date(2021, 1, 3)}
        classNames={{ yearGrid: 'my-years', yearButton: 'my-year' }}
      />,
    );
    await openYears(user);
    expect(grid()).toHaveClass('ric-year-grid', 'my-years');
    expect(gridButton('2021')).toHaveAttribute('data-selected');
    expect(gridButton('2021')).toHaveClass('ric-year-button', 'my-year');
    expect(gridButton('2026')).not.toHaveAttribute('data-selected');
  });

  it('pages by 12 years, then picks a year and a month', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<Calendar locale="en-US" onMonthChange={onMonthChange} />);
    await openYears(user);

    await user.click(screen.getByRole('button', { name: 'Next years' }));
    expect(grid()).toHaveAccessibleName('2028 – 2039');
    expect(gridButton('2038')).toHaveAttribute('data-focused');
    await user.click(screen.getByRole('button', { name: 'Previous years' }));
    await user.click(screen.getByRole('button', { name: 'Previous years' }));
    expect(grid()).toHaveAccessibleName('2004 – 2015');

    await user.click(gridButton('2010'));
    expect(grid()).toHaveAccessibleName('2010');
    expect(gridButton('September')).toHaveFocus();
    await user.click(gridButton('February'));
    expect(grid()).toHaveAccessibleName('February 2010');
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2010, 1, 1));
  });

  it('respects min and max: disabled years, disabled paging and clamped keys', async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        locale="en-US"
        min={new Date(2020, 2, 15)}
        max={new Date(2030, 5, 10)}
      />,
    );
    await openYears(user);

    expect(screen.getByRole('button', { name: 'Previous years' })).toBeDisabled();
    expect(gridButton('2019, unavailable')).toHaveAttribute('data-disabled');
    expect(gridButton('2019, unavailable')).toHaveAttribute('aria-disabled', 'true');
    expect(gridButton('2020')).not.toHaveAttribute('data-disabled');
    await user.click(gridButton('2019, unavailable'));
    expect(grid()).toHaveAccessibleName('2016 – 2027');

    act(() => {
      gridButton('2023').focus();
    });
    await user.keyboard('{ArrowUp}');
    expect(gridButton('2020')).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowLeft}');
    expect(gridButton('2020')).toHaveFocus();

    await user.keyboard('{PageDown}');
    expect(grid()).toHaveAccessibleName('2028 – 2039');
    expect(gridButton('2030')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Next years' })).toBeDisabled();
    expect(gridButton('2031, unavailable')).toHaveAttribute('data-disabled');

    await user.keyboard('{Enter}');
    expect(grid()).toHaveAccessibleName('2030');
    expect(gridButton('June')).toHaveFocus();
    expect(gridButton('July, unavailable')).toHaveAttribute('data-disabled');
  });

  it('makes a clicked unavailable year the tab stop', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" min={new Date(2020, 2, 15)} />);
    await openYears(user);
    const year = gridButton('2019, unavailable');
    await user.click(year);
    expect(year).toHaveFocus();
    expect(tabStops()).toEqual([year]);
  });

  it('moves with the arrow keys and pages with PageUp', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    await openYears(user);
    act(() => {
      gridButton('2026').focus();
    });
    await user.keyboard('{ArrowRight}');
    expect(gridButton('2027')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(grid()).toHaveAccessibleName('2028 – 2039');
    expect(gridButton('2028')).toHaveFocus();
    await user.keyboard('{PageUp}');
    expect(gridButton('2016')).toHaveFocus();
    await user.keyboard('x');
    expect(gridButton('2016')).toHaveFocus();
  });

  it('returns to the days view from the year caption', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    await openYears(user);
    await user.click(caption('2016 – 2027'));
    expect(grid()).toHaveAccessibleName('September 2026');
    expect(caption()).toHaveFocus();
  });
});

describe('Calendar — Escape in the month and year views', () => {
  it('returns to the days view, focuses the tab stop and sets defaultPrevented', async () => {
    const user = userEvent.setup();
    const seen: boolean[] = [];
    const listener = (event: KeyboardEvent) => seen.push(event.defaultPrevented);
    document.addEventListener('keydown', listener);
    try {
      render(<Calendar locale="en-US" />);
      await user.click(caption());
      await user.keyboard('{Escape}');
      expect(grid()).toHaveAccessibleName('September 2026');
      expect(tabStops()[0]).toHaveFocus();
      expect(seen).toEqual([true]);

      await user.keyboard('{Escape}');
      expect(seen).toEqual([true, false]);

      await openYears(user);
      await user.keyboard('{Escape}');
      expect(grid()).toHaveAccessibleName('September 2026');
      expect(tabStops()[0]).toHaveFocus();
      expect(seen).toEqual([true, false, true]);
    } finally {
      document.removeEventListener('keydown', listener);
    }
  });

  it('opens the year view and returns with Escape when several months show', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" numberOfMonths={2} />);
    await user.click(caption('October 2026, Choose month'));
    await user.click(caption());
    expect(grid()).toHaveAccessibleName('2016 – 2027');
    expect(caption('2016 – 2027')).toHaveFocus();
    await user.keyboard('{Escape}');
    const grids = screen.getAllByRole('grid');
    expect(grids).toHaveLength(2);
    expect(grids[0]).toHaveAccessibleName('September 2026');
    expect(grids[1]).toHaveAccessibleName('October 2026');
    const stops = grids
      .flatMap((g) => within(g).getAllByRole('button'))
      .filter((button) => button.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveFocus();
  });
});
