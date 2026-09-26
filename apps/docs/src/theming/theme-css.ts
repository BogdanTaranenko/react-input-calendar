/** Token values by scheme. `dark` holds only the tokens whose value changes in dark mode. */
export interface TokenDefaults {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/** Only what the reader changed. `shared` tokens have one value for both schemes. */
export interface ThemeOverrides {
  shared: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
}

const LIGHT_SELECTOR = ':root,\n[data-ric-theme="light"]';

const declarations = (values: [string, string][], indent: string) =>
  values.map(([token, value]) => `${indent}${token}: ${value};\n`).join('');

/**
 * CSS for the changed tokens only. Unlayered consumer rules beat the library's `@layer ric`
 * dark rules, so a colour changed for one scheme is written for both: otherwise a new light
 * surface would also show in dark mode.
 */
export function buildThemeCss(overrides: ThemeOverrides, defaults: TokenDefaults): string {
  const order = Object.keys(defaults.light);
  const rank = (token: string) => {
    const index = order.indexOf(token);
    return index === -1 ? order.length : index;
  };
  const sorted = (tokens: Iterable<string>) =>
    [...new Set(tokens)].sort((a, b) => rank(a) - rank(b));

  const schemeTokens = sorted([...Object.keys(overrides.light), ...Object.keys(overrides.dark)]);
  const light = sorted([...Object.keys(overrides.shared), ...schemeTokens]).map(
    (token): [string, string] => [
      token,
      overrides.shared[token] ?? overrides.light[token] ?? defaults.light[token] ?? '',
    ],
  );
  const dark = schemeTokens.map((token): [string, string] => [
    token,
    overrides.dark[token] ?? defaults.dark[token] ?? '',
  ]);

  if (light.length === 0) return '';
  const blocks = [`${LIGHT_SELECTOR} {\n${declarations(light, '  ')}}\n`];
  if (dark.length > 0) {
    blocks.push(
      `@media (prefers-color-scheme: dark) {\n  :root:not([data-ric-theme="light"]) {\n${declarations(dark, '    ')}  }\n}\n`,
      `[data-ric-theme="dark"] {\n${declarations(dark, '  ')}}\n`,
    );
  }
  return blocks.join('\n');
}
