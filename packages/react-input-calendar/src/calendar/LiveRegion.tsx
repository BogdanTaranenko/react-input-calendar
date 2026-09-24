import type { CSSProperties } from 'react';
import type { SlotAttributes, SlotName } from '../core/slots';

// Inline, so the region stays hidden when the stylesheet is not imported (AC-4f).
const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};

export interface LiveRegionProps {
  message: string;
  slot: (name: SlotName) => SlotAttributes;
}

/** A polite live region; changing `message` makes screen readers announce it. */
export function LiveRegion({ message, slot }: LiveRegionProps) {
  const { className, style } = slot('liveRegion');
  return (
    <div className={className} style={{ ...visuallyHidden, ...style }} aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
