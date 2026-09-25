import { DateRangePicker } from '@b.taranenko/react-input-calendar';

const today = new Date();
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export default function Constraints() {
  return (
    <div className="demo-row">
      <DateRangePicker
        label="2 to 14 nights, from today"
        min={today}
        minDays={3}
        maxDays={15}
        description="Both ends count, so 3 days is 2 nights."
      />
      <DateRangePicker
        label="No weekends"
        disabledDates={{ dayOfWeek: [0, 6] }}
        max={addDays(today, 90)}
      />
    </div>
  );
}
