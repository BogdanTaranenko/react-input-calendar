import { useState } from 'react';
import { DateTimePicker } from '@b.taranenko/react-input-calendar';

export default function Basic() {
  const [value, setValue] = useState<Date | null>(null);

  return (
    <div className="demo-stack">
      {/* Every change commits at once; Done, Escape or an outside press closes. */}
      <DateTimePicker label="Meeting" value={value} onChange={setValue} />
      <p className="demo-output">Value: {value ? value.toString() : 'none'}</p>
    </div>
  );
}
