import { describe, expect, it } from 'vitest';
import { buildThemeCss, type TokenDefaults } from './theme-css';

const defaults: TokenDefaults = {
  light: { '--ric-accent': 'blue', '--ric-surface': '#fff', '--ric-radius': '12px' },
  dark: { '--ric-surface': '#222' },
};

describe('buildThemeCss', () => {
  it('is empty when nothing changed', () => {
    expect(buildThemeCss({ shared: {}, light: {}, dark: {} }, defaults)).toBe('');
  });

  it('writes a changed shared token to :root only', () => {
    const css = buildThemeCss(
      { shared: { '--ric-accent': '#ff0000' }, light: {}, dark: {} },
      defaults,
    );
    expect(css).toBe(':root,\n[data-ric-theme="light"] {\n  --ric-accent: #ff0000;\n}\n');
  });

  it('pairs a light-only change with the dark default, so dark mode keeps its value', () => {
    const css = buildThemeCss(
      { shared: {}, light: { '--ric-surface': '#fafafa' }, dark: {} },
      defaults,
    );
    expect(css).toBe(
      [
        ':root,\n[data-ric-theme="light"] {\n  --ric-surface: #fafafa;\n}\n',
        '@media (prefers-color-scheme: dark) {\n  :root:not([data-ric-theme="light"]) {\n    --ric-surface: #222;\n  }\n}\n',
        '[data-ric-theme="dark"] {\n  --ric-surface: #222;\n}\n',
      ].join('\n'),
    );
  });

  it('pairs a dark-only change with the light default', () => {
    const css = buildThemeCss(
      { shared: {}, light: {}, dark: { '--ric-surface': '#000' } },
      defaults,
    );
    expect(css).toContain(':root,\n[data-ric-theme="light"] {\n  --ric-surface: #fff;\n}');
    expect(css).toContain('[data-ric-theme="dark"] {\n  --ric-surface: #000;\n}');
  });

  it('lists tokens in the stylesheet order, whatever order they were changed in', () => {
    const css = buildThemeCss(
      { shared: { '--ric-radius': '4px', '--ric-accent': 'red' }, light: {}, dark: {} },
      defaults,
    );
    expect(css.indexOf('--ric-accent')).toBeLessThan(css.indexOf('--ric-radius'));
  });
});
