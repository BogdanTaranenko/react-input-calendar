import { CodeBlock } from '../components/CodeBlock';
import { Example } from '../components/Example';
import { LocaleSwitcher } from '../components/LocaleSwitcher';
import { href } from '../router';
import { PageHeader } from './PageHeader';

const OVERRIDES = `<DatePicker locale="en-US" weekStartsOn={1} />   // Monday, whatever the locale says
<DateTimePicker locale="de-DE" hourCycle={12} />   // AM/PM in German`;

export function I18nPage() {
  return (
    <>
      <PageHeader title="Internationalisation">
        One <code>locale</code> prop drives names, digits, week start, direction and the clock, all
        from the browser&apos;s <code>Intl</code>. No locale data ships with the package.
      </PageHeader>

      <h2>Try a locale</h2>
      <p>The facts below are read back from what the calendar rendered.</p>
      <LocaleSwitcher />

      <h2>What the locale decides</h2>
      <ul className="prose-list">
        <li>Month and weekday names, and the trigger text.</li>
        <li>
          Digits, e.g. Arabic-Indic digits for <code>ar-EG</code>.
        </li>
        <li>
          The first day of the week. Override it with <code>weekStartsOn</code> (0 = Sunday).
        </li>
        <li>
          Text direction. Right-to-left locales mirror the layout, and the arrow keys with it.
        </li>
        <li>
          The 12- or 24-hour clock of <code>DateTimePicker</code>. Override it with{' '}
          <code>hourCycle</code>.
        </li>
      </ul>
      <CodeBlock code={OVERRIDES} />
      <p>
        Without a <code>locale</code>, a picker uses the browser&apos;s language, and{' '}
        <code>en-US</code> while rendering on the server; it switches after hydration without a
        mismatch. Set it once for the app with{' '}
        <a href={href('config-provider')}>CalendarConfigProvider</a>.
      </p>
      <p>
        The calendar is always Gregorian. Locales whose default calendar is another one, such as{' '}
        <code>fa-IR</code> or <code>th-TH</code>, are not supported yet.
      </p>

      <h2>Translating the labels</h2>
      <p>
        A handful of strings, such as button names and “unavailable”, cannot come from{' '}
        <code>Intl</code>. They default to English; the <code>CalendarLabels</code> type lists them
        all.
      </p>
      <Example path="i18n/TranslatedLabels" title="Canadian French" />
    </>
  );
}
