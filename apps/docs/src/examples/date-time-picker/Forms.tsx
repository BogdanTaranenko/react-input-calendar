import { useState, type FormEvent } from 'react';
import { DateTimePicker } from '@b.taranenko/react-input-calendar';

export default function Forms() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
  };

  return (
    <form className="demo-stack" onSubmit={onSubmit}>
      {/* Submits local `YYYY-MM-DDTHH:mm`, the same format as <input type="datetime-local">. */}
      <DateTimePicker label="Pickup" name="pickup" required />
      <button type="submit" className="demo-button">
        Submit
      </button>
      {submitted && <p className="demo-output">Submitted: {submitted}</p>}
    </form>
  );
}
