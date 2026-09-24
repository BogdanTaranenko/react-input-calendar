import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSwipe, type SwipeOptions } from './use-swipe';

function Target(props: SwipeOptions) {
  const ref = useRef<HTMLDivElement>(null);
  useSwipe(ref, props);
  return <div ref={ref} data-testid="target" />;
}

const target = () => screen.getByTestId('target');
const primary = { pointerId: 1, isPrimary: true, button: 0 };

/** Presses at (0, 0), moves to (dx, dy), and lifts there. */
function swipe(dx: number, dy: number, element: Element = target()) {
  fireEvent.pointerDown(element, { ...primary, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(element, { ...primary, clientX: 100 + dx, clientY: 100 + dy });
  fireEvent.pointerUp(element, { ...primary, clientX: 100 + dx, clientY: 100 + dy });
}

function setup(threshold?: number) {
  const handlers = {
    onSwipeLeft: vi.fn<() => void>(),
    onSwipeRight: vi.fn<() => void>(),
    onDrag: vi.fn<(dy: number) => void>(),
    onDragEnd: vi.fn<(dy: number) => void>(),
  };
  const view = render(<Target {...handlers} threshold={threshold} />);
  return { ...handlers, ...view };
}

describe('useSwipe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fires onSwipeLeft for a leftward swipe beyond the threshold', () => {
    const { onSwipeLeft, onSwipeRight } = setup();
    swipe(-60, 10);
    expect(onSwipeLeft).toHaveBeenCalledOnce();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('fires onSwipeRight for a rightward swipe beyond the threshold', () => {
    const { onSwipeLeft, onSwipeRight } = setup();
    swipe(60, -10);
    expect(onSwipeRight).toHaveBeenCalledOnce();
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('ignores a mostly vertical move, even a long one', () => {
    const { onSwipeLeft, onSwipeRight } = setup();
    swipe(-60, 61);
    swipe(60, -61);
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('ignores a horizontal move up to the threshold', () => {
    const { onSwipeLeft, onSwipeRight } = setup(30);
    swipe(-30, 0);
    swipe(30, 0);
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();

    swipe(-31, 0);
    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it('reports vertical movement live, then the final offset on release', () => {
    const { onDrag, onDragEnd } = setup();
    fireEvent.pointerDown(target(), { ...primary, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(target(), { ...primary, clientX: 105, clientY: 130 });
    fireEvent.pointerMove(target(), { ...primary, clientX: 102, clientY: 90 });
    expect(onDrag.mock.calls).toEqual([[30], [-10]]);
    expect(onDragEnd).not.toHaveBeenCalled();

    fireEvent.pointerUp(target(), { ...primary, clientX: 102, clientY: 180 });
    expect(onDragEnd).toHaveBeenCalledExactlyOnceWith(80);
  });

  it('ends the gesture when the pointer is released outside the element', () => {
    const { onSwipeLeft, onDragEnd } = setup();
    fireEvent.pointerDown(target(), { ...primary, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(document.body, { ...primary, clientX: 20, clientY: 110 });
    fireEvent.pointerUp(document.body, { ...primary, clientX: 20, clientY: 110 });
    expect(onSwipeLeft).toHaveBeenCalledOnce();
    expect(onDragEnd).toHaveBeenCalledExactlyOnceWith(10);
  });

  it('snaps back without a swipe when the browser cancels the gesture', () => {
    const { onSwipeLeft, onDrag, onDragEnd } = setup();
    fireEvent.pointerDown(target(), { ...primary, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(target(), { ...primary, clientX: 20, clientY: 140 });
    fireEvent.pointerCancel(target(), primary);
    expect(onDrag).toHaveBeenLastCalledWith(0);

    fireEvent.pointerUp(target(), { ...primary, clientX: 20, clientY: 140 });
    fireEvent.pointerMove(target(), { ...primary, clientX: 20, clientY: 160 });
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();
    expect(onDrag).toHaveBeenCalledTimes(2);
  });

  it('follows only a primary press, and only that pointer', () => {
    const { onSwipeLeft, onDrag } = setup();
    // A right-click, and a second finger, start nothing.
    swipe(-60, 0);
    onSwipeLeft.mockClear();
    fireEvent.pointerDown(target(), { ...primary, button: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(target(), { ...primary, button: 2, clientX: 20, clientY: 100 });
    fireEvent.pointerDown(target(), { ...primary, isPrimary: false, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(target(), { ...primary, isPrimary: false, clientX: 20, clientY: 100 });
    expect(onSwipeLeft).not.toHaveBeenCalled();

    // Another pointer's moves and release do not touch the tracked gesture.
    onDrag.mockClear();
    fireEvent.pointerDown(target(), { ...primary, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(target(), { ...primary, pointerId: 2, clientX: 100, clientY: 150 });
    fireEvent.pointerUp(target(), { ...primary, pointerId: 2, clientX: 20, clientY: 100 });
    expect(onDrag).not.toHaveBeenCalled();
    expect(onSwipeLeft).not.toHaveBeenCalled();
    fireEvent.pointerCancel(target(), { ...primary, pointerId: 2 });
    fireEvent.pointerUp(target(), { ...primary, clientX: 20, clientY: 100 });
    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it('restarts from a new primary press when the previous release never arrived', () => {
    const { onSwipeLeft } = setup();
    fireEvent.pointerDown(target(), { ...primary, pointerId: 7, clientX: 100, clientY: 100 });
    // Pointer 7's release was lost; a fresh touch has a new id.
    swipe(-60, 0);
    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it('uses the latest callbacks without re-subscribing', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Target onSwipeLeft={first} />);
    rerender(<Target onSwipeLeft={second} />);
    swipe(-60, 0);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('does nothing while disabled, and attaches once enabled', () => {
    const onSwipeLeft = vi.fn();
    function Toggle({ enabled }: { enabled: boolean }) {
      const ref = useRef<HTMLDivElement>(null);
      useSwipe(ref, { enabled, onSwipeLeft });
      // Mounted only while enabled, like the sheet's handle.
      return enabled ? <div ref={ref} data-testid="target" /> : <div data-testid="target" />;
    }
    const { rerender } = render(<Toggle enabled={false} />);
    swipe(-60, 0);
    expect(onSwipeLeft).not.toHaveBeenCalled();

    rerender(<Toggle enabled />);
    swipe(-60, 0);
    expect(onSwipeLeft).toHaveBeenCalledOnce();

    rerender(<Toggle enabled={false} />);
    swipe(-60, 0);
    expect(onSwipeLeft).toHaveBeenCalledOnce();
  });

  it('removes its listeners on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = setup();
    fireEvent.pointerDown(target(), { ...primary, clientX: 100, clientY: 100 });
    unmount();
    const added = add.mock.calls.map(([type, listener]) => [type, listener]);
    const removed = remove.mock.calls.map(([type, listener]) => [type, listener]);
    expect(added.length).toBeGreaterThan(0);
    expect(removed).toEqual(expect.arrayContaining(added));
  });
});
