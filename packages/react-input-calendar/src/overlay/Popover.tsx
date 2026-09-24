import { useRef, type ReactNode, type RefObject } from 'react';
import { useSlots, type SlotProps } from '../core/slots';
import { useIsClient } from '../core/use-is-client';
import type { TextDirection } from '../i18n/locale-info';
import type { Placement } from './compute-position';
import { useModalDialog, type CloseReason } from './use-modal-dialog';
import { usePosition } from './use-position';

export type { CloseReason } from './use-modal-dialog';

export interface PopoverProps extends SlotProps {
  open: boolean;
  onClose: (reason: CloseReason) => void;
  /** The trigger: the popover is placed next to it and focus returns to it on close. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Default `'bottom-start'`. */
  placement?: Placement | undefined;
  /** Mirrors start/end alignment. Default `'ltr'`. */
  dir?: TextDirection | undefined;
  /** Id of the element naming the dialog; wins over `label`. */
  labelledBy?: string | undefined;
  label?: string | undefined;
  initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  children: ReactNode;
}

/**
 * A floating modal `<dialog>` next to its anchor. It renders in place (no portal) and opens
 * with `showModal()`, so it sits in the top layer yet inherits theming from every ancestor.
 * Nothing renders while closed or on the server; closing unmounts it at once.
 */
export function Popover(props: PopoverProps) {
  const { anchorRef, labelledBy } = props;
  const isClient = useIsClient();
  const open = props.open && isClient;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const slot = useSlots(props);

  // Order matters: the dialog must be shown (in the top layer, measurable) before placing it.
  const handlers = useModalDialog(dialogRef, {
    open,
    onClose: props.onClose,
    returnFocusRef: anchorRef,
    initialFocusRef: props.initialFocusRef,
    surfaceRef: dialogRef,
  });
  usePosition(anchorRef, dialogRef, {
    open,
    placement: props.placement ?? 'bottom-start',
    dir: props.dir ?? 'ltr',
  });

  if (!open) return null;
  return (
    <dialog
      ref={dialogRef}
      {...slot('popover', 'ric-surface')}
      {...handlers}
      tabIndex={-1}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : props.label}
      data-state="open"
    >
      {props.children}
    </dialog>
  );
}
