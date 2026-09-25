import { describe, expect, it } from 'vitest';

describe('package entry', () => {
  it('exports exactly the public runtime API', async () => {
    expect(Object.keys(await import('./index')).sort()).toEqual([
      'Calendar',
      'CalendarConfigProvider',
      'DatePicker',
      'DateRangePicker',
      'DateTimePicker',
      'MultiDatePicker',
      'defaultLabels',
    ]);
  });
});
