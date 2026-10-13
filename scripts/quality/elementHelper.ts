import type { SourceFile } from './sourceFiles.ts';

const CREATE = /^\s*(?:const|let) (\w+) = document\.createElement\(/;

/**
 * Every `document.createElement` whose very next line sets the element's
 * class, as messages naming the file and line: `createElement(tag, className)`
 * in `src/ui/dom.ts` says the same in one line (#521).
 */
export function findBypassedElementHelper(files: SourceFile[]): string[] {
  return files.flatMap(({ path, source }) => {
    const lines = source.split('\n');
    return lines.flatMap((line, index) => {
      const name = CREATE.exec(line)?.[1];
      const next = lines[index + 1] ?? '';
      if (!name || !next.trimStart().startsWith(`${name}.className =`)) return [];
      return [
        `Element helper: ${path}:${index + 1} sets ${name}'s class on the next line. ` +
          'Use createElement(tag, className) from src/ui/dom.ts.',
      ];
    });
  });
}
