import type { ComponentType } from 'react';
import { AccessibilityPage } from './pages/Accessibility';
import { CalendarPage } from './pages/Calendar';
import { ConfigProviderPage } from './pages/ConfigProvider';
import { DatePickerPage } from './pages/DatePicker';
import { DateRangePickerPage } from './pages/DateRangePicker';
import { DateTimePickerPage } from './pages/DateTimePicker';
import { GettingStartedPage } from './pages/GettingStarted';
import { HomePage } from './pages/Home';
import { I18nPage } from './pages/I18n';
import { MultiDatePickerPage } from './pages/MultiDatePicker';
import { RecipesPage } from './pages/Recipes';
import { ThemingPage } from './pages/Theming';

export interface RouteDef {
  path: string;
  title: string;
  section: 'Introduction' | 'Components' | 'Guides';
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
  { path: 'theming', title: 'Theming', section: 'Guides', Page: ThemingPage },
  { path: 'accessibility', title: 'Accessibility', section: 'Guides', Page: AccessibilityPage },
  { path: 'i18n', title: 'Internationalisation', section: 'Guides', Page: I18nPage },
  { path: 'recipes', title: 'Recipes', section: 'Guides', Page: RecipesPage },
];

export const sections = ['Introduction', 'Components', 'Guides'] as const;
