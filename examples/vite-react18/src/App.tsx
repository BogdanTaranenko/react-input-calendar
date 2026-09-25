import { useState } from 'react';
import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  MultiDatePicker,
  type DateRange,
} from '@b.taranenko/react-input-calendar';

/** All four pickers, controlled, so their public types are checked against React 18's. */
export function App() {
  const [date, setDate] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange | null>(null);
  const [dates, setDates] = useState<Date[]>([]);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  return (
    <main>
      <h1>React 18 consumer</h1>
      <DatePicker label="Date" value={date} onChange={setDate} />
      <DateRangePicker label="Range" value={range} onChange={setRange} />
      <MultiDatePicker label="Dates" value={dates} onChange={setDates} />
      <DateTimePicker label="Date and time" value={dateTime} onChange={setDateTime} />
    </main>
  );
}
