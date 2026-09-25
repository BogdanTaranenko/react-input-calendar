import { useState, type FormEvent } from 'react';
import { MultiDatePicker } from '@b.taranenko/react-input-calendar';

export default function Forms() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // One `days` field per picked day, so read them with getAll.
    setSubmitted(JSON.stringify(new FormData(event.currentTarget).getAll('days')));
  };

  return (
    <form className="demo-stack" onSubmit={onSubmit}>
      <MultiDatePicker label="Days off" name="days" required />
      <button type="submit" className="demo-button">
        Submit
      </button>
      {submitted && <p className="demo-output">Submitted: {submitted}</p>}
    </form>
  );
}
