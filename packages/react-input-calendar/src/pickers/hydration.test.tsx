import { act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';
import { DateTimePicker } from './DateTimePicker';
import { MultiDatePicker } from './MultiDatePicker';

const SEP_10 = new Date(2026, 8, 10);
const SEP_24 = new Date(2026, 8, 24);
const SHARED = { label: 'When', description: 'Pick a day', required: true } as const;

// React's development build reports every hydration mismatch, attributes included; a
// production build (as `next start` serves) stays silent about attribute-only ones.
const pickers: [name: string, element: ReactElement][] = [
  ['DatePicker, empty', <DatePicker {...SHARED} name="date" />],
  ['DatePicker, with a value', <DatePicker {...SHARED} name="date" defaultValue={SEP_24} />],
  ['DateRangePicker, empty', <DateRangePicker {...SHARED} startName="from" endName="to" />],
  [
    'DateRangePicker, with a value',
    <DateRangePicker
      {...SHARED}
      startName="from"
      endName="to"
      defaultValue={{ from: SEP_10, to: SEP_24 }}
    />,
  ],
  ['MultiDatePicker, empty', <MultiDatePicker {...SHARED} name="dates" />],
  [
    'MultiDatePicker, with a value',
    <MultiDatePicker {...SHARED} name="dates" defaultValue={[SEP_10, SEP_24]} />,
  ],
  ['DateTimePicker, empty', <DateTimePicker {...SHARED} name="at" />],
  [
    'DateTimePicker, with a value',
    <DateTimePicker {...SHARED} name="at" defaultValue={new Date(2026, 8, 24, 14, 30)} />,
  ],
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pickers — server rendering and hydration', () => {
  it.each(pickers)('%s hydrates the server HTML with no mismatch', async (_, element) => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onRecoverableError = vi.fn();

    const root = await act(() => hydrateRoot(container, element, { onRecoverableError }));
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(container.querySelector('.ric-trigger')).toHaveAttribute('aria-haspopup', 'dialog');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
