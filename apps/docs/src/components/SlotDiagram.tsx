import { useState } from 'react';
import { Calendar, DateTimePicker, type SlotName } from '@b.taranenko/react-input-calendar';
import { slotClass, slotDocs } from '../theming/slot-docs';
import { InlineText } from './InlineText';

const slots = Object.keys(slotDocs) as SlotName[];

/** Pick a slot to outline every element that carries its class. */
export function SlotDiagram() {
  const [active, setActive] = useState<SlotName>('trigger');

  return (
    <div className="slot-diagram">
      <style>{`.slot-demo .${slotClass(active)} { outline: 2px solid var(--highlight); outline-offset: 2px; }`}</style>
      <div className="slot-list" role="group" aria-label="Slots">
        {slots.map((slot) => (
          <button
            key={slot}
            type="button"
            aria-pressed={active === slot}
            onClick={() => {
              setActive(slot);
            }}
          >
            {slot}
          </button>
        ))}
      </div>
      <p className="slot-detail">
        <code>{active}</code> → <code>.{slotClass(active)}</code>:{' '}
        <InlineText text={slotDocs[active]} /> Open the picker to see the popup slots.
      </p>
      <div className="slot-demo example-preview">
        <DateTimePicker label="Pick a time" description="Helper text" defaultValue={new Date()} />
        <Calendar />
      </div>
    </div>
  );
}
