import type { TextDirection } from '../i18n/locale-info';

export type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

/** The parts of a `DOMRect` the maths needs, in viewport coordinates. */
export interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface PositionInput {
  anchor: Rect;
  floating: Size;
  viewport: Size;
  placement: Placement;
  dir: TextDirection;
  /** Gap between the anchor and the floating element. Default 8. */
  offset?: number;
  /** Minimum distance from the viewport edges. Default 8. */
  padding?: number;
}

export interface Position {
  x: number;
  y: number;
  /** The placement actually used, after any flip. */
  placement: Placement;
}

type Side = 'top' | 'bottom';

/**
 * Where to put a floating element next to its anchor. The side is flipped when the requested
 * one overflows and the other has more room; the cross axis shifts to keep `padding` from the
 * viewport edges. `-start`/`-end` follow the text direction.
 */
export function computePosition(input: PositionInput): Position {
  const { anchor, floating, viewport, dir, offset = 8, padding = 8 } = input;
  const requested: Side = input.placement.startsWith('top') ? 'top' : 'bottom';
  const align = input.placement.endsWith('end') ? 'end' : 'start';

  const fits: Record<Side, boolean> = {
    bottom: anchor.bottom + offset + floating.height + padding <= viewport.height,
    top: anchor.top - offset - floating.height - padding >= 0,
  };
  const room: Record<Side, number> = { bottom: viewport.height - anchor.bottom, top: anchor.top };
  const opposite: Side = requested === 'bottom' ? 'top' : 'bottom';
  const side = !fits[requested] && room[opposite] > room[requested] ? opposite : requested;

  const y = side === 'bottom' ? anchor.bottom + offset : anchor.top - offset - floating.height;

  // Start is the left edge in LTR and the right edge in RTL.
  const alignLeft = (align === 'start') === (dir === 'ltr');
  const preferredX = alignLeft ? anchor.left : anchor.right - floating.width;
  const maxX = viewport.width - floating.width - padding;
  const x = Math.max(padding, Math.min(preferredX, maxX));

  return { x, y, placement: `${side}-${align}` };
}
