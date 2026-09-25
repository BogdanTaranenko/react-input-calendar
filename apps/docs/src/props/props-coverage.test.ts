import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type { PropDoc } from './types';

const libraryDir = fileURLToPath(
  new URL('../../../../packages/react-input-calendar/', import.meta.url),
);
const entry = `${libraryDir}src/index.ts`;

/** Property names of every public type ending in `Props`, read from the library's source. */
function publicPropsTypes(): Map<string, string[]> {
  const configPath = `${libraryDir}tsconfig.json`;
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, libraryDir);
  const program = ts.createProgram([entry], options);
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`Cannot read the exports of ${entry}`);

  const result = new Map<string, string[]>();
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    if (!exported.name.endsWith('Props')) continue;
    const symbol =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const type = checker.getDeclaredTypeOfSymbol(symbol);
    // A union's own properties are only those every member shares; the docs list them all.
    const members = type.isUnion() ? type.types : [type];
    const names = new Set(members.flatMap((member) => checker.getPropertiesOfType(member)));
    result.set(exported.name, [...new Set([...names].map((property) => property.name))].sort());
  }
  return result;
}

const types = publicPropsTypes();
const tables = import.meta.glob<PropDoc[]>('./*Props.ts', { import: 'props', eager: true });

describe('props tables', () => {
  it('finds the public props types', () => {
    expect([...types.keys()].sort()).toEqual([
      'CalendarConfigProviderProps',
      'CalendarProps',
      'DatePickerProps',
      'DateRangePickerProps',
      'DateTimePickerProps',
      'DayRenderProps',
      'MultiDatePickerProps',
    ]);
  });

  describe.each([...types])('%s', (name, properties) => {
    const documented = (tables[`./${name}.ts`] ?? []).map((row) => row.name);

    it('documents every prop', () => {
      expect(properties.filter((property) => !documented.includes(property))).toEqual([]);
    });

    it('documents no prop that does not exist', () => {
      expect(documented.filter((row) => !properties.includes(row))).toEqual([]);
    });
  });
});
