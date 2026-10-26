// The bundle guard (ADR 0024): reads the built app in dist/ and fails when the
// files loaded at start, or any other file, are over their gzip budget, when a
// file loaded at start holds a module that must load after the first render,
// or when a file is not precached. Run after `npm run build`; CI runs it on every pull request.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBundle } from './quality/bundleGuard.ts';
import { precachedFiles, readBuiltChunks } from './quality/builtChunks.ts';
import rules from './quality/bundle-budget.json' with { type: 'json' };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const chunks = readBuiltChunks(dist, root);
const precached = precachedFiles(readFileSync(join(dist, 'sw.js'), 'utf8'));
for (const chunk of chunks) {
  const kind = chunk.atStart ? 'start' : 'later';
  console.log(
    `${(chunk.gzipBytes / 1024).toFixed(1).padStart(7)} kB gzip  ${kind}  ${chunk.fileName}`,
  );
}
const problems = checkBundle(chunks, precached, rules);
for (const problem of problems) console.error(`bundle guard: ${problem}`);
process.exit(problems.length > 0 ? 1 : 0);
