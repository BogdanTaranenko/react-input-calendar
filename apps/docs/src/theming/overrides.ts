import type { ThemeOverrides, TokenDefaults } from './theme-css';

export type OverrideTarget = keyof ThemeOverrides;

export const EMPTY_OVERRIDES: ThemeOverrides = { shared: {}, light: {}, dark: {} };

const defaultFor = (target: OverrideTarget, token: string, defaults: TokenDefaults) =>
  target === 'dark' ? (defaults.dark[token] ?? defaults.light[token]) : defaults.light[token];

/** Sets one token for one scheme (or both, `shared`). A default value removes the override. */
export function setOverride(
  overrides: ThemeOverrides,
  target: OverrideTarget,
  token: string,
  value: string,
  defaults: TokenDefaults,
): ThemeOverrides {
  const { [token]: _previous, ...rest } = overrides[target];
  const values = value === defaultFor(target, token, defaults) ? rest : { ...rest, [token]: value };
  return { ...overrides, [target]: values };
}

/** Inline custom properties for a preview showing `scheme`. */
export function previewStyle(
  overrides: ThemeOverrides,
  defaults: TokenDefaults,
  scheme: 'light' | 'dark',
): Record<string, string> {
  const schemeTokens = new Set([...Object.keys(overrides.light), ...Object.keys(overrides.dark)]);
  const values = [...schemeTokens].map((token): [string, string] => [
    token,
    overrides[scheme][token] ?? defaultFor(scheme, token, defaults) ?? '',
  ]);
  return { ...overrides.shared, ...Object.fromEntries(values) };
}
