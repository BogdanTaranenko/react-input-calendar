import type { ComponentType } from 'react';
import { InDialogFixture, FormFixture, ScrollFixture } from './containers';
import {
  DatePickerFixture,
  DateRangeFixture,
  DateTimeFixture,
  DisabledFixture,
  FieldFixture,
  MinMaxFixture,
  MultiDateFixture,
  RtlFixture,
} from './pickers';
import { TailwindFixture } from './tailwind';
import { AccentAncestorFixture, DarkAncestorFixture, DarkPropFixture } from './theming';

/** Routed as `#/<name>`. The names are shared with `tests/fixtures.ts`. */
export const fixtures: Record<string, ComponentType | undefined> = {
  'date-picker': DatePickerFixture,
  'date-range': DateRangeFixture,
  'multi-date': MultiDateFixture,
  'date-time': DateTimeFixture,
  field: FieldFixture,
  disabled: DisabledFixture,
  'min-max': MinMaxFixture,
  rtl: RtlFixture,
  'dark-prop': DarkPropFixture,
  'dark-ancestor': DarkAncestorFixture,
  'accent-ancestor': AccentAncestorFixture,
  scroll: ScrollFixture,
  'in-dialog': InDialogFixture,
  form: FormFixture,
  tailwind: TailwindFixture,
};
