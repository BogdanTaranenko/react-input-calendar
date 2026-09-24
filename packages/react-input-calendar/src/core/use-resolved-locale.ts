import { useSyncExternalStore } from 'react';
import { useCalendarConfig } from './config-context';

const SERVER_LOCALE = 'en-US';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('languagechange', onChange);
  return () => {
    window.removeEventListener('languagechange', onChange);
  };
}

const getBrowserLocale = () => navigator.language;
const getServerLocale = () => SERVER_LOCALE;

/**
 * prop → `CalendarConfigProvider` → browser language. The server and the hydration pass
 * use en-US, then React re-renders with the browser value, so no mismatch is reported.
 */
export function useResolvedLocale(propLocale: string | undefined): string {
  const providerLocale = useCalendarConfig().locale;
  const browserLocale = useSyncExternalStore(subscribe, getBrowserLocale, getServerLocale);
  return propLocale ?? providerLocale ?? browserLocale;
}
