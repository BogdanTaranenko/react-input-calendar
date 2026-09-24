import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLocaleInfo } from '../i18n/locale-info';
import { SurfaceContext } from '../overlay/surface-context';
import { Calendar } from './Calendar';

// Thursday, September 24, 2026, noon local time.
const TODAY = new Date(2026, 8, 24, 12);

const months = () => document.querySelector('.ric-months') as HTMLElement;
const caption = () => document.querySelector('.ric-caption')?.textContent;
const primary = { pointerId: 1, isPrimary: true, button: 0 };

/** A 60px horizontal swipe across the months container, started on a day. */
function swipe(direction: 'left' | 'right') {
  const start = document.querySelectorAll('.ric-day-button')[10] ?? months();
  const dx = direction === 'left' ? -60 : 60;
  fireEvent.pointerDown(start, { ...primary, clientX: 200, clientY: 200 });
  fireEvent.pointerMove(start, { ...primary, clientX: 200 + dx, clientY: 205 });
  fireEvent.pointerUp(start, { ...primary, clientX: 200 + dx, clientY: 205 });
}

function renderIn(isSheet: boolean | null, props: { locale?: string; min?: Date; max?: Date } = {}) {
  const calendar: ReactNode = <Calendar locale="en-US" {...props} />;
  return render(
    isSheet === null ? (
      calendar
    ) : (
      <SurfaceContext.Provider value={{ isSheet }}>{calendar}</SurfaceContext.Provider>
    ),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Calendar — swipe in a bottom sheet', () => {
  it('goes to the next month on a left swipe and back on a right swipe', () => {
    renderIn(true);
    expect(caption()).toBe('September 2026');
    swipe('left');
    expect(caption()).toBe('October 2026');
    swipe('right');
    swipe('right');
    expect(caption()).toBe('August 2026');
  });

  it('mirrors the swipe directions right-to-left', () => {
    renderIn(true, { locale: 'ar' });
    const format = getLocaleInfo('ar').formatMonthYear;
    swipe('left');
    expect(caption()).toBe(format(new Date(2026, 7, 1)));
    swipe('right');
    swipe('right');
    expect(caption()).toBe(format(new Date(2026, 9, 1)));
  });

  it.each([
    ['in a popover', false],
    ['outside any surface', null],
  ] as const)('ignores swipes %s', (_, isSheet) => {
    renderIn(isSheet);
    swipe('left');
    expect(caption()).toBe('September 2026');
  });

  it('stops at min and max, like the navigation buttons', () => {
    renderIn(true, { min: new Date(2026, 8, 1), max: new Date(2026, 8, 30) });
    swipe('left');
    expect(caption()).toBe('September 2026');
    swipe('right');
    expect(caption()).toBe('September 2026');
  });

  it('does not change month from the month or year views', async () => {
    renderIn(true);
    await userEvent.click(screen.getByRole('button', { name: /Choose month/ }));
    const start = months();
    fireEvent.pointerDown(start, { ...primary, clientX: 200, clientY: 200 });
    fireEvent.pointerUp(start, { ...primary, clientX: 120, clientY: 205 });
    await userEvent.keyboard('{Escape}');
    expect(caption()).toBe('September 2026');
  });
});
