import { useLayoutEffect } from 'react';

/**
 * Stops the page scrolling while `active`, padding the root by the scrollbar's width so the
 * page does not shift sideways. Restores the previous inline styles on release. Only one sheet
 * can be open at a time (it is modal), so there is no reference counting.
 */
export function useScrollLock(active: boolean): void {
  useLayoutEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const { overflow, paddingRight } = root.style;
    // jsdom and some embedded views report a zero client width: no scrollbar to account for.
    const scrollbar = root.clientWidth > 0 ? window.innerWidth - root.clientWidth : 0;
    root.style.overflow = 'hidden';
    if (scrollbar > 0) root.style.paddingRight = `${String(scrollbar)}px`;

    return () => {
      root.style.overflow = overflow;
      root.style.paddingRight = paddingRight;
    };
  }, [active]);
}
