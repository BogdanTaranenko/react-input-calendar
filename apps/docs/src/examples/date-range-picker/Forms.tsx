import { useState, type FormEvent } from 'react';
import { DateRangePicker } from '@b.taranenko/react-input-calendar';

export default function Forms() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
  };

  return (
    <form className="demo-stack" onSubmit={onSubmit}>
      {/* Two hidden inputs: `check_in` and `check_out`, each `YYYY-MM-DD`. */}
      <DateRangePicker label="Booking" startName="check_in" endName="check_out" required />
      <button type="submit" className="demo-button">
        Submit
      </button>
      {submitted && <p className="demo-output">Submitted: {submitted}</p>}
    </form>
  );
}
