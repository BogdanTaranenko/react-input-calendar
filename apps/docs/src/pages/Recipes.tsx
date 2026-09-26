import { CodeBlock } from '../components/CodeBlock';
import { Example } from '../components/Example';
import cssModuleSource from '../examples/recipes/picker.module.css?raw';
import { PageHeader } from './PageHeader';

const TAILWIND_CSS = `/* app.css: the one stylesheet your app imports */
@layer theme, base, ric, components, utilities;
@import "tailwindcss";
@import "@b.taranenko/react-input-calendar/styles.css";`;

const TAILWIND_TSX = `<DatePicker
  label="Date"
  classNames={{
    trigger: 'rounded-full border-2 focus-visible:border-indigo-600',
    // data-selected is on the cell; *: reaches the button inside it.
    day: 'data-[weekend]:text-rose-600 data-[selected]:*:bg-indigo-600 data-[selected]:*:text-white',
  }}
/>`;

const NEXT_PAGE = `// app/booking/page.tsx: a server component
import { DatePicker } from '@b.taranenko/react-input-calendar';
import { book } from './actions';

export default function BookingPage() {
  return (
    <form action={book}>
      <DatePicker label="Date" name="date" required />
      <button type="submit">Book</button>
    </form>
  );
}`;

const NEXT_ACTION = `// app/booking/actions.ts
'use server';

export async function book(formData: FormData) {
  const date = formData.get('date'); // "2026-09-26", the local day the user picked
  // …
}`;

const NEXT_LAYOUT = `// app/layout.tsx
import '@b.taranenko/react-input-calendar/styles.css';`;

export function RecipesPage() {
  return (
    <>
      <PageHeader title="Recipes">
        Tailwind, CSS Modules, react-hook-form and the Next.js App Router.
      </PageHeader>

      <h2 id="tailwind">Tailwind CSS v4</h2>
      <p>
        Tailwind&apos;s base layer resets every <code>button</code>. Import the library CSS from the
        same file as Tailwind, after a layer order that puts <code>ric</code> between{' '}
        <code>base</code> and <code>components</code>:
      </p>
      <CodeBlock lang="css" code={TAILWIND_CSS} />
      <p className="callout">
        Do not import <code>styles.css</code> from JavaScript as well, or before your Tailwind CSS.
        The first file to name a layer fixes its place, so <code>ric</code> would land below{' '}
        <code>base</code> and the reset would win.
      </p>
      <p>
        Utilities are layered above <code>ric</code>, so they win without <code>!</code>. Pass them
        per slot, and use <code>data-[…]</code> variants for state:
      </p>
      <CodeBlock code={TAILWIND_TSX} />

      <h2 id="css-modules">CSS Modules</h2>
      <p>
        Module classes are unlayered, so they beat the library styles with a single class. Pass them
        per slot through <code>classNames</code>.
      </p>
      <CodeBlock lang="css" code={cssModuleSource} />
      <Example path="recipes/CssModules" title="With a CSS Module" />

      <h2 id="react-hook-form">react-hook-form</h2>
      <p>
        Wrap each picker in a <code>Controller</code>. Values are <code>Date</code> objects, so no
        parsing is needed; show the field error through the picker&apos;s <code>error</code> prop.
      </p>
      <Example path="recipes/HookForm" title="Controller">
        Submit empty to see the validation messages.
      </Example>

      <h2 id="nextjs">Next.js App Router</h2>
      <p>
        The package starts with <code>&quot;use client&quot;</code>, so server components can render
        it. Only serialisable props can cross that boundary: pass <code>onChange</code>,{' '}
        <code>renderDay</code>, <code>formatValue</code> and other functions from a client
        component.
      </p>
      <CodeBlock code={NEXT_LAYOUT} />
      <p>
        With <code>name</code>, a picker submits plain strings, so a server action needs no client
        code at all:
      </p>
      <CodeBlock code={NEXT_PAGE} />
      <CodeBlock code={NEXT_ACTION} />
      <h3>Time zones</h3>
      <p>
        A <code>Date</code> is a moment, and the picker shows it in the zone of whoever renders it.
        If the server runs in UTC and the user is in Sydney, a value created on the server can show
        as a different day in the server-rendered trigger. Create date values on the client, or send
        the day as a <code>YYYY-MM-DD</code> string and build the <code>Date</code> in the browser.
        Form submissions are already local <code>YYYY-MM-DD</code> strings.
      </p>
    </>
  );
}
