import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkBundle, type BuiltChunk, type BundleRules } from './bundleGuard.ts';
import { precachedFiles, readBuiltChunks, repoSources, startFiles } from './builtChunks.ts';

const RULES: BundleRules = { startMaxKb: 100, chunkMaxKb: 50, startExcludes: ['src/ui/help'] };

const chunk = (overrides: Partial<BuiltChunk> = {}): BuiltChunk => ({
  fileName: 'assets/index-a.js',
  atStart: true,
  gzipBytes: 10 * 1024,
  sources: ['src/main.ts'],
  ...overrides,
});

describe('checkBundle', () => {
  it('passes a precached build within its budgets', () => {
    const chunks = [chunk(), chunk({ fileName: 'assets/help-b.js', atStart: false })];
    expect(checkBundle(chunks, ['assets/index-a.js', 'assets/help-b.js'], RULES)).toEqual([]);
  });

  it('holds the files loaded at start to one budget together, and other files to theirs', () => {
    const entry = chunk({ gzipBytes: 60 * 1024 });
    const preloaded = chunk({ fileName: 'assets/dom-c.js', gzipBytes: 41 * 1024 });
    const lazy = chunk({ fileName: 'assets/help-b.js', atStart: false, gzipBytes: 51 * 1024 });
    const all = ['assets/index-a.js', 'assets/dom-c.js', 'assets/help-b.js'];
    const problems = checkBundle([entry, preloaded, lazy], all, RULES);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain(
      'The files loaded at start (assets/index-a.js, assets/dom-c.js) are 101.0 kB gzip',
    );
    expect(problems[0]).toContain('100 kB budget');
    expect(problems[1]).toContain('assets/help-b.js: the file is 51.0 kB gzip');
    expect(problems[1]).toContain('50 kB budget');
  });

  it('allows a file exactly at its budget', () => {
    expect(checkBundle([chunk({ gzipBytes: 100 * 1024 })], ['assets/index-a.js'], RULES)).toEqual(
      [],
    );
  });

  it('names each excluded module found in a file loaded at start', () => {
    const entry = chunk({ sources: ['src/main.ts', 'src/ui/helpTopics.ts'] });
    expect(checkBundle([entry], ['assets/index-a.js'], RULES)).toEqual([
      expect.stringContaining('loaded at start, it contains src/ui/helpTopics.ts'),
    ]);
  });

  it('lets excluded modules live in other files', () => {
    const lazy = chunk({ fileName: 'assets/h.js', atStart: false, sources: ['src/ui/help.ts'] });
    expect(checkBundle([lazy], ['assets/h.js'], RULES)).toEqual([]);
  });

  it('names a file the service worker does not precache', () => {
    expect(checkBundle([chunk()], [], RULES)).toEqual([
      expect.stringContaining('assets/index-a.js is not precached'),
    ]);
  });
});

describe('reading the build', () => {
  it('finds the entry and the files it preloads, whatever the base path', () => {
    const html =
      '<script type="module" crossorigin src="/libell/assets/index-a.js"></script>' +
      '<link rel="modulepreload" crossorigin href="/libell/assets/dom-c.js">' +
      '<script id="vite-plugin-pwa:register-sw" src="/libell/registerSW.js" defer></script>';
    expect(startFiles(html)).toEqual(['assets/index-a.js', 'assets/dom-c.js']);
  });

  it('lists the precache manifest of sw.js', () => {
    const sw =
      'e.precacheAndRoute([{url:"registerSW.js",revision:"1"},{url:"assets/i.js",revision:null}])';
    expect(precachedFiles(sw)).toEqual(['registerSW.js', 'assets/i.js']);
  });

  it('turns source-map sources into repository paths', () => {
    const map = JSON.stringify({ sources: ['../../src/main.ts', '../../src/ui/i18n.ts'] });
    expect(repoSources(map, '/repo/dist/assets', '/repo')).toEqual([
      'src/main.ts',
      'src/ui/i18n.ts',
    ]);
  });

  it('reads every JavaScript file of a dist folder with its weight and modules', () => {
    const root = mkdtempSync(join(tmpdir(), 'bundle-guard-'));
    const assets = join(root, 'dist', 'assets');
    mkdirSync(assets, { recursive: true });
    writeFileSync(join(root, 'dist', 'index.html'), '<script type="module" src="/assets/a.js">');
    for (const [name, source] of [
      ['a.js', 'src/main.ts'],
      ['b.js', 'src/ui/help.ts'],
    ]) {
      writeFileSync(join(assets, name), 'console.log(1);');
      writeFileSync(join(assets, `${name}.map`), JSON.stringify({ sources: [`../../${source}`] }));
    }
    writeFileSync(join(assets, 'style.css'), 'body{}');

    const chunks = readBuiltChunks(join(root, 'dist'), root);
    expect(
      chunks.map(({ fileName, atStart, sources }) => ({ fileName, atStart, sources })),
    ).toEqual([
      { fileName: 'assets/a.js', atStart: true, sources: ['src/main.ts'] },
      { fileName: 'assets/b.js', atStart: false, sources: ['src/ui/help.ts'] },
    ]);
    expect(chunks.every((c) => c.gzipBytes > 0)).toBe(true);
  });
});
