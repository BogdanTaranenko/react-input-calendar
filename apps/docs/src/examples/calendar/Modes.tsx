import { useState } from 'react';
import { Calendar, type DateRange } from '@b.taranenko/react-input-calendar';

export default function Modes() {
  const [day, setDay] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange | null>(null);
  const [days, setDays] = useState<Date[]>([]);

  return (
    <div className="demo-row">
      <Calendar value={day} onChange={setDay} />
      <Calendar mode="range" value={range} onChange={setRange} />
      <Calendar mode="multiple" value={days} onChange={setDays} maxSelected={5} />
    </div>
  );
}
