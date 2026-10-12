import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface SourceFile {
  path: string;
  source: string;
}

/**
 * Every file under `dir` whose path `include` accepts, read as text. A
 * directory `include` rejects is not entered.
 */
export function readSources(
  dir: string,
  include: (path: string, isDir: boolean) => boolean,
): SourceFile[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (!include(path, entry.isDirectory())) return [];
    if (entry.isDirectory()) return readSources(path, include);
    return [{ path, source: readFileSync(path, 'utf8') }];
  });
}
