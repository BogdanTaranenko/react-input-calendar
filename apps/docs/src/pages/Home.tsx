import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  MultiDatePicker,
} from '@b.taranenko/react-input-calendar';
import { CodeBlock } from '../components/CodeBlock';
import { InlineText } from '../components/InlineText';
import { stats } from '../content/stats';
import { ThemeSwitch } from '../layout/ThemeSwitch';
import { href } from '../router';

const POINTS = [
  {
    title: 'Zero dependencies',
    text: `Only React as a peer. ${stats.all} min+gzip for everything, ${stats.datePicker} for DatePicker alone, ${stats.css} of CSS.`,
  },
  {
    title: 'Accessible',
    text: 'The WAI-ARIA date picker dialog pattern: full keyboard grid, focus trap, localized labels and announced month changes. Checked with axe on every component.',
  },
  {
    title: 'Themeable',
    text: 'Every colour, radius and size is a `--ric-*` variable, every part takes a class, and all CSS sits in a cascade layer your styles beat.',
  },
];

export function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">React 18 and 19 · SSR-ready · 4 pickers + inline calendar</p>
        <h1 id="hero-title" tabIndex={-1}>
          Date pickers that look finished out of the box.
        </h1>
        <p className="lead">
          Popover on desktop, bottom sheet on phones, dark mode, RTL and native form submission.
          Import one stylesheet and go.
        </p>
        <div className="hero-actions">
          <a className="button-primary" href={href('getting-started')}>
            Get started
          </a>
          <ThemeSwitch />
        </div>
        <div className="hero-demo">
          <DatePicker label="Date" defaultValue={new Date()} />
          <DateRangePicker label="Date range" />
          <MultiDatePicker label="Multiple dates" />
          <DateTimePicker label="Date and time" />
        </div>
      </section>

      <ul className="points">
        {POINTS.map((point) => (
          <li key={point.title}>
            <h2>{point.title}</h2>
            <p>
              <InlineText text={point.text} />
            </p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="install">
        <h2 id="install">Install</h2>
        <CodeBlock lang="bash" code="npm i @b.taranenko/react-input-calendar" />
      </section>
    </>
  );
}
