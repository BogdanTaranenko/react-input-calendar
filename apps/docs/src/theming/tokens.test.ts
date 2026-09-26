import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTokens, toHex } from './tokens';

const tokensCss = readFileSync(
  new URL('../../../../packages/react-input-calendar/src/styles/tokens.css', import.meta.url),
  'utf8',
);

describe('parseTokens', () => {
  it('reads the light block and the forced-dark block, ignoring comments', () => {
    const css = `@layer ric {
      :root,
      [data-ric-theme="light"] {
        /* a note */
        --ric-accent: blue;
        --ric-surface: #fff;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-ric-theme="light"]) { --ric-surface: #111; }
      }
      [data-ric-theme="dark"] {
        --ric-surface: #222;
      }
    }`;
    expect(parseTokens(css)).toEqual({
      light: { '--ric-accent': 'blue', '--ric-surface': '#fff' },
      dark: { '--ric-surface': '#222' },
    });
  });

  it('reads the real stylesheet', () => {
    const { light, dark } = parseTokens(tokensCss);
    expect(light['--ric-accent']).toBe('oklch(0.56 0.2 265)');
    expect(light['--ric-ease']).toBe('cubic-bezier(0.2, 0.8, 0.2, 1)');
    expect(dark['--ric-surface']).toBe('oklch(0.24 0.015 265)');
    expect(dark['--ric-accent']).toBeUndefined();
  });
});

describe('toHex', () => {
  it.each([
    ['#fff', '#ffffff'],
    ['#1A2b3C', '#1a2b3c'],
    ['oklch(1 0 0)', '#ffffff'],
    ['oklch(0 0 0)', '#000000'],
    ['oklch(0.628 0.2577 29.23)', '#ff0000'],
    ['oklch(62.8% 0.2577 29.23)', '#ff0000'],
    ['oklch(0.452 0.313 264.05)', '#0000ff'],
  ])('%s → %s', (input, hex) => {
    expect(toHex(input)).toBe(hex);
  });

  it('returns null for values a colour input cannot show', () => {
    expect(toHex('color-mix(in oklab, red 10%, transparent)')).toBeNull();
    expect(toHex('rgb(0 0 0 / 0.4)')).toBeNull();
  });
});
