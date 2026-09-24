import { useLayoutEffect, useRef, type RefObject } from 'react';

export interface SwipeOptions {
  /** A release that travelled more than `threshold` px left, and more across than down. */
  onSwipeLeft?: (() => void) | undefined;
  onSwipeRight?: (() => void) | undefined;
  /** Live vertical offset from the press; `0` when the browser cancels the gesture. */
  onDrag?: ((dy: number) => void) | undefined;
  /** Vertical offset at release. Not called for a cancelled gesture. */
  onDragEnd?: ((dy: number) => void) | undefined;
  /** Default 48. */
  threshold?: number | undefined;
  /** Default `true`. Listeners attach when this turns true, so the element may mount then. */
  enabled?: boolean | undefined;
}

/**
 * Pointer swipes and drags on `ref`, for a primary press only. Once pressed, move and release
 * are followed on `window`, so a release outside the element still ends the gesture. Pointer
 * capture would do the same but would also retarget the click after a tap, away from the day
 * button under the finger.
 */
export function useSwipe(ref: RefObject<HTMLElement | null>, options: SwipeOptions): void {
  const { enabled = true } = options;
  // The listeners stay attached while enabled; they read the latest callbacks from here.
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    let start: { x: number; y: number; pointerId: number } | null = null;

    // Every handler below ignores other pointers (a second finger, a stylus).
    const onMove = (event: PointerEvent) => {
      if (start?.pointerId !== event.pointerId) return;
      latest.current.onDrag?.(event.clientY - start.y);
    };

    const onUp = (event: PointerEvent) => {
      if (start?.pointerId !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      end();
      const { onSwipeLeft, onSwipeRight, onDragEnd, threshold = 48 } = latest.current;
      onDragEnd?.(dy);
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) <= threshold) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    };

    const onCancel = (event: PointerEvent) => {
      if (start?.pointerId !== event.pointerId) return;
      end();
      latest.current.onDrag?.(0);
    };

    const end = () => {
      start = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };

    // A second finger is not primary. A new primary press means the last release was lost
    // (the pointer left the window, say), so it starts over rather than staying stuck.
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      start = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    };

    element.addEventListener('pointerdown', onDown);
    return () => {
      element.removeEventListener('pointerdown', onDown);
      end();
    };
  }, [ref, enabled]);
}
