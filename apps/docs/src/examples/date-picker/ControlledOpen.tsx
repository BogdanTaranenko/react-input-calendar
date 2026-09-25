import { useState } from 'react';
import { DatePicker } from '@b.taranenko/react-input-calendar';

export default function ControlledOpen() {
  const [open, setOpen] = useState(false);

  return (
    <div className="demo-stack">
      <button
        type="button"
        className="demo-button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open from outside
      </button>
      <DatePicker
        label="Controlled open"
        open={open}
        onOpenChange={setOpen}
        placement="top-start"
        // Keep the popover even on phones; the default switches to a bottom sheet below 640px.
        mobileBreakpoint={false}
      />
      <p className="demo-output">open: {String(open)}</p>
    </div>
  );
}
