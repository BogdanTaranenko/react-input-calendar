import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Calendar } from './Calendar';

// Thursday, September 24, 2026, noon local time.
const TODAY = new Date(2026, 8, 24, 12);

const dayButton = (day: number) =>
  screen.getByRole('button', { name: new RegExp(`September ${String(day)}, 2026`) });
const cellFor = (day: number) => dayButton(day).closest('td') as HTMLElement;
const days = (dates: Date[] | undefined) => dates?.map((date) => date.getDate());

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Calendar mode="multiple"', () => {
  it('marks the grid as multi-selectable', () => {
    render(<Calendar mode="multiple" locale="en-US" />);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('toggles days on and off, keeping the value sorted', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar mode="multiple" locale="en-US" onChange={onChange} />);

    await user.click(dayButton(5));
    await user.click(dayButton(3));
    expect(days(onChange.mock.lastCall?.[0] as Date[])).toEqual([3, 5]);
    expect(cellFor(3)).toHaveAttribute('data-selected');
    expect(cellFor(5)).toHaveAttribute('aria-selected', 'true');

    await user.click(dayButton(3));
    expect(days(onChange.mock.lastCall?.[0] as Date[])).toEqual([5]);
    expect(cellFor(3)).not.toHaveAttribute('data-selected');
  });

  it('toggles with Space and Enter from the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar mode="multiple" locale="en-US" onChange={onChange} />);
    act(() => {
      dayButton(24).focus();
    });
    await user.keyboard(' ');
    expect(days(onChange.mock.lastCall?.[0] as Date[])).toEqual([24]);
    await user.keyboard('{ArrowRight}{Enter}');
    expect(days(onChange.mock.lastCall?.[0] as Date[])).toEqual([24, 25]);
  });

  it('ignores new days once maxSelected is reached, but still allows removing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        mode="multiple"
        locale="en-US"
        maxSelected={2}
        defaultValue={[new Date(2026, 8, 3), new Date(2026, 8, 5)]}
        onChange={onChange}
      />,
    );
    await user.click(dayButton(7));
    expect(onChange).not.toHaveBeenCalled();
    expect(cellFor(7)).not.toHaveAttribute('data-selected');

    await user.click(dayButton(3));
    expect(days(onChange.mock.lastCall?.[0] as Date[])).toEqual([5]);
  });

  it('puts the tab stop on the first selected day in view', () => {
    render(
      <Calendar
        mode="multiple"
        locale="en-US"
        defaultValue={[new Date(2026, 8, 12), new Date(2026, 8, 18)]}
      />,
    );
    expect(dayButton(12).tabIndex).toBe(0);
  });
});
