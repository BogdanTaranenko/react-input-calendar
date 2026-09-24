import type { CSSProperties, RefObject } from 'react';

export interface RequiredValidatorProps {
  hasValue: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onInvalid: () => void;
}

// Inline, so the input stays hidden without the stylesheet. Not `display: none`: an
// unrendered control makes browsers warn that it "is not focusable".
const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: 0,
  padding: 0,
  border: 0,
  opacity: 0,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  pointerEvents: 'none',
};

const noop = () => undefined;

/**
 * Makes a native `<form>` refuse to submit while the picker is empty. On `invalid` it cancels
 * the browser's bubble, which would otherwise focus this hidden input after the handler, and
 * focuses the trigger instead. The form still does not submit. The visible message is the
 * consumer's `error` prop.
 */
export function RequiredValidator({ hasValue, triggerRef, onInvalid }: RequiredValidatorProps) {
  return (
    <input
      required
      tabIndex={-1}
      aria-hidden="true"
      autoComplete="off"
      value={hasValue ? 'x' : ''}
      onChange={noop}
      onInvalid={(event) => {
        event.preventDefault();
        triggerRef.current?.focus();
        onInvalid();
      }}
      style={VISUALLY_HIDDEN}
    />
  );
}
