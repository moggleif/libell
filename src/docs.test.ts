/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The documents name files that must exist (#388): a renamed or deleted
 * module otherwise leaves the docs pointing at nothing. Checked are repo
 * paths (`src/…`, `scripts/…`, `docs/…`, …), bare source file names
 * (`leveling.ts`) and relative Markdown links. A path with a placeholder
 * (`<lang>`, `NNNN`, `*`) describes a pattern, not a file, and is skipped.
 */
const ROOT = join(import.meta.dirname, '..');

const DOCS = [
  'README.md',
  'CLAUDE.md',
  'SECURITY.md',
  'docs/01-CONTRIBUTING.md',
  'docs/03-ARCHITECTURE.md',
  'docs/adr/README.md',
  'docs/ios-easylevel-bluefy-guide.md',
];

const REPO_PATH = /\b(?:src|scripts|public|docs|\.github)\/[\w./<>*-]+/g;
const FILE_NAME = /(?<![\w/.-])[\w-]+\.(?:ts|mjs|css)\b/g;
const MD_LINK = /\]\(([^)\s#]+)(?:#[^)]*)?\)/g;
const PLACEHOLDER = /[<>*]|NNNN|X\.Y/;

function filesUnder(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [entry.name],
  );
}

const SOURCE_NAMES = new Set([...filesUnder('src'), ...filesUnder('scripts'), 'vite.config.ts']);

function missingIn(doc: string): string[] {
  const text = readFileSync(join(ROOT, doc), 'utf8');
  const missing: string[] = [];
  for (const [match] of text.matchAll(REPO_PATH)) {
    const path = match.replace(/[.,]+$/, '');
    if (!PLACEHOLDER.test(path) && !existsSync(join(ROOT, path))) missing.push(path);
  }
  for (const [name] of text.matchAll(FILE_NAME)) {
    if (!SOURCE_NAMES.has(name)) missing.push(name);
  }
  for (const [, target] of text.matchAll(MD_LINK)) {
    if (target === undefined || /^[a-z]+:/.test(target)) continue;
    if (!existsSync(join(ROOT, dirname(doc), target))) missing.push(target);
  }
  return missing;
}

describe('documentation paths (#388)', () => {
  it.each(DOCS)('every file %s names exists', (doc) => {
    expect(missingIn(doc)).toEqual([]);
  });
});
