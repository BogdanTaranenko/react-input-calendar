import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TimeOfDay } from '../date/date-math';
import { TimePanel, type TimePanelProps } from './TimePanel';

const DAY = new Date(2026, 8, 24);
const at = (hours: number, minutes: number) => new Date(2026, 8, 24, hours, minutes);

const column = (name: string) => screen.getByRole('listbox', { name });
const options = (name: string) => within(column(name)).getAllByRole('option');
const option = (name: string, label: string) =>
  within(column(name)).getByRole('option', { name: label });
const texts = (name: string) => options(name).map((element) => element.textContent);

/** A TimePanel holding its own value, like the DateTimePicker will. */
function Controlled({ initial, ...props }: Partial<TimePanelProps> & { initial: Date | null }) {
  const [value, setValue] = useState(initial);
  return (
    <TimePanel
      locale="en-US"
      {...props}
      value={value}
      onChange={(time: TimeOfDay) => {
        props.onChange?.(time);
        setValue(new Date(2026, 8, 24, time.hours, time.minutes));
      }}
    />
  );
}

let scrollTo: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scrollTo = vi.fn();
  Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 24, 12));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('TimePanel — columns', () => {
  it('shows hours, minutes and AM/PM on a 12-hour clock', () => {
    render(<TimePanel locale="en-US" value={at(14, 5)} onChange={vi.fn()} />);
    expect(screen.getAllByRole('listbox')).toHaveLength(3);
    expect(texts('Hours')).toEqual([
      '12',
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
    ]);
    expect(texts('AM/PM')).toEqual(['AM', 'PM']);
    expect(option('Hours', '02')).toHaveAttribute('aria-selected', 'true');
    expect(option('Hours', '02')).toHaveAttribute('data-selected');
    expect(option('AM/PM', 'PM')).toHaveAttribute('data-selected');
    expect(option('Minutes', '05')).toHaveAttribute('data-selected');
  });

  it('has no AM/PM column on a 24-hour clock, from the locale or the prop', () => {
    const { rerender } = render(<TimePanel locale="en-GB" value={at(14, 5)} onChange={vi.fn()} />);
    expect(screen.getAllByRole('listbox')).toHaveLength(2);
    expect(options('Hours')).toHaveLength(24);
    expect(option('Hours', '14')).toHaveAttribute('data-selected');
    rerender(<TimePanel locale="en-US" hourCycle={24} value={at(14, 5)} onChange={vi.fn()} />);
    expect(screen.queryByRole('listbox', { name: 'AM/PM' })).toBeNull();
  });

  it('gives 4 minute options with minuteStep=15, and 12 by default', () => {
    const { rerender } = render(
      <TimePanel locale="en-US" minuteStep={15} value={null} onChange={vi.fn()} />,
    );
    expect(texts('Minutes')).toEqual(['00', '15', '30', '45']);
    rerender(<TimePanel locale="en-US" value={null} onChange={vi.fn()} />);
    expect(options('Minutes')).toHaveLength(12);
  });

  it('formats options with the locale digits and uses overridden labels and slots', () => {
    render(
      <TimePanel
        locale="ar-EG"
        hourCycle={24}
        value={null}
        onChange={vi.fn()}
        labels={{ hours: 'H', minutes: 'M' }}
        classNames={{ timePanel: 'my-panel', timeColumn: 'my-column', timeOption: 'my-option' }}
      />,
    );
    const digits = new Intl.NumberFormat('ar-EG', { minimumIntegerDigits: 2 });
    expect(options('H')[7]).toHaveTextContent(digits.format(7));
    expect(column('M')).toHaveClass('ric-time-column', 'my-column');
    expect(column('M').parentElement).toHaveClass('ric-time-panel', 'my-panel');
    for (const element of options('M')) expect(element).toHaveClass('ric-time-option', 'my-option');
  });

  it('keeps one tab stop per column and points aria-activedescendant at the focused option', () => {
    render(<TimePanel locale="en-US" value={at(9, 30)} onChange={vi.fn()} />);
    for (const listbox of screen.getAllByRole('listbox')) expect(listbox.tabIndex).toBe(0);
    for (const element of options('Minutes')) expect(element).not.toHaveAttribute('tabindex');
    const minutes = column('Minutes');
    expect(minutes).toHaveAttribute('aria-activedescendant', option('Minutes', '30').id);
    expect(option('Minutes', '30')).toHaveAttribute('data-focused');
  });
});

