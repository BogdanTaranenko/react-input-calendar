import { describe, expect, it } from 'vitest';
import { EMPTY_OVERRIDES, previewStyle, setOverride } from './overrides';
import type { TokenDefaults } from './theme-css';

const defaults: TokenDefaults = {
  light: { '--ric-accent': 'blue', '--ric-surface': '#fff' },
  dark: { '--ric-surface': '#222' },
};

describe('setOverride', () => {
  it('returns a new object and leaves the old one alone', () => {
    const next = setOverride(EMPTY_OVERRIDES, 'shared', '--ric-accent', 'red', defaults);
    expect(next.shared).toEqual({ '--ric-accent': 'red' });
    expect(EMPTY_OVERRIDES.shared).toEqual({});
  });

  it('drops a value set back to its default, so Copy CSS lists only real changes', () => {
    const changed = setOverride(EMPTY_OVERRIDES, 'dark', '--ric-surface', '#000', defaults);
    expect(setOverride(changed, 'dark', '--ric-surface', '#222', defaults).dark).toEqual({});
  });
});

describe('previewStyle', () => {
  const overrides = {
    shared: { '--ric-accent': 'red' },
    light: { '--ric-surface': '#eee' },
    dark: {},
  };

  it('uses the light value in light mode', () => {
    expect(previewStyle(overrides, defaults, 'light')).toEqual({
      '--ric-accent': 'red',
      '--ric-surface': '#eee',
    });
  });

  it('uses the dark default for a token changed only in light', () => {
    expect(previewStyle(overrides, defaults, 'dark')).toEqual({
      '--ric-accent': 'red',
      '--ric-surface': '#222',
    });
  });
});
