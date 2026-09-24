import { useState } from 'react';
import { useCalendarConfig } from '../core/config-context';
import { useIsClient } from '../core/use-is-client';
import { useMediaQuery } from '../core/use-media-query';
import { BottomSheet, type BottomSheetProps } from './BottomSheet';
import { Popover, type PopoverProps } from './Popover';
import { SurfaceContext } from './surface-context';

export interface PickerSurfaceProps extends PopoverProps, BottomSheetProps {
  /** Below this viewport width the picker opens as a bottom sheet. Default 640; `false` never. */
  mobileBreakpoint?: number | false | undefined;
}

const DEFAULT_MOBILE_BREAKPOINT = 640;
// Stable context values, so consumers do not re-render just because the surface did.
const IN_SHEET = { isSheet: true };
const IN_POPOVER = { isSheet: false };

/** A bottom sheet on narrow viewports and a popover otherwise, with the same props. */
export function PickerSurface({ mobileBreakpoint, children, ...props }: PickerSurfaceProps) {
  const config = useCalendarConfig();
  const breakpoint = mobileBreakpoint ?? config.mobileBreakpoint ?? DEFAULT_MOBILE_BREAKPOINT;
  // The hook runs on every render; with no breakpoint its answer is ignored.
  const query = `(max-width: ${String(breakpoint === false ? 0 : breakpoint - 0.02)}px)`;
  const matches = useMediaQuery(query);
  const fitsSheet = breakpoint !== false && matches;

  // The surface is chosen when the picker opens and kept until it closes: swapping it live
  // (a rotated tablet) would close one dialog and open another, bouncing focus. Only after
  // hydration, when the media query holds the real answer. State adjusted during render.
  const isClient = useIsClient();
  const locking = props.open && isClient;
  const [locked, setLocked] = useState<boolean | null>(null);
  if (locking && locked === null) setLocked(fitsSheet);
  if (!locking && locked !== null) setLocked(null);
  const isSheet = locking ? (locked ?? fitsSheet) : fitsSheet;

  const content = (
    <SurfaceContext.Provider value={isSheet ? IN_SHEET : IN_POPOVER}>
      {children}
    </SurfaceContext.Provider>
  );
  return isSheet ? (
    <BottomSheet {...props}>{content}</BottomSheet>
  ) : (
    <Popover {...props}>{content}</Popover>
  );
}
