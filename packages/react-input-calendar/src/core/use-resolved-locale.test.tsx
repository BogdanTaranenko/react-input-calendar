import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarConfigProvider } from './config-context';
import { useResolvedLocale } from './use-resolved-locale';

function ShowLocale({ locale }: { locale?: string }) {
  return <span data-testid="locale">{useResolvedLocale(locale)}</span>;
}

const withProvider = (locale: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <CalendarConfigProvider locale={locale}>{children}</CalendarConfigProvider>;
  };

describe('useResolvedLocale', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefers the prop over the provider and the browser', () => {
    const { result } = renderHook(() => useResolvedLocale('fr-FR'), {
      wrapper: withProvider('de-DE'),
    });
    expect(result.current).toBe('fr-FR');
  });

  it('falls back to the provider locale', () => {
    const { result } = renderHook(() => useResolvedLocale(undefined), {
      wrapper: withProvider('de-DE'),
    });
    expect(result.current).toBe('de-DE');
  });

  it('falls back to navigator.language on the client', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('uk-UA');
    const { result } = renderHook(() => useResolvedLocale(undefined));
    expect(result.current).toBe('uk-UA');
  });

  it('follows languagechange events', () => {
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
    render(<ShowLocale />);
    expect(screen.getByTestId('locale')).toHaveTextContent('en-GB');

    language.mockReturnValue('pl-PL');
    act(() => {
      window.dispatchEvent(new Event('languagechange'));
    });
    expect(screen.getByTestId('locale')).toHaveTextContent('pl-PL');
  });

  it('renders en-US on the server, whatever the browser says', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
    expect(renderToString(<ShowLocale />)).toContain('en-US');
  });
});
