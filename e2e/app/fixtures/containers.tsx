import { useEffect, useRef, useState, type FormEvent } from 'react';
import { DatePicker } from '@b.taranenko/react-input-calendar';

/** A short scroll container docked to the bottom of the viewport. */
export function ScrollFixture() {
  return (
    <div
      data-testid="scroller"
      style={{
        position: 'fixed',
        insetInline: 24,
        bottom: 0,
        height: 160,
        overflow: 'auto',
        border: '1px solid GrayText',
      }}
    >
      <div style={{ padding: 16, paddingBlockEnd: 600 }}>
        <DatePicker label="Near the bottom" />
      </div>
    </div>
  );
}

/** The picker inside a consumer's own modal dialog. */
export function InDialogFixture() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog ref={dialogRef} aria-label="Booking">
      <DatePicker label="Inside a dialog" />
    </dialog>
  );
}

export function FormFixture() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(String(new FormData(event.currentTarget).get('date')));
  };
  return (
    <form className="stack" onSubmit={onSubmit}>
      <DatePicker label="Required date" name="date" required />
      <button type="submit">Submit</button>
      {submitted !== null && <output>Submitted {submitted}</output>}
    </form>
  );
}
