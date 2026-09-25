// A server component: no 'use client' here. The library's entry is a client module, so only
// serialisable props cross the boundary.
import { DatePicker, DateRangePicker } from '@b.taranenko/react-input-calendar';

export default function Home() {
  return (
    <main>
      <h1>Server-rendered pickers</h1>
      <DatePicker label="Check-in" />
      <DateRangePicker label="Stay" />
    </main>
  );
}
