import { afterEach, describe, expect, it, vi } from 'vitest';
import { devWarn } from './dev-warn';

describe('devWarn', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('warns with the library prefix outside production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    devWarn('something odd');
    expect(warn).toHaveBeenCalledExactlyOnceWith('[react-input-calendar] something odd');
  });

  it('is silent when NODE_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    devWarn('something odd');
    expect(warn).not.toHaveBeenCalled();
  });

  it('still warns when there is no process global (unbundled browser ESM)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('process', undefined);
    try {
      devWarn('something odd');
    } finally {
      vi.unstubAllGlobals();
    }
    expect(warn).toHaveBeenCalledOnce();
  });
});
