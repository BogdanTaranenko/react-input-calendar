import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLocaleInfo } from '../i18n/locale-info';
import { Calendar } from './Calendar';

// Thursday, September 24, 2026, noon local time.
const TODAY = new Date(2026, 8, 24, 12);

const grid = () => screen.getByRole('grid');
const dayButtons = () => within(grid()).getAllByRole('button');
const dayButton = (name: string | RegExp) => within(grid()).getByRole('button', { name });
const cellOf = (button: HTMLElement) => button.closest('td') as HTMLElement;
const focusedLabel = () => document.activeElement?.getAttribute('aria-label');

function focusDay(name: string | RegExp) {
  act(() => {
    dayButton(name).focus();
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Calendar — rendering', () => {
  it('renders 42 day buttons with exactly one tab stop, on today by default', () => {
    render(<Calendar locale="en-US" />);
    const buttons = dayButtons();
    expect(buttons).toHaveLength(42);
    const tabStops = buttons.filter((button) => button.tabIndex === 0);
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]).toHaveAccessibleName('Thursday, September 24, 2026');
  });

  it('puts the tab stop on the selected day and shows its month', () => {
    render(<Calendar locale="en-US" defaultValue={new Date(2026, 5, 10)} />);
    expect(grid()).toHaveAccessibleName('June 2026');
    expect(dayButton('Wednesday, June 10, 2026').tabIndex).toBe(0);
  });

  it('labels the grid with the caption and renders weekday headers from weekStartsOn', () => {
    render(<Calendar locale="en-US" weekStartsOn={1} />);
    expect(grid()).toHaveAccessibleName('September 2026');
    const headers = within(grid()).getAllByRole('columnheader');
    expect(headers).toHaveLength(7);
    expect(headers[0]).toHaveAttribute('abbr', 'Monday');
    expect(headers[0]).toHaveTextContent('Mon');
  });

  it('marks today with aria-current="date" and nothing else', () => {
    const { container } = render(<Calendar locale="en-US" />);
    expect(container.querySelectorAll('[aria-current]')).toHaveLength(1);
    expect(dayButton('Thursday, September 24, 2026')).toHaveAttribute('aria-current', 'date');
  });

  it('exposes state as presence-only data attributes on the cell', () => {
    render(<Calendar locale="en-US" defaultValue={new Date(2026, 8, 10)} />);
    expect(cellOf(dayButton('Thursday, September 24, 2026'))).toHaveAttribute('data-today');
    expect(cellOf(dayButton('Thursday, September 10, 2026'))).toHaveAttribute('data-selected');
    expect(cellOf(dayButton('Thursday, September 10, 2026'))).toHaveAttribute('data-focused');
    expect(cellOf(dayButton('Sunday, August 30, 2026'))).toHaveAttribute('data-outside');
    expect(cellOf(dayButton('Saturday, September 12, 2026'))).toHaveAttribute('data-weekend');

    const plain = cellOf(dayButton('Tuesday, September 15, 2026'));
    for (const attribute of ['data-selected', 'data-today', 'data-outside', 'data-disabled']) {
      expect(plain).not.toHaveAttribute(attribute);
    }
  });

  it('renders empty cells instead of outside days when showOutsideDays is false', () => {
    render(<Calendar locale="en-US" showOutsideDays={false} />);
    expect(dayButtons()).toHaveLength(30);
    expect(within(grid()).getAllByRole('gridcell')).toHaveLength(42);
  });

  it('uses renderDay for the button content', () => {
    render(
      <Calendar
        locale="en-US"
        renderDay={(day) => <span data-testid="custom">{`${day.formatted}!`}</span>}
      />,
    );
    expect(screen.getAllByTestId('custom')).toHaveLength(42);
    expect(dayButton('Thursday, September 24, 2026')).toHaveTextContent('24!');
  });

  it('adds classNames to every matching part, and the root class exactly once', () => {
    const { container } = render(
      <Calendar
        locale="en-US"
        className="app-calendar"
        classNames={{ root: 'my-root', dayButton: 'my-day' }}
        styles={{ root: { color: 'red' } }}
        style={{ margin: 3 }}
      />,
    );
    for (const button of dayButtons()) expect(button).toHaveClass('ric-day-button', 'my-day');
    const roots = container.querySelectorAll('.my-root');
    expect(roots).toHaveLength(1);
    expect(roots[0]).toHaveClass('ric-root', 'app-calendar');
    expect(roots[0]).toHaveStyle({ color: 'rgb(255, 0, 0)', margin: '3px' });
    expect(container.querySelectorAll('.ric-root')).toHaveLength(1);
  });

  it('sets data-ric-theme only for a forced colour scheme', () => {
    const { container, rerender } = render(<Calendar locale="en-US" colorScheme="dark" />);
    expect(container.firstElementChild).toHaveAttribute('data-ric-theme', 'dark');
    rerender(<Calendar locale="en-US" colorScheme="system" />);
    expect(container.firstElementChild).not.toHaveAttribute('data-ric-theme');
  });

  it('does not mark today during server rendering', () => {
    const html = renderToString(<Calendar locale="en-US" defaultMonth={new Date(2026, 8, 1)} />);
    expect(html).toContain('September 2026');
    expect(html).not.toContain('aria-current');
  });

  it('renders an empty busy shell on the server when no month is known', () => {
    // The server's clock cannot tell which month it is for the visitor.
    const html = renderToString(<Calendar locale="en-US" />);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('role="grid"');
  });

  it('hydrates without errors when server and browser disagree on the month', async () => {
    const element = <Calendar locale="en-US" />;
    const container = document.createElement('div');
    // The server renders late on September 30; the visitor's clock already says October.
    vi.setSystemTime(new Date(2026, 8, 30, 23, 30));
    container.innerHTML = renderToString(element);
    vi.setSystemTime(new Date(2026, 9, 1, 0, 30));
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onRecoverableError = vi.fn();

    const root = await act(() => hydrateRoot(container, element, { onRecoverableError }));
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(within(container).getByRole('grid')).toHaveAccessibleName('October 2026');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('opens on the first month inside min/max, with the tab stop on min', () => {
    render(<Calendar locale="en-US" min={new Date(2026, 11, 3)} />);
    expect(grid()).toHaveAccessibleName('December 2026');
    expect(dayButton('Thursday, December 3, 2026').tabIndex).toBe(0);
  });
});

describe('Calendar — keyboard', () => {
  it.each([
    ['{ArrowRight}', 'Friday, September 25, 2026'],
    ['{ArrowLeft}', 'Wednesday, September 23, 2026'],
    ['{ArrowDown}', 'Thursday, October 1, 2026'],
    ['{ArrowUp}', 'Thursday, September 17, 2026'],
    ['{Home}', 'Sunday, September 20, 2026'],
    ['{End}', 'Saturday, September 26, 2026'],
    ['{PageDown}', 'Saturday, October 24, 2026'],
    ['{PageUp}', 'Monday, August 24, 2026'],
    ['{Shift>}{PageDown}{/Shift}', 'Friday, September 24, 2027'],
    ['{Shift>}{PageUp}{/Shift}', 'Wednesday, September 24, 2025'],
  ])('%s from Sep 24 focuses %s', async (keys, expected) => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    focusDay('Thursday, September 24, 2026');
    await user.keyboard(keys);
    expect(focusedLabel()).toBe(expected);
    expect(document.activeElement).toHaveProperty('tabIndex', 0);
  });

  it('shows the new month when focus leaves the visible one', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    focusDay('Thursday, September 24, 2026');
    await user.keyboard('{PageDown}');
    expect(grid()).toHaveAccessibleName('October 2026');
    expect(grid()).toHaveAttribute('data-direction', 'next');
  });

  it('clamps keyboard moves to min and max', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" max={new Date(2026, 8, 28)} />);
    focusDay('Thursday, September 24, 2026');
    await user.keyboard('{PageDown}');
    expect(focusedLabel()).toBe('Monday, September 28, 2026');
  });

  it('makes a clicked day outside min/max the tab stop, so focus and tab stop agree', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" min={new Date(2026, 8, 10)} />);
    const outside = dayButton('Saturday, September 5, 2026, unavailable');
    await user.click(outside);
    expect(outside).toHaveFocus();
    expect(dayButtons().filter((button) => button.tabIndex === 0)).toEqual([outside]);
    // Keyboard moves still stay inside min/max.
    await user.keyboard('{ArrowRight}');
    expect(focusedLabel()).toBe('Thursday, September 10, 2026');
  });

  it('stays put when a move clamps back onto the focused day', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" max={TODAY} />);
    focusDay('Thursday, September 24, 2026');
    await user.keyboard('{PageDown}');
    expect(focusedLabel()).toBe('Thursday, September 24, 2026');
    expect(grid()).toHaveAccessibleName('September 2026');
  });

  it('mirrors horizontal arrows in RTL locales', async () => {
    const user = userEvent.setup();
    const ar = getLocaleInfo('ar');
    render(<Calendar locale="ar" />);
    expect(screen.getByRole('grid').closest('.ric-calendar')).toHaveAttribute('dir', 'rtl');
    focusDay(ar.formatDayLabel(TODAY));
    await user.keyboard('{ArrowLeft}');
    expect(focusedLabel()).toBe(ar.formatDayLabel(new Date(2026, 8, 25)));
  });

  it('moves from whichever day actually has focus, not only the tab stop', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    // e.g. a screen reader's virtual cursor focusing a day that was not tabbable
    focusDay('Wednesday, September 9, 2026');
    expect(dayButton('Wednesday, September 9, 2026').tabIndex).toBe(0);
    await user.keyboard('{ArrowRight}');
    expect(focusedLabel()).toBe('Thursday, September 10, 2026');
  });

  it('ignores keys it does not handle', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    focusDay('Thursday, September 24, 2026');
    await user.keyboard('a');
    expect(focusedLabel()).toBe('Thursday, September 24, 2026');
  });

  it('does not move focus on render, but does with autoFocus', () => {
    const { unmount } = render(<Calendar locale="en-US" />);
    expect(document.body).toHaveFocus();
    unmount();
    // The pickers pass autoFocus when their dialog opens; this is that prop, not a page-load focus grab.
    // eslint-disable-next-line jsx-a11y/no-autofocus
    render(<Calendar locale="en-US" autoFocus />);
    expect(focusedLabel()).toBe('Thursday, September 24, 2026');
  });
});

