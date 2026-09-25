import { useState } from 'react';
import { MultiDatePicker } from '@b.taranenko/react-input-calendar';

export default function Basic() {
  const [days, setDays] = useState<Date[]>([]);

  return (
    <div className="demo-stack">
      <MultiDatePicker label="Shift days" value={days} onChange={setDays} />
      <p className="demo-output">
        {days.length} picked{days.length > 0 && `: ${days.map((day) => day.getDate()).join(', ')}`}
      </p>
    </div>
  );
}
