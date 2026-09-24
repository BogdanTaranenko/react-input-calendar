import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { CalendarConfigProvider } from './config-context';
import { SLOT_NAMES, slotClassName, useSlots, type SlotName } from './slots';

describe('SLOT_NAMES', () => {
  it('is the complete list from the plan (§ 2.2)', () => {
    expect(SLOT_NAMES).toEqual([
      'root', 'label', 'description', 'error', 'field', 'trigger', 'triggerValue',
      'triggerIcon', 'clearButton', 'popover', 'sheet', 'backdrop', 'sheetHandle',
      'calendar', 'header', 'caption', 'navButton', 'months', 'month', 'grid', 'weekdays',
      'weekday', 'week', 'day', 'dayButton', 'monthGrid', 'monthButton', 'yearGrid',
      'yearButton', 'presets', 'preset', 'timePanel', 'timeColumn', 'timeOption', 'footer',
      'doneButton', 'liveRegion',
    ]);
  });
});

describe('slotClassName', () => {
  it.each<[SlotName, string]>([
    ['root', 'ric-root'],
    ['triggerValue', 'ric-trigger-value'],
    ['dayButton', 'ric-day-button'],
    ['liveRegion', 'ric-live-region'],
  ])('%s → %s', (name, className) => {
    expect(slotClassName(name)).toBe(className);
  });
});

describe('useSlots', () => {
  const provider = ({ children }: { children: ReactNode }) => (
    <CalendarConfigProvider
      classNames={{ day: 'from-provider' }}
      styles={{ day: { color: 'red', margin: 1 } }}
    >
      {children}
    </CalendarConfigProvider>
  );

  it('gives the default class and no style when nothing is customised', () => {
    const { result } = renderHook(() => useSlots({}));
    expect(result.current('dayButton')).toEqual({ className: 'ric-day-button', style: undefined });
  });

  it('concatenates default, provider, prop and extra classes in that order', () => {
    const { result } = renderHook(() => useSlots({ classNames: { day: 'from-prop' } }), {
      wrapper: provider,
    });
    expect(result.current('day', 'extra').className).toBe(
      'ric-day from-provider from-prop extra',
    );
  });

  it('shallow-merges styles with the prop winning', () => {
    const { result } = renderHook(() => useSlots({ styles: { day: { color: 'blue' } } }), {
      wrapper: provider,
    });
    expect(result.current('day').style).toEqual({ color: 'blue', margin: 1 });
  });

  it('uses the provider style alone when the prop has none', () => {
    const { result } = renderHook(() => useSlots({}), { wrapper: provider });
    expect(result.current('day').style).toEqual({ color: 'red', margin: 1 });
  });
});
