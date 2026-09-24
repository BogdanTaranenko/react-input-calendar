import { useCallback, useSyncExternalStore } from 'react';

const hasMatchMedia = () => typeof window.matchMedia === 'function';

/**
 * Whether `query` matches, kept current as the viewport changes. It is `false` on the server
 * and during hydration, so server and client markup agree; the real value follows at once.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!hasMatchMedia()) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => hasMatchMedia() && window.matchMedia(query).matches,
    () => false,
  );
}