describe('Calendar — selection', () => {
  it('selects the focused day with Enter and reports local midnight', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar locale="en-US" onChange={onChange} />);
    focusDay('Thursday, September 24, 2026');
    await user.keyboard('{ArrowRight}{Enter}');

    expect(onChange).toHaveBeenCalledOnce();
    const selected = onChange.mock.calls[0]?.[0] as Date;
    expect([selected.getFullYear(), selected.getMonth(), selected.getDate()]).toEqual([2026, 8, 25]);
    expect([selected.getHours(), selected.getMinutes()]).toEqual([0, 0]);
    expect(cellOf(dayButton('Friday, September 25, 2026'))).toHaveAttribute('aria-selected', 'true');
  });

  it('selects on click and moves the tab stop there', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    await user.click(dayButton('Tuesday, September 8, 2026'));
    expect(dayButton('Tuesday, September 8, 2026').tabIndex).toBe(0);
    expect(cellOf(dayButton('Tuesday, September 8, 2026'))).toHaveAttribute('data-selected');
  });

  it('announces unavailable days and never selects them', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar locale="en-US" onChange={onChange} disabledDates={new Date(2026, 8, 25)} />,
    );
    const disabled = dayButton('Friday, September 25, 2026, unavailable');
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(cellOf(disabled)).toHaveAttribute('data-disabled');

    focusDay(/September 25, 2026/);
    await user.keyboard('{Enter}');
    await user.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('respects a controlled value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <Calendar locale="en-US" value={new Date(2026, 8, 10)} onChange={onChange} />,
    );
    await user.click(dayButton('Saturday, September 12, 2026'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(cellOf(dayButton('Thursday, September 10, 2026'))).toHaveAttribute('data-selected');
    expect(cellOf(dayButton('Saturday, September 12, 2026'))).not.toHaveAttribute('data-selected');

    rerender(<Calendar locale="en-US" value={new Date(2026, 8, 12)} onChange={onChange} />);
    expect(cellOf(dayButton('Saturday, September 12, 2026'))).toHaveAttribute('data-selected');
  });
});

