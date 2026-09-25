import { useState } from 'react';
import { DatePicker } from '@b.taranenko/react-input-calendar';
import '@b.taranenko/react-input-calendar/styles.css';

export default function Controlled() {
  const [date, setDate] = useState<Date | null>(null);
  return <DatePicker label="Date" value={date} onChange={setDate} />;
}
