import { useRef, type ReactNode, type RefObject } from 'react';
import { useSlots, type SlotProps } from '../core/slots';
import { useIsClient } from '../core/use-is-client';
import { useSwipe } from '../core/use-swipe';
import { useModalDialog, type CloseReason } from './use-modal-dialog';
import { useScrollLock } from './use-scroll-lock';

export interface BottomSheetProps extends SlotProps {
  open: boolean;
  onClose: (reason: CloseReason) => void;
  /** The trigger: focus returns to it on close. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Id of the element naming the dialog; wins over `label`. */
  labelledBy?: string | undefined;
  label?: string | undefined;
  initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  children: ReactNode;
}

/** A release further down than this share of the panel's height dismisses the sheet. */
const DISMISS_RATIO = 0.25;

/**
 * The mobile surface: a full-screen modal `<dialog>` acting as the backdrop, with the panel
 * docked to its bottom edge. Like `Popover` it renders in place, and nothing while closed or
 * on the server. Dragging the handle moves the panel through an inline transform, with no
 * React re-render per move.
 */
export function BottomSheet(props: BottomSheetProps) {
  const { labelledBy } = props;
  const isClient = useIsClient();
  const open = props.open && isClient;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const slot = useSlots(props);

  const handlers = useModalDialog(dialogRef, {
    open,
    onClose: props.onClose,
    returnFocusRef: props.anchorRef,
    initialFocusRef: props.initialFocusRef,
    surfaceRef: panelRef,
  });
  useScrollLock(open);

  const moveTo = (dy: number) => {
    const panel = panelRef.current;
    if (panel) panel.style.transform = dy > 0 ? `translateY(${String(dy)}px)` : '';
  };
  useSwipe(handleRef, {
    enabled: open,
    onDrag: moveTo,
    onDragEnd: (dy) => {
      const height = panelRef.current?.getBoundingClientRect().height ?? 0;
      if (dy > height * DISMISS_RATIO) props.onClose('outside');
      else moveTo(0);
    },
  });

  if (!open) return null;
  return (
    <dialog
      ref={dialogRef}
      {...slot('backdrop')}
      {...handlers}
      tabIndex={-1}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : props.label}
      data-state="open"
    >
      <div ref={panelRef} {...slot('sheet', 'ric-surface')}>
        <div ref={handleRef} {...slot('sheetHandle')} aria-hidden="true" />
        {props.children}
      </div>
    </dialog>
  );
}
