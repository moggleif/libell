/** One JavaScript file of the build, as the guard sees it. */
export interface BuiltChunk {
  /** Path inside `dist/`, e.g. `assets/index-abc123.js`. */
  fileName: string;
  /** The file `index.html` loads, which the phone parses before the first frame. */
  isEntry: boolean;
  gzipBytes: number;
  /** Repository paths of the modules in the file, from its source map. */
  sources: string[];
}

/** The limits in `bundle-budget.json`, which may tighten but never loosen (ADR 0024). */
export interface BundleRules {
  /** Most gzip kB the entry file may weigh. */
  entryMaxKb: number;
  /** Most gzip kB any other file may weigh. */
  chunkMaxKb: number;
  /** Path prefixes that must load after the first render, never in the entry file. */
  entryExcludes: string[];
}

const KB = 1024;

/**
 * Every way the build breaks the rules, as messages naming the file and what
 * to do. `precached` lists the `dist/` paths the service worker precaches.
 */
export function checkBundle(
  chunks: BuiltChunk[],
  precached: string[],
  rules: BundleRules,
): string[] {
  return chunks.flatMap((chunk) => [
    ...checkWeight(chunk, rules),
    ...checkEntryContents(chunk, rules.entryExcludes),
    ...checkPrecached(chunk, precached),
  ]);
}

function checkWeight(chunk: BuiltChunk, rules: BundleRules): string[] {
  const limit = chunk.isEntry ? rules.entryMaxKb : rules.chunkMaxKb;
  const kb = chunk.gzipBytes / KB;
  if (kb <= limit) return [];
  const kind = chunk.isEntry ? 'entry file' : 'file';
  return [
    `${chunk.fileName}: the ${kind} is ${kb.toFixed(1)} kB gzip, over its ${limit} kB budget. ` +
      'Load more of it after the first render instead of raising the budget.',
  ];
}

function checkEntryContents(chunk: BuiltChunk, excludes: string[]): string[] {
  if (!chunk.isEntry) return [];
  return chunk.sources
    .filter((source) => excludes.some((prefix) => source.startsWith(prefix)))
    .map(
      (source) =>
        `${chunk.fileName}: the entry file contains ${source}, which must load after the ` +
        'first render. Reach it through its lazy seam, never with a static import.',
    );
}

function checkPrecached(chunk: BuiltChunk, precached: string[]): string[] {
  if (precached.includes(chunk.fileName)) return [];
  return [
    `${chunk.fileName} is not precached, so the app would miss it offline. ` +
      'Check the Workbox globPatterns in vite.config.ts.',
  ];
}
