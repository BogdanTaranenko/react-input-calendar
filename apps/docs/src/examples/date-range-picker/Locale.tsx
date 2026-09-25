import { DateRangePicker } from '@b.taranenko/react-input-calendar';

const today = new Date();
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const week = { from: today, to: addDays(today, 6) };

export default function Locale() {
  return (
    <div className="demo-row">
      <DateRangePicker label="Français" locale="fr-FR" defaultValue={week} />
      <DateRangePicker label="עברית (RTL)" locale="he-IL" defaultValue={week} />
    </div>
  );
}
