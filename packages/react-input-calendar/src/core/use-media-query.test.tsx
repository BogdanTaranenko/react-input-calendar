import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './use-media-query';

/** A controllable `matchMedia` whose listeners the test can fire. */
function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const matchMedia = vi.fn((media: string) => ({
    get matches() {
      return matches;
    },
    media,
    addEventListener: (_type: 'change', listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: 'change', listener: () => void) => {
      listeners.delete(listener);
    },
  }));
  vi.stubGlobal('matchMedia', matchMedia);
  return {
    matchMedia,
    listeners,
    set(next: boolean) {
      matches = next;
      listeners.forEach((listener) => {
        listener();
      });
    },
  };
}

function Probe() {
  return <span>{String(useMediaQuery('(max-width: 639.98px)'))}</span>;
}

describe('useMediaQuery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false during server render, even when the query matches', () => {
    stubMatchMedia(true);
    expect(renderToString(<Probe />)).toBe('<span>false</span>');
  });

  it('reads the query on the client', () => {
    const media = stubMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(max-width: 639.98px)'));
    expect(result.current).toBe(true);
    expect(media.matchMedia).toHaveBeenCalledWith('(max-width: 639.98px)');
  });

  it('follows changes and unsubscribes on unmount', () => {
    const media = stubMatchMedia(false);
    const { result, unmount } = renderHook(() => useMediaQuery('(max-width: 639.98px)'));
    expect(result.current).toBe(false);

    act(() => {
      media.set(true);
    });
    expect(result.current).toBe(true);

    unmount();
    expect(media.listeners.size).toBe(0);
  });

  it('is false where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useMediaQuery('(max-width: 639.98px)'));
    expect(result.current).toBe(false);
  });
});
