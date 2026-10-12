import { posix } from 'node:path';
import type { SourceFile } from './sourceFiles.ts';

/** Where a document names a file or directory of the repository. */
export interface PathMention {
  path: string;
  line: number;
}

const TOP_DIRS = ['src', 'scripts', 'docs', 'public', '.github', '.githooks'];
const EXTENSIONS = ['ts', 'mjs', 'css', 'json', 'md', 'svg', 'yml'];

const CANDIDATE = /[\w<>*.\/-]+/g;
const URL = /\bhttps?:\/\/\S+/g;

/** Every repository path or file name a Markdown text mentions; web links are skipped. */
export function pathMentions(text: string): PathMention[] {
  return text.split('\n').flatMap((lineText, index) =>
    [...lineText.replace(URL, ' ').matchAll(CANDIDATE)]
      .map((match) => cleanToken(match[0]))
      .filter(looksLikePath)
      .map((path) => ({ path, line: index + 1 })),
  );
}

/**
 * Every path a document mentions that is not in the repository, as messages
 * naming the document, line and path. A path with a directory resolves from
 * the repository root or from the document's own directory; a bare file name
 * must match a file anywhere. `<placeholder>` and `*` match any name part.
 */
export function findMissingPaths(docs: SourceFile[], repoFiles: string[]): string[] {
  const paths = withDirectories(repoFiles);
  const names = new Set(repoFiles.map((file) => posix.basename(file)));
  return docs.flatMap(({ path: doc, source }) =>
    pathMentions(source)
      .filter(({ path }) => !exists(path, posix.dirname(doc), paths, names))
      .map(
        ({ path, line }) =>
          `Missing file: ${doc}:${line} mentions "${path}", which is not in the repository. Fix the reference or the file name.`,
      ),
  );
}

function cleanToken(token: string): string {
  return token.replace(/[.,:;]+$/, '').replace(/:\d+$/, '');
}

function looksLikePath(token: string): boolean {
  const parts = token.split('/');
  if (parts.length > 1)
    return TOP_DIRS.includes(parts[0] ?? '') || parts[0] === '.' || parts[0] === '..';
  const match = /^[\w<>*-][\w<>*.-]*\.(\w+)$/.exec(token);
  return match !== null && EXTENSIONS.includes(match[1] ?? '');
}

/** Every file, plus every directory that holds one (with a trailing slash). */
function withDirectories(files: string[]): string[] {
  const all = new Set(files);
  for (const file of files) {
    for (let dir = posix.dirname(file); dir !== '.'; dir = posix.dirname(dir)) all.add(`${dir}/`);
  }
  return [...all];
}

function exists(path: string, docDir: string, paths: string[], names: Set<string>): boolean {
  if (!path.includes('/')) return matchesAny(path, [...names]);
  const candidates = [path, posix.join(docDir, path) + (path.endsWith('/') ? '/' : '')];
  return candidates.some((candidate) => matchesAny(posix.normalize(candidate), paths));
}

function matchesAny(pattern: string, paths: string[]): boolean {
  if (!/[<*]/.test(pattern)) return paths.includes(pattern);
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escaped.replace(/<[^>]*>|\*/g, '[^/]+')}$`);
  return paths.some((path) => regex.test(path));
}
