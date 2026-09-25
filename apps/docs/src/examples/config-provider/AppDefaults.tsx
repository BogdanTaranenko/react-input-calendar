import {
  CalendarConfigProvider,
  DatePicker,
  DateRangePicker,
} from '@b.taranenko/react-input-calendar';

// Put this once near the root of your app.
export default function AppDefaults() {
  return (
    <CalendarConfigProvider
      locale="de-DE"
      weekStartsOn={1}
      labels={{ clear: 'Löschen', openCalendar: 'Kalender öffnen', done: 'Fertig' }}
    >
      <div className="demo-row">
        <DatePicker label="Termin" />
        <DateRangePicker label="Urlaub" />
      </div>
    </CalendarConfigProvider>
  );
}
