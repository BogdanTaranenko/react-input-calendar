import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { defaultLabels } from '../i18n/labels';
import { CalendarConfigProvider, useCalendarConfig, useLabels } from './config-context';

describe('CalendarConfigProvider', () => {
  it('provides an empty config when there is no provider', () => {
    const { result } = renderHook(() => useCalendarConfig());
    expect(result.current).toEqual({});
  });

  it('provides its props to descendants', () => {
    const { result } = renderHook(() => useCalendarConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <CalendarConfigProvider locale="de-DE" weekStartsOn={1} mobileBreakpoint={false}>
          {children}
        </CalendarConfigProvider>
      ),
    });
    expect(result.current).toEqual({ locale: 'de-DE', weekStartsOn: 1, mobileBreakpoint: false });
  });

  it('lets a nested provider override the keys it sets and inherit the rest', () => {
    const { result } = renderHook(() => useCalendarConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <CalendarConfigProvider locale="de-DE" colorScheme="dark">
          <CalendarConfigProvider locale="fr-FR" colorScheme={undefined}>
            {children}
          </CalendarConfigProvider>
        </CalendarConfigProvider>
      ),
    });
    expect(result.current).toEqual({ locale: 'fr-FR', colorScheme: 'dark' });
  });
});

describe('useLabels', () => {
  it('returns the English defaults without overrides', () => {
    const { result } = renderHook(() => useLabels(undefined));
    expect(result.current).toEqual(defaultLabels);
  });

  it('layers provider labels over the defaults, and prop labels over both', () => {
    const { result } = renderHook(() => useLabels({ nextMonth: 'Weiter' }), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <CalendarConfigProvider labels={{ nextMonth: 'Nächster', previousMonth: 'Zurück' }}>
          {children}
        </CalendarConfigProvider>
      ),
    });
    expect(result.current.nextMonth).toBe('Weiter');
    expect(result.current.previousMonth).toBe('Zurück');
    expect(result.current.clear).toBe(defaultLabels.clear);
  });
});
