import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  type SyntheticEvent,
} from 'react';

export type CloseReason = 'escape' | 'outside' | 'select' | 'done';

export interface ModalDialogOptions {
  open: boolean;
  onClose: (reason: CloseReason) => void;
  /** Focused again after closing (the trigger). */
  returnFocusRef?: RefObject<HTMLElement | null> | undefined;
  /** Focused on open (the grid's tabbable day); else the first tabbable element. */
  initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  /** The visible panel. A press on the dialog outside it is a backdrop press. */
  surfaceRef?: RefObject<HTMLElement | null> | undefined;
}

/** Spread on the `<dialog>`. React handlers, not native listeners: see `useModalDialog`. */
export interface ModalDialogHandlers {
  onKeyDown: (event: KeyboardEvent<HTMLDialogElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLDialogElement>) => void;
  onCancel: (event: SyntheticEvent<HTMLDialogElement>) => void;
  onClose: (event: SyntheticEvent<HTMLDialogElement>) => void;
}

const TABBABLE =
  'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]';

/**
 * Whether Tab can reach `element`: `tabIndex` alone is not enough, since it ignores `inert`,
 * `display: none` (which also covers the `hidden` attribute), `visibility: hidden` and a
 * disabled ancestor `<fieldset>`. Styles are
 * read instead of layout (`getClientRects`), which jsdom cannot provide. Radio groups and
 * `contenteditable` are not handled: the dialogs only ever hold this library's own controls.
 */
function isTabbable(element: HTMLElement, root: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.matches(':disabled')) return false;
  if (element.closest('[inert]')) return false;
  if (getComputedStyle(element).visibility === 'hidden') return false;
  for (let node: HTMLElement | null = element; node && node !== root; node = node.parentElement) {
    if (getComputedStyle(node).display === 'none') return false;
  }
  return true;
}

function getTabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((element) =>
    isTabbable(element, root),
  );
}

function isOutside(event: PointerEvent, rect: DOMRect): boolean {
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

/**
 * APG modal dialog behaviour on a native `<dialog>` opened with `showModal()`, shared by the
 * popover and the bottom sheet.
 *
 * Keys and presses are handled through the returned React props rather than native listeners
 * on the dialog: React dispatches from its root, an ancestor of the in-place dialog, so a
 * native listener would run before a child's React handler could mark Escape as handled
 * (the calendar does, to leave its month and year views).
 */
export function useModalDialog(
  dialogRef: RefObject<HTMLDialogElement | null>,
  options: ModalDialogOptions,
): ModalDialogHandlers {
  const { open, onClose, returnFocusRef, initialFocusRef, surfaceRef } = options;
  // True while React wants the dialog open, so a close the browser forces can be told apart
  // from our own `dialog.close()`.
  const wantsOpen = useRef(false);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.showModal();
    wantsOpen.current = true;
    const returnTo = returnFocusRef?.current;
    // Fall back when the requested element cannot actually take focus.
    const requested = initialFocusRef?.current;
    requested?.focus();
    if (!requested || document.activeElement !== requested) {
      (getTabbables(dialog)[0] ?? dialog).focus();
    }

    return () => {
      wantsOpen.current = false;
      if (dialog.open) dialog.close();
      // Keep focus that already moved elsewhere on purpose; otherwise go back to the trigger.
      const active = document.activeElement;
      const movedAway = active !== null && active !== document.body && !dialog.contains(active);
      if (!movedAway) returnTo?.focus();
    };
  }, [open, dialogRef, initialFocusRef, returnFocusRef]);

  const wrapTab = (event: KeyboardEvent<HTMLDialogElement>) => {
    const tabbables = getTabbables(event.currentTarget);
    const first = tabbables[0];
    const last = tabbables[tabbables.length - 1];
    const active = document.activeElement;
    if (!first || !last) {
      event.preventDefault();
    } else if (event.shiftKey && (active === first || active === event.currentTarget)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return {
    onKeyDown: (event) => {
      if (event.key === 'Escape') {
        if (event.defaultPrevented) return;
        event.preventDefault();
        onClose('escape');
      } else if (event.key === 'Tab') {
        wrapTab(event);
      }
    },
    // Only a primary press dismisses: not a right-click, nor a second finger in a gesture.
    onPointerDown: (event) => {
      if (event.target !== event.currentTarget || event.button !== 0 || !event.isPrimary) return;
      const surface = surfaceRef?.current ?? event.currentTarget;
      if (isOutside(event, surface.getBoundingClientRect())) onClose('outside');
    },
    // Escape is ours to handle; never let the browser close the dialog behind React's back.
    onCancel: (event) => {
      event.preventDefault();
    },
    // Browsers fire `close` in a later task. By then the dialog may be open again (StrictMode
    // re-runs the open effect right after its cleanup closed it): only a close that left the
    // dialog shut while React still wants it open was forced by the browser.
    onClose: (event) => {
      if (!wantsOpen.current || event.currentTarget.open) return;
      wantsOpen.current = false;
      onClose('escape');
    },
  };
}
