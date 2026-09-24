import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { WeekStartsOn } from '../date/date-math';
import { defaultLabels, type CalendarLabels } from '../i18n/labels';
import type { SlotClassNames, SlotStyles } from './slots';

export type ColorScheme = 'system' | 'light' | 'dark';

/** App-wide defaults. Component props override them. */
export interface CalendarConfig {
  locale?: string | undefined;
  weekStartsOn?: WeekStartsOn | undefined;
  labels?: Partial<CalendarLabels> | undefined;
  classNames?: SlotClassNames | undefined;
  styles?: SlotStyles | undefined;
  mobileBreakpoint?: number | false | undefined;
  colorScheme?: ColorScheme | undefined;
}

const CalendarConfigContext = createContext<CalendarConfig>({});

export interface CalendarConfigProviderProps extends CalendarConfig {
  children?: ReactNode;
}

/** Sets defaults for every picker and calendar below it. Nested providers override per key. */
export function CalendarConfigProvider({ children, ...config }: CalendarConfigProviderProps) {
  const parent = useContext(CalendarConfigContext);
  const { locale, weekStartsOn, labels, classNames, styles, mobileBreakpoint, colorScheme } =
    config;
  const value = useMemo(() => {
    const own: CalendarConfig = {
      locale,
      weekStartsOn,
      labels,
      classNames,
      styles,
      mobileBreakpoint,
      colorScheme,
    };
    const defined = Object.entries(own).filter(([, item]) => item !== undefined);
    return { ...parent, ...(Object.fromEntries(defined) as CalendarConfig) };
  }, [parent, locale, weekStartsOn, labels, classNames, styles, mobileBreakpoint, colorScheme]);

  return <CalendarConfigContext.Provider value={value}>{children}</CalendarConfigContext.Provider>;
}

export function useCalendarConfig(): CalendarConfig {
  return useContext(CalendarConfigContext);
}

/** English defaults ← provider labels ← prop labels. */
export function useLabels(propLabels: Partial<CalendarLabels> | undefined): CalendarLabels {
  const providerLabels = useCalendarConfig().labels;
  return useMemo(
    () => ({ ...defaultLabels, ...providerLabels, ...propLabels }),
    [providerLabels, propLabels],
  );
}
