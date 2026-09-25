import { useState } from 'react';
import { DatePicker } from '@b.taranenko/react-input-calendar';

export default function Basic() {
  const [value, setValue] = useState<Date | null>(null);

  return (
    <div className="demo-row">
      {/* Uncontrolled: the picker keeps its own value. */}
      <DatePicker label="Uncontrolled" defaultValue={new Date()} />

      {/* Controlled: you own the value. */}
      <div className="demo-stack">
        <DatePicker label="Controlled" value={value} onChange={setValue} />
        <p className="demo-output">Value: {value ? value.toDateString() : 'none'}</p>
      </div>
    </div>
  );
}
