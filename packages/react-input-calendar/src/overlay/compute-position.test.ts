import { describe, expect, it } from 'vitest';
import { computePosition, type Rect } from './compute-position';

const rect = (left: number, top: number, width: number, height: number): Rect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const viewport = { width: 1000, height: 800 };
const floating = { width: 300, height: 350 };

describe('computePosition — side', () => {
  it('places the floating element below the anchor, start-aligned, when it fits', () => {
    const anchor = rect(100, 100, 200, 40);
    expect(computePosition({ anchor, floating, viewport, placement: 'bottom-start', dir: 'ltr' })).toEqual(
      { x: 100, y: 148, placement: 'bottom-start' },
    );
  });

  it('flips to the top near the bottom edge when the top has more room', () => {
    const anchor = rect(100, 600, 200, 40);
    expect(computePosition({ anchor, floating, viewport, placement: 'bottom-start', dir: 'ltr' })).toEqual(
      { x: 100, y: 242, placement: 'top-start' },
    );
  });

  it('stays at the bottom when neither side fits but the bottom has more room', () => {
    const anchor = rect(100, 200, 200, 40);
    const short = { width: 1000, height: 500 };
    expect(
      computePosition({ anchor, floating, viewport: short, placement: 'bottom-start', dir: 'ltr' }),
    ).toEqual({ x: 100, y: 248, placement: 'bottom-start' });
  });

  it('keeps a top placement that fits, and flips a top placement that does not', () => {
    const low = rect(100, 600, 200, 40);
    expect(computePosition({ anchor: low, floating, viewport, placement: 'top-end', dir: 'ltr' })).toEqual({
      x: 8,
      y: 242,
      placement: 'top-end',
    });
    const high = rect(100, 50, 200, 40);
    expect(computePosition({ anchor: high, floating, viewport, placement: 'top-start', dir: 'ltr' })).toEqual(
      { x: 100, y: 98, placement: 'bottom-start' },
    );
  });

  it('counts the offset and padding when deciding whether a side fits', () => {
    // Below needs 420 + 8 + 350 + 8 = 786 px; one pixel less and the roomier top wins.
    const anchor = rect(100, 380, 200, 40);
    const place = (height: number, extra: { offset?: number; padding?: number } = {}) =>
      computePosition({
        anchor,
        floating,
        viewport: { width: 1000, height },
        placement: 'bottom-start',
        dir: 'ltr',
        ...extra,
      });
    expect(place(786)).toEqual({ x: 100, y: 428, placement: 'bottom-start' });
    expect(place(785)).toEqual({ x: 100, y: 22, placement: 'top-start' });
    expect(place(785, { padding: 0 })).toEqual({ x: 100, y: 428, placement: 'bottom-start' });
    expect(place(786, { offset: 20 })).toEqual({ x: 100, y: 10, placement: 'top-start' });
  });
});

describe('computePosition — alignment and shift', () => {
  it('aligns the end edges for bottom-end', () => {
    const anchor = rect(400, 100, 200, 40);
    expect(computePosition({ anchor, floating, viewport, placement: 'bottom-end', dir: 'ltr' }).x).toBe(300);
  });

  it('shifts left near the right edge and right near the left edge, keeping the padding', () => {
    expect(
      computePosition({ anchor: rect(850, 100, 100, 40), floating, viewport, placement: 'bottom-start', dir: 'ltr' })
        .x,
    ).toBe(692);
    expect(
      computePosition({ anchor: rect(20, 100, 100, 40), floating, viewport, placement: 'bottom-end', dir: 'ltr' }).x,
    ).toBe(8);
  });

  it('pins a floating element wider than the viewport to the start padding', () => {
    const wide = { width: 1200, height: 100 };
    expect(
      computePosition({ anchor: rect(100, 100, 200, 40), floating: wide, viewport, placement: 'bottom-end', dir: 'ltr' })
        .x,
    ).toBe(8);
  });

  it('mirrors start and end in RTL', () => {
    const anchor = rect(400, 100, 200, 40);
    expect(computePosition({ anchor, floating, viewport, placement: 'bottom-start', dir: 'rtl' }).x).toBe(300);
    expect(computePosition({ anchor, floating, viewport, placement: 'bottom-end', dir: 'rtl' }).x).toBe(400);
  });
});
