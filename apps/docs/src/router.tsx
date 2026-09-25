import { useSyncExternalStore, type AnchorHTMLAttributes } from 'react';

/** The route is the hash without `#/`, so the site works on a static host with no rewrites. */
const readRoute = () => window.location.hash.replace(/^#\/?/, '');

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
};

export function useRoute(): string {
  return useSyncExternalStore(subscribe, readRoute, () => '');
}

export const href = (path: string) => `#/${path}`;

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
}

export function Link({ to, ...rest }: LinkProps) {
  const current = useRoute() === to;
  return <a href={href(to)} aria-current={current ? 'page' : undefined} {...rest} />;
}
