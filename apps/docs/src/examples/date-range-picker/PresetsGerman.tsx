import { DateRangePicker, type RangePreset } from '@b.taranenko/react-input-calendar';

const day = (year: number, month: number, date: number) => new Date(year, month, date);

// The same list, translated: the labels are yours, so any language works.
const presets: RangePreset[] = [
  {
    label: 'Letzte 7 Tage',
    value: () => {
      const now = new Date();
      return { from: day(now.getFullYear(), now.getMonth(), now.getDate() - 6), to: now };
    },
  },
  {
    label: 'Letzte 30 Tage',
    value: () => {
      const now = new Date();
      return { from: day(now.getFullYear(), now.getMonth(), now.getDate() - 29), to: now };
    },
  },
  {
    label: 'Dieser Monat',
    value: () => {
      const now = new Date();
      return {
        from: day(now.getFullYear(), now.getMonth(), 1),
        to: day(now.getFullYear(), now.getMonth() + 1, 0),
      };
    },
  },
  {
    label: 'Letzter Monat',
    value: () => {
      const now = new Date();
      return {
        from: day(now.getFullYear(), now.getMonth() - 1, 1),
        to: day(now.getFullYear(), now.getMonth(), 0),
      };
    },
  },
];

export default function PresetsGerman() {
  return (
    <DateRangePicker
      label="Berichtszeitraum"
      locale="de-DE"
      presets={presets}
      labels={{ presets: 'Schnellauswahl', clear: 'Löschen', openCalendar: 'Kalender öffnen' }}
    />
  );
}
