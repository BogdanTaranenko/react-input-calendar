import { useSyncExternalStore } from 'react';

const subscribeNever = () => () => undefined;

/** `false` on the server and during hydration, `true` from then on. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
