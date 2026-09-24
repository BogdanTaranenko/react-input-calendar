import { useLayoutEffect, type RefObject } from 'react';
import type { TextDirection } from '../i18n/locale-info';
import { computePosition, type Placement } from './compute-position';

export interface PositionOptions {
  open: boolean;
  placement: Placement;
  dir: TextDirection;
}

/** jsdom and some embedded views report a zero client size; fall back to the window. */
function getViewport() {
  const root = document.documentElement;
  return {
    width: root.clientWidth || window.innerWidth,
    height: root.clientHeight || window.innerHeight,
  };
}

/**
 * Keeps `floatingRef` next to `anchorRef` while open. Styles are written inline and directly to
 * the element, with no React re-render: they must work without the stylesheet (otherwise the
 * browser centres a modal dialog). The first placement is synchronous so the dialog never
 * shows centred for a frame; later ones (resize, any scroll, either element resizing) wait
 * for the next animation frame.
 */
export function usePosition(
  anchorRef: RefObject<HTMLElement | null>,
  floatingRef: RefObject<HTMLElement | null>,
  { open, placement, dir }: PositionOptions,
): void {
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const floating = floatingRef.current;
    if (!open || !anchor || !floating) return;

    const update = () => {
      const position = computePosition({
        anchor: anchor.getBoundingClientRect(),
        floating: floating.getBoundingClientRect(),
        viewport: getViewport(),
        placement,
        dir,
      });
      floating.style.position = 'fixed';
      floating.style.margin = '0';
      floating.style.inset = 'auto';
      floating.style.left = `${String(position.x)}px`;
      floating.style.top = `${String(position.y)}px`;
      floating.dataset.placement = position.placement;
    };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    observer?.observe(anchor);
    observer?.observe(floating);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, { capture: true });
      observer?.disconnect();
    };
  }, [open, placement, dir, anchorRef, floatingRef]);
}
