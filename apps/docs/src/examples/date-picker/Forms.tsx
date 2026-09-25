import { useState, type FormEvent } from 'react';
import { DatePicker } from '@b.taranenko/react-input-calendar';

export default function Forms() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitted(JSON.stringify(Object.fromEntries(data)));
  };

  return (
    <form className="demo-stack" onSubmit={onSubmit}>
      {/* Submits `YYYY-MM-DD` through a hidden input. Empty + required blocks the submit. */}
      <DatePicker label="Birthday" name="birthday" required />
      <button type="submit" className="demo-button">
        Submit
      </button>
      {submitted && <p className="demo-output">Submitted: {submitted}</p>}
    </form>
  );
}
