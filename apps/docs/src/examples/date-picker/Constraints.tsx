import { DatePicker } from '@b.taranenko/react-input-calendar';

const today = new Date();
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export default function Constraints() {
  return (
    <div className="demo-row">
      <DatePicker label="Next 30 days" min={today} max={addDays(today, 30)} />
      <DatePicker
        label="Weekdays only"
        // A DateMatcher: a Date, { from, to }, { dayOfWeek }, a predicate, or an array of them.
        disabledDates={[{ dayOfWeek: [0, 6] }, { from: addDays(today, 3), to: addDays(today, 5) }]}
      />
    </div>
  );
}
