import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useIsClient } from './use-is-client';

function Probe() {
  return <span>{String(useIsClient())}</span>;
}

describe('useIsClient', () => {
  it('is false during server render', () => {
    expect(renderToString(<Probe />)).toBe('<span>false</span>');
  });

  it('is true on the client', () => {
    const { result } = renderHook(() => useIsClient());
    expect(result.current).toBe(true);
  });
});
