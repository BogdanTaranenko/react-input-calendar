import { CodeBlock } from '../components/CodeBlock';
import { InlineText } from '../components/InlineText';
import { SlotDiagram } from '../components/SlotDiagram';
import { ThemeCustomizer } from '../components/ThemeCustomizer';
import { dataAttributes } from '../theming/data-attributes';
import { tokenDefaults } from '../theming/defaults';
import { slotClass, slotDocs } from '../theming/slot-docs';
import { tokenDocs } from '../theming/token-docs';
import { href } from '../router';
import { PageHeader } from './PageHeader';

const OVERRIDE_CSS = `/* Everywhere */
:root {
  --ric-accent: #0f766e;
  --ric-radius-cell: 8px;
}

/* One part of the page */
.checkout {
  --ric-cell-size: 44px;
}`;

const LAYER_CSS = `/* Plain CSS: unlayered, so it beats @layer ric without !important. */
.ric-day-button {
  font-weight: 600;
}

.ric-day[data-weekend] > .ric-day-button {
  color: crimson;
}`;

const SCOPE_CSS = `/* The wrapper re-declares every token, so override on it, not on :root. */
.sidebar[data-ric-theme='dark'] {
  --ric-accent: #fbbf24;
}`;

const NO_CSS = `<DatePicker
  label="Date"
  classNames={{
    trigger: 'my-trigger',
    popover: 'my-popover',
    dayButton: 'my-day',
  }}
/>`;

const NO_CSS_STYLES = `/* Style the state attributes, not extra classes. */
.my-day[data-selected] {
  background: black;
  color: white;
}`;

export function ThemingPage() {
  return (
    <>
      <PageHeader title="Theming">
        Change the look with <code>--ric-*</code> variables, reach any part by its slot class, and
        style state through <code>data-*</code> attributes.
      </PageHeader>

      <h2>Theme customiser</h2>
      <p>
        Every control sets a variable on the preview. Open the picker: the popup follows, because it
        renders inside the picker and inherits from it. Copy the CSS when you like the result.
      </p>
      <ThemeCustomizer />

      <h2>How tokens work</h2>
      <p>
        The defaults live on <code>:root</code> inside <code>@layer ric</code>. Set a token on{' '}
        <code>:root</code> for the whole app, on a wrapper for one area, or through a
        component&apos;s <code>style</code> for one picker.
      </p>
      <CodeBlock lang="css" code={OVERRIDE_CSS} />
      <p>
        An element with <code>data-ric-theme</code>, including a picker with{' '}
        <code>colorScheme</code>, re-declares the tokens for everything inside it. To change a token
        there, set it on that element or below it.
      </p>
      <CodeBlock lang="css" code={SCOPE_CSS} />

      <h2>Cascade layer</h2>
      <p>
        All library CSS sits in <code>@layer ric</code>. Unlayered CSS, including CSS Modules and
        most CSS-in-JS, always wins over layered CSS, whatever the specificity. Tailwind is layered
        too: see the <a href={href('recipes')}>Tailwind recipe</a> for the one line it needs.
      </p>
      <CodeBlock lang="css" code={LAYER_CSS} />

      <h2 id="tokens">Tokens</h2>
      <div className="table-scroll" role="region" aria-label="Token reference" tabIndex={0}>
        <table className="props-table">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Light</th>
              <th scope="col">Dark</th>
              <th scope="col">Affects</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(tokenDocs).map(([token, affects]) => (
              <tr key={token}>
                <th scope="row">
                  <code>{token}</code>
                </th>
                <td>
                  <code className="prop-type">{tokenDefaults.light[token] ?? '—'}</code>
                </td>
                <td>
                  <code className="prop-type">
                    {tokenDefaults.dark[token] ?? (token in tokenDefaults.light ? 'same' : '—')}
                  </code>
                </td>
                <td>
                  <InlineText text={affects} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="slots">Slots</h2>
      <p>
        Every part has a slot name. It renders the class <code>ric-&lt;kebab-name&gt;</code>, and
        takes extra classes and styles through <code>classNames</code> and <code>styles</code>, on a
        component or on <code>CalendarConfigProvider</code>.
      </p>
      <SlotDiagram />
      <div className="table-scroll" role="region" aria-label="Slot reference" tabIndex={0}>
        <table className="props-table">
          <thead>
            <tr>
              <th scope="col">Slot</th>
              <th scope="col">Class</th>
              <th scope="col">Element</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(slotDocs).map(([slot, text]) => (
              <tr key={slot}>
                <th scope="row">
                  <code>{slot}</code>
                </th>
                <td>
                  <code className="prop-type">.{slotClass(slot)}</code>
                </td>
                <td>
                  <InlineText text={text} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="data-attributes">State attributes</h2>
      <p>
        State attributes are present or absent, never <code>"false"</code>, so select them with{' '}
        <code>[data-selected]</code>.
      </p>
      <div
        className="table-scroll"
        role="region"
        aria-label="Data attribute reference"
        tabIndex={0}
      >
        <table className="props-table">
          <thead>
            <tr>
              <th scope="col">Attribute</th>
              <th scope="col">On</th>
              <th scope="col">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {dataAttributes.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  <code>{row.name}</code>
                </th>
                <td>{row.on}</td>
                <td>
                  <InlineText text={row.description} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Without the stylesheet</h2>
      <p>
        Every component works without <code>styles.css</code>: keyboard, focus, the dialog, forms
        and the live region all come from the markup and the script. Leave the import out and style
        the slot classes, or pass your own through <code>classNames</code>.
      </p>
      <CodeBlock code={NO_CSS} />
      <CodeBlock lang="css" code={NO_CSS_STYLES} />
    </>
  );
}
