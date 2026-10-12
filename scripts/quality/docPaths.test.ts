import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { findMissingPaths, pathMentions } from './docPaths.ts';
import { readSources } from './sourceFiles.ts';

/** The living documents; ADRs are dated records and keep the paths of their day. */
const DOCS = [
  'README.md',
  'CLAUDE.md',
  'SECURITY.md',
  'docs/01-CONTRIBUTING.md',
  'docs/02-REQUIREMENTS.md',
  'docs/03-ARCHITECTURE.md',
];

const NOT_IN_REPO = new Set(['node_modules', '.git', 'dist', 'coverage']);

const REPO = [
  'src/main.ts',
  'src/ui/messages/en.ts',
  'src/ui/messages/sv.ts',
  'docs/adr/0001-x.md',
];

function missing(path: string, source: string): string[] {
  return findMissingPaths([{ path, source }], REPO);
}

describe('pathMentions', () => {
  it('finds paths and file names, with their line, and trims punctuation and line numbers', () => {
    expect(pathMentions('See `src/main.ts:12`.\nThe `en.ts` file, then docs/adr/.')).toEqual([
      { path: 'src/main.ts', line: 1 },
      { path: 'en.ts', line: 2 },
      { path: 'docs/adr/', line: 2 },
    ]);
  });

  it('skips web links and words that only look like files', () => {
    expect(pathMentions('Node.js 22, see https://example.com/src/x.ts and e.g. this.')).toEqual([]);
  });
});

describe('findMissingPaths', () => {
  it('accepts paths, directories, file names and placeholders that exist', () => {
    expect(
      missing('README.md', 'src/main.ts, src/ui/, main.ts, src/ui/messages/<lang>.ts'),
    ).toEqual([]);
  });

  it('resolves a path from the document’s own directory too', () => {
    expect(missing('docs/guide.md', 'See [ADR 1](adr/0001-x.md).')).toEqual([]);
  });

  it('fails a reference to a missing file, naming the document, line and path', () => {
    expect(missing('CLAUDE.md', 'intro\nLives in `src/gone.ts`.')).toEqual([
      'Missing file: CLAUDE.md:2 mentions "src/gone.ts", which is not in the repository. Fix the reference or the file name.',
    ]);
  });

  it('fails a bare file name that matches no file, and a missing directory', () => {
    expect(missing('README.md', '`renamed.ts` in src/old/')).toEqual([
      'Missing file: README.md:1 mentions "renamed.ts", which is not in the repository. Fix the reference or the file name.',
      'Missing file: README.md:1 mentions "src/old/", which is not in the repository. Fix the reference or the file name.',
    ]);
  });
});

describe('the documentation', () => {
  it('mentions only files that exist (#475)', () => {
    const repoFiles = readSources('.', (path) => !NOT_IN_REPO.has(path)).map((file) => file.path);
    const docs = DOCS.map((path) => ({ path, source: readFileSync(path, 'utf8') }));
    expect(findMissingPaths(docs, repoFiles)).toEqual([]);
  });
});
