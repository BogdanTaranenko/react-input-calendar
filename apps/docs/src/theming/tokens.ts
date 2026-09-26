import type { TokenDefaults } from './theme-css';

const declarationsIn = (block: string): Record<string, string> =>
  Object.fromEntries(
    [...block.matchAll(/(--ric-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((match) => [
      match[1] ?? '',
      (match[2] ?? '').trim(),
    ]),
  );

/** The body of the first rule whose selector list ends with `selector`. */
function blockAfter(css: string, selector: RegExp): string {
  const match = selector.exec(css);
  if (!match) return '';
  const start = match.index + match[0].length;
  return css.slice(start, css.indexOf('}', start));
}

/** Default token values from the library's `tokens.css`: the light block and the forced-dark one. */
export function parseTokens(css: string): TokenDefaults {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return {
    light: declarationsIn(blockAfter(source, /\[data-ric-theme="light"\]\s*\{/)),
    // Not the `:not([data-ric-theme="light"])` rule inside the media query: that one repeats it.
    dark: declarationsIn(blockAfter(source, /(?:^|[\s,}])\[data-ric-theme="dark"\]\s*\{/)),
  };
}

const channel = (linear: number) => {
  const clamped = Math.min(1, Math.max(0, linear));
  const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255)
    .toString(16)
    .padStart(2, '0');
};

/** OKLCH to sRGB (Björn Ottosson's matrices), clamped into the sRGB gamut. */
function oklchToHex(lightness: number, chroma: number, hue: number): string {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return `#${channel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)}${channel(
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
  )}${channel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)}`;
}

/** A `#rrggbb` for `<input type="color">`, or `null` for values it cannot show. */
export function toHex(value: string): string | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (hex) {
    const digits = (hex[1] ?? '').toLowerCase();
    return digits.length === 3
      ? `#${[...digits].map((digit) => digit + digit).join('')}`
      : `#${digits}`;
  }
  const oklch = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(value.trim());
  if (!oklch) return null;
  const lightness = Number(oklch[1]) / (oklch[2] ? 100 : 1);
  return oklchToHex(lightness, Number(oklch[3]), Number(oklch[4]));
}
