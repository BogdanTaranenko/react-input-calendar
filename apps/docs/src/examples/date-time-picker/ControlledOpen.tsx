import { useState } from 'react';
import { DateTimePicker } from '@b.taranenko/react-input-calendar';

export default function ControlledOpen() {
  const [open, setOpen] = useState(false);

  return (
    <div className="demo-stack">
      <DateTimePicker
        label="Controlled open"
        open={open}
        onOpenChange={setOpen}
        placement="top-start"
      />
      <p className="demo-output">open: {String(open)}</p>
    </div>
  );
}
