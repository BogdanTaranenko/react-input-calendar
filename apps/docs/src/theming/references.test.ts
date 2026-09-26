import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dataAttributes } from './data-attributes';
import { tokenDocs } from './token-docs';

const librarySrc = new URL('../../../../packages/react-input-calendar/src/', import.meta.url);

const readAll = (dir: string, extension: string) => {
  const folder = new URL(dir, librarySrc);
  return readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith(extension) && !file.includes('.test.'))
    .map((file) => readFileSync(new URL(file, folder), 'utf8'))
    .join('\n');
};

const unique = (values: Iterable<string>) => [...new Set(values)].sort();

describe('token reference', () => {
  const css = readAll('styles/', '.css');
  const tokens = unique([...css.matchAll(/--ric-[a-z0-9-]+/g)].map((match) => match[0]));

  it('describes every --ric-* token the stylesheet declares or reads', () => {
    expect(tokens.filter((token) => !(token in tokenDocs))).toEqual([]);
  });

  it('describes no token the stylesheet does not have', () => {
    expect(Object.keys(tokenDocs).filter((token) => !tokens.includes(token))).toEqual([]);
  });
});

describe('data attribute reference', () => {
  const tsx = readAll('./', '.tsx');
  const rendered = unique(
    [...tsx.matchAll(/\s(data-[a-z-]+)=/g)]
      .map((match) => match[1] ?? '')
      .filter((name) => name !== 'data-testid'),
  );
  const documented = dataAttributes.map((row) => row.name);

  it('documents every data-* attribute the components render', () => {
    expect(rendered.filter((name) => !documented.includes(name))).toEqual([]);
  });

  it('documents no attribute the components do not render', () => {
    expect(documented.filter((name) => !rendered.includes(name))).toEqual([]);
  });
});
