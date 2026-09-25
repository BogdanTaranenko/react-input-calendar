import { useState } from 'react';
import { MultiDatePicker } from '@b.taranenko/react-input-calendar';

export default function ControlledOpen() {
  const [open, setOpen] = useState(false);

  return (
    <div className="demo-stack">
      <MultiDatePicker label="Controlled open" open={open} onOpenChange={setOpen} />
      <p className="demo-output">open: {String(open)}</p>
    </div>
  );
}