describe('TimePanel — choosing', () => {
  it('selects the next hour with ArrowDown and calls onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={at(10, 30)} hourCycle={24} onChange={onChange} />);
    act(() => {
      column('Hours').focus();
    });
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ hours: 11, minutes: 30 });
    expect(option('Hours', '11')).toHaveAttribute('data-selected');
    expect(column('Hours')).toHaveAttribute('aria-activedescendant', option('Hours', '11').id);
  });

  it('moves with ArrowUp, Home and End, and stops at the ends', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={at(10, 30)} hourCycle={24} onChange={onChange} />);
    act(() => {
      column('Hours').focus();
    });
    await user.keyboard('{ArrowUp}');
    expect(option('Hours', '09')).toHaveAttribute('data-selected');
    await user.keyboard('{End}{ArrowDown}');
    expect(option('Hours', '23')).toHaveAttribute('data-selected');
    await user.keyboard('{Home}{ArrowUp}');
    expect(option('Hours', '00')).toHaveAttribute('data-selected');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('selects on click, and builds a whole time when there is no value yet', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePanel locale="en-US" hourCycle={24} value={null} onChange={onChange} />);
    expect(screen.queryAllByRole('option', { selected: true })).toHaveLength(0);
    await user.click(option('Hours', '08'));
    expect(onChange).toHaveBeenLastCalledWith({ hours: 8, minutes: 0 });
    await user.click(option('Minutes', '45'));
    expect(onChange).toHaveBeenLastCalledWith({ hours: 0, minutes: 45 });
  });

  it('switches AM and PM, and maps 12-hour choices to 24 hours', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={at(14, 5)} onChange={onChange} />);
    await user.click(option('AM/PM', 'AM'));
    expect(onChange).toHaveBeenLastCalledWith({ hours: 2, minutes: 5 });
    await user.click(option('Hours', '12'));
    expect(onChange).toHaveBeenLastCalledWith({ hours: 0, minutes: 5 });
    await user.click(option('AM/PM', 'PM'));
    expect(onChange).toHaveBeenLastCalledWith({ hours: 12, minutes: 5 });
  });

  it('sets the period on an empty value from midnight or noon', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePanel locale="en-US" value={null} onChange={onChange} />);
    await user.click(option('AM/PM', 'PM'));
    expect(onChange).toHaveBeenLastCalledWith({ hours: 12, minutes: 0 });
  });

  it('jumps to a typed number, preferring an exact match, and restarts after a pause', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={at(14, 5)} onChange={onChange} />);
    act(() => {
      column('Hours').focus();
    });
    await user.keyboard('1');
    expect(option('Hours', '01')).toHaveAttribute('data-selected');
    await user.keyboard('0');
    expect(option('Hours', '10')).toHaveAttribute('data-selected');
    expect(onChange).toHaveBeenLastCalledWith({ hours: 22, minutes: 5 });

    act(() => {
      column('Minutes').focus();
    });
    await user.keyboard('1');
    expect(option('Minutes', '10')).toHaveAttribute('data-selected');
    await user.keyboard('5');
    expect(option('Minutes', '15')).toHaveAttribute('data-selected');
    vi.setSystemTime(new Date(2026, 8, 24, 12, 0, 5));
    await user.keyboard('4');
    expect(option('Minutes', '40')).toHaveAttribute('data-selected');
    vi.setSystemTime(new Date(2026, 8, 24, 12, 0, 10));
    await user.keyboard('5');
    expect(option('Minutes', '05')).toHaveAttribute('data-selected');

    act(() => {
      column('AM/PM').focus();
    });
    await user.keyboard('a');
    expect(option('AM/PM', 'AM')).toHaveAttribute('data-selected');
    await user.keyboard('z');
    expect(option('AM/PM', 'AM')).toHaveAttribute('data-selected');
  });
});

