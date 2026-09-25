import { useState } from 'react';
import { Calendar } from '@b.taranenko/react-input-calendar';

export default function ControlledMonth() {
  const [month, setMonth] = useState(() => new Date());

  const jumpToToday = () => {
    setMonth(new Date());
  };

  return (
    <div className="demo-stack">
      <button type="button" className="demo-button" onClick={jumpToToday}>
        Back to this month
      </button>
      <Calendar month={month} onMonthChange={setMonth} />
      <p className="demo-output">
        Showing {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}
