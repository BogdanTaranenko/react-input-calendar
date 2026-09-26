import { defaultLabels } from '@b.taranenko/react-input-calendar';
import { Example } from '../components/Example';
import { InlineText } from '../components/InlineText';
import { href } from '../router';
import { PageHeader } from './PageHeader';

type KeyRow = [keys: string, action: string];

const KEYBOARD: { title: string; rows: KeyRow[] }[] = [
  {
    title: 'Trigger',
    rows: [['`Enter`, `Space`', 'Open the popup. Focus moves to the selected day, or today.']],
  },
  {
    title: 'Popup',
    rows: [
      [
        '`Escape`',
        'Close it and return focus to the trigger. In the month or year view, go back to the days first.',
      ],
      [
        '`Tab`, `Shift+Tab`',
        'Move between the header, the grid, presets, time columns and Done. Focus stays inside the popup.',
      ],
    ],
  },
  {
    title: 'Day grid',
    rows: [
      ['`←` `→`', 'Previous or next day. Mirrored in right-to-left locales.'],
      ['`↑` `↓`', 'Same weekday, previous or next week.'],
      ['`Home`, `End`', 'First or last day of the week, by the locale’s week start.'],
      ['`PageUp`, `PageDown`', 'Same day, previous or next month.'],
      ['`Shift+PageUp`, `Shift+PageDown`', 'Same day, previous or next year.'],
      ['`Enter`, `Space`', 'Pick the focused day. Unavailable days can be focused but not picked.'],
    ],
  },
  {
    title: 'Month and year views',
    rows: [
      ['Arrow keys', 'Move in the 3 × 4 grid.'],
      ['`Home`, `End`', 'Start or end of the row.'],
      ['`PageUp`, `PageDown`', 'Year view: the previous or next 12 years.'],
      ['`Enter`, `Space`', 'Choose. A year opens its months; a month shows its days.'],
    ],
  },
  {
    title: 'Time columns',
    rows: [
      ['`↑` `↓`', 'Previous or next option, committed at once.'],
      ['`Home`, `End`', 'First or last option.'],
      ['Digits and letters', 'Jump to the matching option, e.g. `1` `5` for 15, or `p` for PM.'],
    ],
  },
];

const SCREEN_READER = [
  'The trigger is a button with `aria-haspopup="dialog"` and `aria-expanded`. It is named by the label and the current value, and the helper text and error are read through `aria-describedby`.',
  'The popup is a modal `<dialog>`, named by the visible month. Everything outside it is inert while it is open.',
  'The day grid is a `role="grid"` with one tab stop. Each day is read in full with the locale, e.g. “Saturday, September 26, 2026”, followed by “start of range”, “end of range” or “unavailable” when they apply. Today has `aria-current="date"`.',
  'Changing the month announces the new caption through a polite live region.',
  'Time columns are listboxes that keep focus on the column and point at the option with `aria-activedescendant`.',
  'An `error`, or a `required` picker submitted empty, sets `aria-invalid` on the trigger, and the error text is read with it.',
];

const labelValue = (value: string | ((count: number) => string)) =>
  typeof value === 'function' ? `(count) => "${value(3)}"` : `"${value}"`;

export function AccessibilityPage() {
  return (
    <>
      <PageHeader title="Accessibility">
        The popup follows the WAI-ARIA date picker dialog pattern. Every component is checked with
        axe, open and closed, in light and dark, on desktop and mobile.
      </PageHeader>

      <h2>Keyboard</h2>
      {KEYBOARD.map((group) => (
        <div
          key={group.title}
          className="table-scroll"
          role="region"
          aria-label={`${group.title} keys`}
          tabIndex={0}
        >
          <table className="props-table">
            <caption>{group.title}</caption>
            <thead>
              <tr>
                <th scope="col">Keys</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map(([keys, action]) => (
                <tr key={keys}>
                  <th scope="row">
                    <InlineText text={keys} />
                  </th>
                  <td>
                    <InlineText text={action} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <h2>Screen readers</h2>
      <ul className="prose-list">
        {SCREEN_READER.map((note) => (
          <li key={note}>
            <InlineText text={note} />
          </li>
        ))}
      </ul>

      <h2>Labels</h2>
      <p>
        Dates, months and weekdays come from <code>Intl</code> in the picker&apos;s locale. The
        remaining strings default to English. Override any of them with the <code>labels</code>{' '}
        prop, or once for the app with <a href={href('config-provider')}>CalendarConfigProvider</a>.
      </p>
      <Example path="accessibility/Labels" title="Translated labels" />
      <div className="table-scroll" role="region" aria-label="Default labels" tabIndex={0}>
        <table className="props-table">
          <caption>
            <code>defaultLabels</code>
          </caption>
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">English default</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(defaultLabels).map(([key, value]) => (
              <tr key={key}>
                <th scope="row">
                  <code>{key}</code>
                </th>
                <td>
                  <code className="prop-type">{labelValue(value)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Motion and contrast</h2>
      <p>
        All animation stops under <code>prefers-reduced-motion: reduce</code>. Selected and focused
        days stay visible in Windows High Contrast (<code>forced-colors: active</code>). The default
        colours meet WCAG AA contrast in both schemes; check your own with the{' '}
        <a href={href('theming')}>theme customiser</a> if you change them.
      </p>
    </>
  );
}
