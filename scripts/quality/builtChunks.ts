import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { BuiltChunk } from './bundleGuard.ts';

/** The build's own scripts `index.html` loads: the entry and what it
 * preloads, as `dist/` paths. */
export function startFiles(indexHtml: string): string[] {
  const tags =
    /<(?:script[^>]*\ssrc|link rel="modulepreload"[^>]*\shref)="[^"]*?(assets\/[^"]+\.js)"/g;
  return [...indexHtml.matchAll(tags)].map(([, path]) => path);
}

/** The `dist/` paths the service worker precaches. */
export function precachedFiles(swSource: string): string[] {
  return [...swSource.matchAll(/url:"([^"]+)"/g)].map(([, url]) => url);
}

/** A source map's sources as repository paths, e.g. `src/main.ts`. */
export function repoSources(mapJson: string, mapDir: string, root: string): string[] {
  const { sources } = JSON.parse(mapJson) as { sources: string[] };
  return sources.map((source) => relative(root, resolve(mapDir, source)));
}

/** Every JavaScript file the build wrote to `dist/assets/`. */
export function readBuiltChunks(dist: string, root: string): BuiltChunk[] {
  const assets = join(dist, 'assets');
  const atStart = startFiles(readFileSync(join(dist, 'index.html'), 'utf8'));
  return readdirSync(assets)
    .filter((name) => name.endsWith('.js'))
    .map((name) => {
      const path = join(assets, name);
      const fileName = `assets/${name}`;
      return {
        fileName,
        atStart: atStart.includes(fileName),
        gzipBytes: gzipSync(readFileSync(path)).length,
        sources: repoSources(readFileSync(`${path}.map`, 'utf8'), dirname(path), root),
      };
    });
}