describe('Calendar — month navigation', () => {
  it('moves by one month with the header buttons and announces it', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<Calendar locale="en-US" onMonthChange={onMonthChange} />);
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent('');

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(grid()).toHaveAccessibleName('October 2026');
    expect(live).toHaveTextContent('October 2026');
    const reported = onMonthChange.mock.calls[0]?.[0] as Date;
    expect([reported.getFullYear(), reported.getMonth(), reported.getDate()]).toEqual([2026, 9, 1]);

    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(grid()).toHaveAccessibleName('August 2026');
    expect(grid()).toHaveAttribute('data-direction', 'prev');
  });

  it('keeps one tab stop in the grid after the month changes', async () => {
    const user = userEvent.setup();
    render(<Calendar locale="en-US" />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    const tabStops = dayButtons().filter((button) => button.tabIndex === 0);
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]).toHaveAccessibleName('Thursday, October 1, 2026');
  });

  it('disables the header buttons at the min and max months', () => {
    render(
      <Calendar locale="en-US" min={new Date(2026, 8, 3)} max={new Date(2026, 8, 20)} />,
    );
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('follows a controlled month', () => {
    const { rerender } = render(<Calendar locale="en-US" month={new Date(2027, 0, 15)} />);
    expect(grid()).toHaveAccessibleName('January 2027');
    rerender(<Calendar locale="en-US" month={new Date(2027, 1, 1)} />);
    expect(grid()).toHaveAccessibleName('February 2027');
  });

  it('uses overridden labels', () => {
    render(<Calendar locale="en-US" labels={{ nextMonth: 'Weiter' }} />);
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument();
  });
});
