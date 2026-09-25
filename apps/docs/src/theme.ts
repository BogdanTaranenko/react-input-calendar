import { useSyncExternalStore } from 'react';

export type Theme = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'ric-docs-theme';
const listeners = new Set<() => void>();

const readStored = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
};

let current: Theme = readStored();

/**
 * One attribute on `<html>` themes both the site and every component on it: the library's
 * stylesheet honours an ancestor `data-ric-theme`, and so does the site's.
 */
function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.ricTheme;
  else root.dataset.ricTheme = theme;
}

apply(current);

export function setTheme(theme: Theme) {
  current = theme;
  apply(theme);
  try {
    if (theme === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the choice then lasts for this visit only.
  }
  listeners.forEach((listener) => {
    listener();
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => current);
}
