import type { ComponentType } from 'react';
import { CalendarPage } from './pages/Calendar';
import { ConfigProviderPage } from './pages/ConfigProvider';
import { DatePickerPage } from './pages/DatePicker';
import { DateRangePickerPage } from './pages/DateRangePicker';
import { DateTimePickerPage } from './pages/DateTimePicker';
import { GettingStartedPage } from './pages/GettingStarted';
import { HomePage } from './pages/Home';
import { MultiDatePickerPage } from './pages/MultiDatePicker';

export interface RouteDef {
  path: string;
  title: string;
  section: 'Introduction' | 'Components';
  Page: ComponentType;
}

export const routes: RouteDef[] = [
  { path: '', title: 'Overview', section: 'Introduction', Page: HomePage },
  {
    path: 'getting-started',
    title: 'Getting started',
    section: 'Introduction',
    Page: GettingStartedPage,
  },
  { path: 'date-picker', title: 'DatePicker', section: 'Components', Page: DatePickerPage },
  {
    path: 'date-range-picker',
    title: 'DateRangePicker',
    section: 'Components',
    Page: DateRangePickerPage,
  },
  {
    path: 'multi-date-picker',
    title: 'MultiDatePicker',
    section: 'Components',
    Page: MultiDatePickerPage,
  },
  {
    path: 'date-time-picker',
    title: 'DateTimePicker',
    section: 'Components',
    Page: DateTimePickerPage,
  },
  { path: 'calendar', title: 'Calendar', section: 'Components', Page: CalendarPage },
  {
    path: 'config-provider',
    title: 'CalendarConfigProvider',
    section: 'Components',
    Page: ConfigProviderPage,
  },
];

export const sections = ['Introduction', 'Components'] as const;
