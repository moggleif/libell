import { describe, expect, it } from 'vitest';
import { readSources } from './sourceFiles.ts';
import { findUnusedExports } from './unusedExports.ts';

const inSrc = (path: string) => path.startsWith('src/') && !path.endsWith('.test.ts');

function unused(files: Record<string, string>): string[] {
  const sources = Object.entries(files).map(([path, source]) => ({ path, source }));
  return findUnusedExports(sources, inSrc);
}

describe('findUnusedExports', () => {
  it('accepts an export another file imports', () => {
    expect(
      unused({
        'src/a.ts': 'export function used() {}',
        'src/b.ts': "import { used } from './a';\nused();",
      }),
    ).toEqual([]);
  });

  it('fails an export nothing imports, naming the file, line and export', () => {
    expect(unused({ 'src/a.ts': '\nexport const LONELY = 1;' })).toEqual([
      'Unused export: src/a.ts:2 LONELY is imported nowhere. Remove it or drop "export".',
    ]);
  });

  it('counts an import from a test file as a use (#376)', () => {
    expect(
      unused({
        'src/a.ts': 'export function onlyTested() {}',
        'src/a.test.ts': "import { onlyTested } from './a';",
      }),
    ).toEqual([]);
  });

  it('counts an import from a script outside src as a use', () => {
    expect(
      unused({
        'src/domain/a.ts': 'export const LIST = [];',
        'scripts/fit.mjs': "import { LIST } from '../src/domain/a.ts';",
      }),
    ).toEqual([]);
  });

  it('leaves exported types alone, since they describe the module interface', () => {
    expect(
      unused({
        'src/a.ts':
          'export interface Shape {}\nexport type Kind = string;\nexport type { Shape as S };',
      }),
    ).toEqual([]);
  });

  it('checks each name of a destructured export and of an export list by its exported name', () => {
    expect(
      unused({
        'src/a.ts': 'const x = 1;\nexport const { a, b } = { a: 1, b: 2 };\nexport { x as y };',
        'src/b.ts': "import { a } from './a';",
      }),
    ).toEqual([
      'Unused export: src/a.ts:2 b is imported nowhere. Remove it or drop "export".',
      'Unused export: src/a.ts:3 y is imported nowhere. Remove it or drop "export".',
    ]);
  });

  it('counts a namespace import or export * as using every export', () => {
    const files = { 'src/a.ts': 'export const one = 1;\nexport const two = 2;' };
    expect(unused({ ...files, 'src/b.ts': "import * as all from './a';" })).toEqual([]);
    expect(unused({ ...files, 'src/b.test.ts': "export * from './a';" })).toEqual([]);
  });

  it('follows a re-export to its source, and checks the re-export itself', () => {
    expect(
      unused({
        'src/a.ts': 'export const one = 1;',
        'src/index.ts': "export { one } from './a';",
      }),
    ).toEqual([
      'Unused export: src/index.ts:1 one is imported nowhere. Remove it or drop "export".',
    ]);
  });

  it('resolves a directory import to its index file', () => {
    expect(
      unused({
        'src/ui/index.ts': 'export const ui = 1;',
        'src/main.ts': "import { ui } from './ui';",
      }),
    ).toEqual([]);
  });

  it('ignores imports from packages', () => {
    expect(
      unused({ 'src/a.ts': "import { describe } from 'vitest';\nexport const lone = 1;" }),
    ).toEqual(['Unused export: src/a.ts:2 lone is imported nowhere. Remove it or drop "export".']);
  });
});

describe('the app source', () => {
  it('exports nothing that no file imports (#475)', () => {
    const isCode = (path: string, isDir: boolean) => isDir || /\.(ts|mjs)$/.test(path);
    const files = [
      ...readSources('src', isCode),
      ...readSources('scripts', isCode),
      ...readSources('.', (path) => path === 'vite.config.ts' || path === 'vitest.setup.ts'),
    ];
    expect(findUnusedExports(files, inSrc)).toEqual([]);
  });
});
