import { useState } from 'react';
import { DateRangePicker } from '@b.taranenko/react-input-calendar';

export default function ControlledOpen() {
  const [open, setOpen] = useState(false);

  return (
    <div className="demo-stack">
      <DateRangePicker
        label="Controlled open"
        open={open}
        onOpenChange={setOpen}
        placement="bottom-end"
      />
      <p className="demo-output">open: {String(open)}</p>
    </div>
  );
}
