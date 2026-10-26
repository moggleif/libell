/** One JavaScript file of the build, as the guard sees it. */
export interface BuiltChunk {
  /** Path inside `dist/`, e.g. `assets/index-abc123.js`. */
  fileName: string;
  /** `index.html` loads it, as the entry or a file the entry preloads, so
   * the phone fetches and parses it before the first frame. */
  atStart: boolean;
  gzipBytes: number;
  /** Repository paths of the modules in the file, from its source map. */
  sources: string[];
}

/** The limits in `bundle-budget.json`, which may tighten but never loosen (ADR 0024). */
export interface BundleRules {
  /** Most gzip kB the files loaded at start may weigh together. */
  startMaxKb: number;
  /** Most gzip kB any other file may weigh. */
  chunkMaxKb: number;
  /** Path prefixes that must load after the first render, never at start. */
  startExcludes: string[];
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
  return [
    ...checkStartWeight(
      chunks.filter((chunk) => chunk.atStart),
      rules.startMaxKb,
    ),
    ...chunks.flatMap((chunk) => [
      ...checkChunkWeight(chunk, rules.chunkMaxKb),
      ...checkStartContents(chunk, rules.startExcludes),
      ...checkPrecached(chunk, precached),
    ]),
  ];
}

function checkStartWeight(atStart: BuiltChunk[], limit: number): string[] {
  const kb = atStart.reduce((sum, chunk) => sum + chunk.gzipBytes, 0) / KB;
  if (kb <= limit) return [];
  const files = atStart.map((chunk) => chunk.fileName).join(', ');
  return [
    `The files loaded at start (${files}) are ${kb.toFixed(1)} kB gzip, over their ` +
      `${limit} kB budget. Load more after the first render instead of raising the budget.`,
  ];
}

function checkChunkWeight(chunk: BuiltChunk, limit: number): string[] {
  const kb = chunk.gzipBytes / KB;
  if (chunk.atStart || kb <= limit) return [];
  return [
    `${chunk.fileName}: the file is ${kb.toFixed(1)} kB gzip, over its ${limit} kB budget. ` +
      'Split it, or load less of it, instead of raising the budget.',
  ];
}

function checkStartContents(chunk: BuiltChunk, excludes: string[]): string[] {
  if (!chunk.atStart) return [];
  return chunk.sources
    .filter((source) => excludes.some((prefix) => source.startsWith(prefix)))
    .map(
      (source) =>
        `${chunk.fileName}: loaded at start, it contains ${source}, which must load after ` +
        'the first render. Reach it through its lazy seam, never with a static import.',
    );
}

function checkPrecached(chunk: BuiltChunk, precached: string[]): string[] {
  if (precached.includes(chunk.fileName)) return [];
  return [
    `${chunk.fileName} is not precached, so the app would miss it offline. ` +
      'Check the Workbox globPatterns in vite.config.ts.',
  ];
}
