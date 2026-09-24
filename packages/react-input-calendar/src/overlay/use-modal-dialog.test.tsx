import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useModalDialog, type CloseReason } from './use-modal-dialog';

interface DialogProps {
  onClose?: (reason: CloseReason) => void;
  focusDecoy?: boolean;
  children: ReactNode;
}

/** The hook on a bare dialog, as the popover and the bottom sheet use it. */
function Dialog({ onClose = vi.fn(), focusDecoy = false, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const decoyRef = useRef<HTMLDivElement>(null);
  const handlers = useModalDialog(ref, {
    open: true,
    onClose,
    initialFocusRef: focusDecoy ? decoyRef : undefined,
  });
  return (
    <dialog ref={ref} {...handlers} tabIndex={-1}>
      <div ref={decoyRef}>Not focusable</div>
      {children}
    </dialog>
  );
}

const button = (name: string) => screen.getByRole('button', { name });
const dialog = () => document.querySelector('dialog') as HTMLDialogElement;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useModalDialog — what counts as tabbable', () => {
  const unreachable: Record<string, (edge: string) => ReactNode> = {
    'hidden attribute': (edge) => (
      <button type="button" hidden>
        {edge}
      </button>
    ),
    'inert ancestor': (edge) => (
      <div inert>
        <button type="button">{edge}</button>
      </div>
    ),
    'disabled fieldset': (edge) => (
      <fieldset disabled>
        <input aria-label={edge} />
      </fieldset>
    ),
    'display: none ancestor': (edge) => (
      <div style={{ display: 'none' }}>
        <button type="button">{edge}</button>
      </div>
    ),
    'visibility: hidden': (edge) => (
      <button type="button" style={{ visibility: 'hidden' }}>
        {edge}
      </button>
    ),
    'disabled attribute': (edge) => (
      <button type="button" disabled>
        {edge}
      </button>
    ),
  };

  it.each(Object.keys(unreachable))(
    'skips a control made unreachable by %s, at either end, for initial focus and Tab wrapping',
    async (kind) => {
      const control = unreachable[kind] ?? (() => null);
      const user = userEvent.setup();
      render(
        <Dialog>
          {control('Before')}
          <button type="button">First</button>
          <button type="button">Last</button>
          {control('After')}
        </Dialog>,
      );
      expect(button('First')).toHaveFocus();
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(button('Last')).toHaveFocus();
      await user.tab();
      expect(button('First')).toHaveFocus();
    },
  );

  it('falls back to the first tabbable element when initialFocusRef cannot take focus', () => {
    render(
      <Dialog focusDecoy>
        <button type="button">First</button>
      </Dialog>,
    );
    expect(button('First')).toHaveFocus();
  });
});

describe('useModalDialog — backdrop presses', () => {
  function outsidePress(init: PointerEventInit) {
    vi.spyOn(dialog(), 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 300, 300));
    fireEvent.pointerDown(dialog(), { clientX: 10, clientY: 10, ...init });
  }

  it('closes on a primary-button press from the primary pointer only', () => {
    const onClose = vi.fn();
    render(
      <Dialog onClose={onClose}>
        <button type="button">Inside</button>
      </Dialog>,
    );
    outsidePress({ button: 2, isPrimary: true });
    outsidePress({ button: 0, isPrimary: false });
    expect(onClose).not.toHaveBeenCalled();
    outsidePress({ button: 0, isPrimary: true });
    expect(onClose).toHaveBeenCalledExactlyOnceWith('outside');
  });
});
