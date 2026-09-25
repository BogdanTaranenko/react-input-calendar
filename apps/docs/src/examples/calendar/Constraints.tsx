import { Calendar } from '@b.taranenko/react-input-calendar';

const today = new Date();
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export default function Constraints() {
  return (
    <Calendar
      mode="range"
      min={today}
      max={addDays(today, 60)}
      minDays={2}
      maxDays={7}
      disabledDates={(date) => date.getDate() === 13}
    />
  );
}
