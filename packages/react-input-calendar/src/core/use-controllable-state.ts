import { useCallback, useEffect, useRef, useState } from 'react';
import { devWarn } from './dev-warn';

export interface ControllableStateOptions<T> {
  /** Controlled value. `undefined` means uncontrolled; `null` is a controlled "empty". */
  value: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
}

const mode = (controlled: boolean) => (controlled ? 'controlled' : 'uncontrolled');

/**
 * State that is either owned by the caller (`value` + `onChange`) or kept internally
 * (`defaultValue`). The setter always reports real changes through `onChange`.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const wasControlled = useRef(isControlled);
  useEffect(() => {
    if (wasControlled.current === isControlled) return;
    devWarn(
      `A component is changing from ${mode(wasControlled.current)} to ${mode(isControlled)}. ` +
        'Decide between `value` and `defaultValue` for its lifetime.',
    );
    wasControlled.current = isControlled;
  }, [isControlled]);

  const setValue = useCallback(
    (next: T) => {
      if (Object.is(next, current)) return;
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [current, isControlled, onChange],
  );

  return [current, setValue];
}
