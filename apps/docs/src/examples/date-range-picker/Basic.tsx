import { useState } from 'react';
import { DateRangePicker, type DateRange } from '@b.taranenko/react-input-calendar';

export default function Basic() {
  const [range, setRange] = useState<DateRange | null>(null);

  return (
    <div className="demo-stack">
      <DateRangePicker label="Stay" value={range} onChange={setRange} />
      <p className="demo-output">
        from: {range?.from.toDateString() ?? 'none'} · to: {range?.to?.toDateString() ?? 'none'}
      </p>
    </div>
  );
}
