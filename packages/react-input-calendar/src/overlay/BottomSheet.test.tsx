import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BottomSheet, type BottomSheetProps } from './BottomSheet';
import type { CloseReason } from './use-modal-dialog';

type HarnessProps = Partial<Omit<BottomSheetProps, 'anchorRef' | 'open' | 'children'>> & {
  initiallyOpen?: boolean;
};

/** A trigger plus a sheet that closes itself whenever it asks to, like the pickers will. */
function Harness({ initiallyOpen = true, ...props }: HarnessProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Trigger
      </button>
      <BottomSheet
        label="Choose date"
        {...props}
        open={open}
        anchorRef={anchorRef}
        onClose={(reason: CloseReason) => {
          props.onClose?.(reason);
          setOpen(false);
        }}
      >
        <button type="button">Inside</button>
      </BottomSheet>
    </>
  );
}

const dialog = () => document.querySelector('dialog') as HTMLDialogElement;
const panel = () => document.querySelector('.ric-sheet') as HTMLElement;
const handle = () => document.querySelector('.ric-sheet-handle') as HTMLElement;
const trigger = () => screen.getByRole('button', { name: 'Trigger' });
const primary = { pointerId: 1, isPrimary: true, button: 0 };

/** The panel spans the bottom 400px of an 800px-tall viewport. */
function mockPanelRect() {
  vi.spyOn(panel(), 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 400,
    width: 360,
    height: 400,
    right: 360,
    bottom: 800,
    x: 0,
    y: 400,
    toJSON: () => ({}),
  });
}

function drag(dy: number) {
  fireEvent.pointerDown(handle(), { ...primary, clientX: 180, clientY: 410 });
  fireEvent.pointerMove(handle(), { ...primary, clientX: 180, clientY: 410 + dy });
}

function release(dy: number) {
  fireEvent.pointerUp(handle(), { ...primary, clientX: 180, clientY: 410 + dy });
}

describe('BottomSheet', () => {
  const root = document.documentElement;

  beforeEach(() => {
    // jsdom reports a zero client width; pretend a 15px scrollbar.
    vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(window.innerWidth - 15);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    root.removeAttribute('style');
  });

  it('renders nothing when closed, or during server render', () => {
    render(<Harness initiallyOpen={false} />);
    expect(dialog()).toBeNull();
    expect(renderToString(<Harness />)).not.toContain('<dialog');
  });

  it('opens a modal backdrop dialog holding the panel, the handle and the children', () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    render(<Harness classNames={{ backdrop: 'b', sheet: 's', sheetHandle: 'h' }} />);

    expect(showModal).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBe(dialog());
    expect(dialog()).toHaveClass('ric-backdrop', 'b');
    expect(dialog()).toHaveAttribute('aria-modal', 'true');
    expect(panel()).toHaveClass('ric-surface', 's');
    expect(panel().parentElement).toBe(dialog());
    expect(handle()).toHaveClass('h');
    expect(handle()).toHaveAttribute('aria-hidden', 'true');
    expect(handle().parentElement).toBe(panel());
    expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus();
  });

  it('prefers labelledBy over label', () => {
    render(<Harness labelledBy="heading" />);
    expect(dialog()).toHaveAttribute('aria-labelledby', 'heading');
    expect(dialog()).not.toHaveAttribute('aria-label');
  });

  it('locks page scroll while open and restores the previous inline styles on close', async () => {
    root.style.overflow = 'clip';
    root.style.paddingRight = '3px';
    render(<Harness />);
    expect(root.style.overflow).toBe('hidden');
    expect(root.style.paddingRight).toBe('15px');

    await userEvent.keyboard('{Escape}');
    expect(dialog()).toBeNull();
    expect(root.style.overflow).toBe('clip');
    expect(root.style.paddingRight).toBe('3px');
  });

  it('leaves the padding alone where the client width is unknown', () => {
    vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(0);
    render(<Harness />);
    expect(root.style.overflow).toBe('hidden');
    expect(root.style.paddingRight).toBe('');
  });

  it('leaves the padding alone when there is no scrollbar to replace', () => {
    vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(window.innerWidth);
    root.style.paddingRight = '3px';
    render(<Harness />);
    expect(root.style.overflow).toBe('hidden');
    expect(root.style.paddingRight).toBe('3px');
  });

  it('closes on Escape and returns focus to the anchor', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape');
    expect(trigger()).toHaveFocus();
  });

  it('closes on a press on the backdrop outside the panel, but not on one over it', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    mockPanelRect();

    fireEvent.pointerDown(dialog(), { ...primary, clientX: 180, clientY: 500 });
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Inside' }), primary);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(dialog(), { ...primary, clientX: 180, clientY: 200 });
    expect(onClose).toHaveBeenCalledExactlyOnceWith('outside');
  });

  it('moves the panel with a downward drag on the handle, never above its resting place', () => {
    render(<Harness />);
    drag(50);
    expect(panel().style.transform).toBe('translateY(50px)');
    drag(-30);
    expect(panel().style.transform).toBe('');
  });

  it('snaps back when released within a quarter of the panel height', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    mockPanelRect();
    drag(100);
    release(100);
    expect(onClose).not.toHaveBeenCalled();
    expect(panel().style.transform).toBe('');
  });

  it('closes when dragged down beyond a quarter of the panel height', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    mockPanelRect();
    drag(101);
    release(101);
    expect(onClose).toHaveBeenCalledExactlyOnceWith('outside');
    expect(dialog()).toBeNull();
  });

  it('drags when opened after mounting closed', async () => {
    render(<Harness initiallyOpen={false} />);
    await userEvent.click(trigger());
    drag(50);
    expect(panel().style.transform).toBe('translateY(50px)');
  });

  it('only drags from the handle', () => {
    render(<Harness />);
    const inside = screen.getByRole('button', { name: 'Inside' });
    fireEvent.pointerDown(inside, { ...primary, clientX: 180, clientY: 410 });
    fireEvent.pointerMove(inside, { ...primary, clientX: 180, clientY: 500 });
    expect(panel().style.transform).toBe('');
  });
});
