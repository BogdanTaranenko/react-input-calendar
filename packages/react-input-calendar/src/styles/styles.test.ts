import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const STYLES_DIR = import.meta.dirname;
const PARTIALS = ['tokens.css', 'field.css', 'overlay.css', 'calendar.css', 'time.css', 'motion.css'];

/**
 * Returns the depth-0 statements of a stylesheet: each block's prelude (the text
 * before its `{`) and each `;`-terminated at-rule. Comments are stripped and
 * quoted strings are skipped, so braces inside `content: "{"` don't count.
 */
function topLevelStatements(css: string): string[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const statements: string[] = [];
  let depth = 0;
  let current = '';
  let quote: string | null = null;

  for (const char of source) {
    if (quote !== null) {
      if (depth === 0) current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      if (depth === 0) current += char;
    } else if (char === '{') {
      if (depth === 0) statements.push(current.trim());
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth < 0) throw new Error('unbalanced "}"');
      current = '';
    } else if (depth === 0 && char === ';') {
      statements.push(`${current.trim()};`);
      current = '';
    } else if (depth === 0) {
      current += char;
    }
  }
  if (depth !== 0) throw new Error('unclosed "{"');
  if (current.trim() !== '') statements.push(current.trim());
  return statements;
}

function isRicLayer(statement: string): boolean {
  return /^@layer\s+ric$/.test(statement);
}

function read(file: string): string {
  return readFileSync(join(STYLES_DIR, file), 'utf8');
}

describe('topLevelStatements', () => {
  it('returns block preludes and at-rule statements at depth 0 only', () => {
    const css = '@import "a.css";\n@layer ric { .a { color: red } @media (x) { .b {} } }\n.c {}';
    expect(topLevelStatements(css)).toEqual(['@import "a.css";', '@layer ric', '.c']);
  });

  it('ignores braces inside comments and strings', () => {
    const css = '/* } .x { */ @layer ric { .a::before { content: "}{" } }';
    expect(topLevelStatements(css)).toEqual(['@layer ric']);
  });

  it('throws on unbalanced braces', () => {
    expect(() => topLevelStatements('@layer ric { .a {}')).toThrow('unclosed');
    expect(() => topLevelStatements('@layer ric {} }')).toThrow('unbalanced');
  });

  it('only accepts the exact ric layer', () => {
    expect(isRicLayer('@layer ric')).toBe(true);
    expect(isRicLayer('@layer rico')).toBe(false);
    expect(isRicLayer('@layer ric, other')).toBe(false);
  });
});

describe('library stylesheets', () => {
  const files = readdirSync(STYLES_DIR).filter((file) => file.endsWith('.css'));

  it('has index.css plus every partial', () => {
    expect([...files].sort()).toEqual(['index.css', ...PARTIALS].sort());
  });

  it('index.css only imports the partials, in cascade order', () => {
    const statements = topLevelStatements(read('index.css'));
    expect(statements).toEqual(PARTIALS.map((file) => `@import "./${file}";`));
  });

  it.each(PARTIALS)('%s keeps every rule inside one @layer ric block', (file) => {
    const statements = topLevelStatements(read(file));
    expect(statements).toEqual(['@layer ric']);
  });

  it('never uses var() inside ::backdrop, which older browsers do not inherit into', () => {
    for (const file of PARTIALS) {
      const backdropRules = read(file).match(/::backdrop\s*\{[^}]*\}/g) ?? [];
      for (const rule of backdropRules) expect(rule).not.toContain('var(');
    }
  });

  // Without these the browser claims the gesture (pointercancel) before useSwipe sees it.
  it('leaves horizontal swipes on the sheet grid and every drag on the handle to script', () => {
    const css = read('overlay.css');
    expect(css).toMatch(/\.ric-sheet \.ric-months\s*\{[^}]*touch-action:\s*pan-y;/);
    expect(css).toMatch(/\.ric-sheet-handle\s*\{[^}]*touch-action:\s*none;/);
  });
});
