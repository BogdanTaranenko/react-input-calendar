import { useLayoutEffect, useRef, useState } from 'react';
import { Calendar, DateTimePicker } from '@b.taranenko/react-input-calendar';

const LOCALES = ['en-US', 'en-GB', 'de-DE', 'ja-JP', 'ar-EG', 'he-IL', 'fr-CA'];

interface Facts {
  weekStart: string;
  direction: string;
  clock: string;
}

const clockOf = (locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle?.startsWith('h1')
    ? '12-hour'
    : '24-hour';

/** Renders the pickers in one locale and reads the facts back from what they rendered. */
export function LocaleSwitcher() {
  const [locale, setLocale] = useState('en-US');
  const [facts, setFacts] = useState<Facts | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const now = useRef(new Date());

  useLayoutEffect(() => {
    const calendar = preview.current?.querySelector('.ric-calendar');
    const firstWeekday = preview.current?.querySelector('.ric-weekday');
    setFacts({
      weekStart: firstWeekday?.getAttribute('abbr') ?? '…',
      direction: calendar?.getAttribute('dir') === 'rtl' ? 'Right to left' : 'Left to right',
      clock: clockOf(locale),
    });
  }, [locale]);

  return (
    <div className="locale-switcher">
      <div className="segmented" role="group" aria-label="Locale">
        {LOCALES.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === locale}
            onClick={() => {
              setLocale(item);
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <dl className="locale-facts" aria-live="polite">
        <div>
          <dt>Week starts</dt>
          <dd>{facts?.weekStart}</dd>
        </div>
        <div>
          <dt>Direction</dt>
          <dd>{facts?.direction}</dd>
        </div>
        <div>
          <dt>Clock</dt>
          <dd>{facts?.clock}</dd>
        </div>
      </dl>
      <div ref={preview} className="example-preview demo-row">
        <DateTimePicker label={locale} locale={locale} defaultValue={now.current} />
        <Calendar locale={locale} defaultValue={now.current} />
      </div>
    </div>
  );
}