describe('TimePanel — values off the minute step', () => {
  it('focuses the nearest minute option, so aria-activedescendant always points at an option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePanel locale="en-US" hourCycle={24} value={at(10, 37)} onChange={onChange} />);
    const minutes = column('Minutes');
    const id = minutes.getAttribute('aria-activedescendant');
    expect(id).toBe(option('Minutes', '35').id);
    expect(option('Minutes', '35')).toHaveAttribute('data-focused');
    expect(within(minutes).queryAllByRole('option', { selected: true })).toHaveLength(0);

    act(() => {
      minutes.focus();
    });
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ hours: 10, minutes: 35 });
  });

  it('ignores typing with Ctrl, Meta or Alt, and during IME composition', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePanel locale="en-US" hourCycle={24} value={at(10, 30)} onChange={onChange} />);
    act(() => {
      column('Minutes').focus();
    });
    await user.keyboard('{Control>}4{/Control}{Meta>}4{/Meta}{Alt>}4{/Alt}');
    fireEvent.keyDown(column('Minutes'), { key: '4', isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('TimePanel — min and max', () => {
  const limits = { min: at(9, 20), max: at(17, 40) };

  it('disables hours with no allowed minute, and minutes outside the limits', () => {
    render(
      <TimePanel locale="en-US" hourCycle={24} value={at(9, 30)} onChange={vi.fn()} {...limits} />,
    );
    for (const hour of ['00', '08', '18', '23']) {
      expect(option('Hours', hour)).toHaveAttribute('aria-disabled', 'true');
      expect(option('Hours', hour)).toHaveAttribute('data-disabled');
    }
    for (const hour of ['09', '17'])
      expect(option('Hours', hour)).not.toHaveAttribute('aria-disabled');
    expect(option('Minutes', '15')).toHaveAttribute('data-disabled');
    expect(option('Minutes', '20')).not.toHaveAttribute('data-disabled');
  });

  it('disables a whole period when none of its hours is allowed', () => {
    render(<TimePanel locale="en-US" value={at(14, 0)} onChange={vi.fn()} min={at(13, 0)} />);
    expect(option('AM/PM', 'AM')).toHaveAttribute('data-disabled');
    expect(option('AM/PM', 'PM')).not.toHaveAttribute('data-disabled');
  });

  it('checks the limits against `day` when there is no value, selecting nothing', () => {
    render(
      <TimePanel
        locale="en-US"
        hourCycle={24}
        value={null}
        day={DAY}
        onChange={vi.fn()}
        {...limits}
      />,
    );
    expect(option('Hours', '08')).toHaveAttribute('aria-disabled', 'true');
    expect(option('Hours', '09')).not.toHaveAttribute('aria-disabled');
    expect(option('Hours', '18')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryAllByRole('option', { selected: true })).toHaveLength(0);
  });

  it("prefers the value's day over `day` for the limits", () => {
    render(
      <TimePanel
        locale="en-US"
        hourCycle={24}
        value={at(12, 0)}
        day={new Date(2026, 8, 25)}
        onChange={vi.fn()}
        min={limits.min}
      />,
    );
    expect(option('Hours', '08')).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables nothing when there is no value, or on a day inside the limits', () => {
    const { rerender } = render(
      <TimePanel locale="en-US" hourCycle={24} value={null} onChange={vi.fn()} {...limits} />,
    );
    expect(document.querySelectorAll('[data-disabled]')).toHaveLength(0);
    rerender(
      <TimePanel
        locale="en-US"
        hourCycle={24}
        value={DAY}
        onChange={vi.fn()}
        min={new Date(2026, 8, 1)}
      />,
    );
    expect(document.querySelectorAll('[data-disabled]')).toHaveLength(0);
  });

  it('focuses but never selects an unavailable option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={at(9, 20)} hourCycle={24} onChange={onChange} {...limits} />);
    act(() => {
      column('Hours').focus();
    });
    await user.keyboard('{ArrowUp}');
    expect(option('Hours', '08')).toHaveAttribute('data-focused');
    expect(option('Hours', '09')).toHaveAttribute('data-selected');
    await user.keyboard('{Enter}');
    await user.click(option('Hours', '07'));
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ hours: 9, minutes: 20 });
  });
  it('lets a new value from outside take the focus back', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TimePanel locale="en-US" hourCycle={24} value={at(9, 20)} onChange={vi.fn()} {...limits} />,
    );
    act(() => {
      column('Hours').focus();
    });
    await user.keyboard('{ArrowUp}');
    expect(option('Hours', '08')).toHaveAttribute('data-focused');
    rerender(
      <TimePanel locale="en-US" hourCycle={24} value={at(15, 0)} onChange={vi.fn()} {...limits} />,
    );
    expect(option('Hours', '15')).toHaveAttribute('data-focused');
    expect(option('Hours', '08')).not.toHaveAttribute('data-focused');
  });
});

describe('TimePanel — scrolling', () => {
  const centredCalls = () =>
    scrollTo.mock.calls.map(([options]) => (options as ScrollToOptions).behavior);

  it('centres the focused option in its own column, instantly on mount and smoothly after', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }));
    const user = userEvent.setup();
    render(<Controlled initial={at(10, 30)} hourCycle={24} />);
    expect(centredCalls()).toEqual(['instant', 'instant']);
    act(() => {
      column('Hours').focus();
    });
    await user.keyboard('{ArrowDown}');
    expect(centredCalls()).toEqual(['instant', 'instant', 'smooth']);
    expect(scrollTo.mock.contexts.at(-1)).toBe(column('Hours'));
  });

  it('scrolls instantly under reduced motion', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
    }));
    const user = userEvent.setup();
    render(<Controlled initial={at(10, 30)} hourCycle={24} />);
    act(() => {
      column('Hours').focus();
    });
    await user.keyboard('{ArrowDown}');
    expect(centredCalls().at(-1)).toBe('instant');
  });
});
