import { CodeBlock } from '../components/CodeBlock';
import { Example } from '../components/Example';
import { href } from '../router';
import { PageHeader } from './PageHeader';

const NEXT_SERVER = `// app/page.tsx: a server component
import { DatePicker } from '@b.taranenko/react-input-calendar';

export default function Page() {
  // Plain props are fine here. Functions are not.
  return <DatePicker label="Date" name="date" />;
}`;

const NEXT_CLIENT = `// app/date-field.tsx
'use client';
import { DatePicker } from '@b.taranenko/react-input-calendar';

export function DateField() {
  return <DatePicker label="Date" onChange={(date) => save(date)} />;
}`;

export function GettingStartedPage() {
  return (
    <>
      <PageHeader title="Getting started">
        Install the package, import the stylesheet once, and render a picker.
      </PageHeader>

      <h2>Install</h2>
      <CodeBlock lang="bash" code="npm i @b.taranenko/react-input-calendar" />
      <p>
        React 18 or 19 is the only peer dependency. The package has no runtime dependencies of its
        own.
      </p>

      <h2>Import the styles</h2>
      <CodeBlock code="import '@b.taranenko/react-input-calendar/styles.css';" />
      <p>
        Import it once, for example in your root layout. The components also work without it, if you
        would rather style them yourself.
      </p>

      <h2>Render a picker</h2>
      <Example path="getting-started/Uncontrolled" title="Uncontrolled">
        The picker keeps its own value.
      </Example>
      <Example path="getting-started/Controlled" title="Controlled">
        You own the value. <code>onChange</code> receives a <code>Date</code> at local midnight, or{' '}
        <code>null</code> when cleared.
      </Example>

      <h2>Next.js</h2>
      <p>
        The package ships with a <code>"use client"</code> banner, so you can render the components
        straight from a server component file. Function props such as <code>onChange</code>,{' '}
        <code>renderDay</code> and <code>formatValue</code> cannot cross from a server component to
        a client one, so pass them from a client component.
      </p>
      <CodeBlock code={NEXT_SERVER} />
      <CodeBlock code={NEXT_CLIENT} />

      <h2>Next steps</h2>
      <ul>
        <li>
          <a href={href('date-picker')}>DatePicker</a>, with every prop group
        </li>
        <li>
          <a href={href('config-provider')}>CalendarConfigProvider</a> for app-wide locale and
          labels
        </li>
      </ul>
    </>
  );
}
