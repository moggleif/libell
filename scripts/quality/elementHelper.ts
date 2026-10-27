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

const CREATE_BUTTON = /^\s*(?:const|let) (\w+) = (?:document\.)?createElement\('button'/;

/**
 * Every button whose next three lines make it `type = 'button'` and set its
 * text, as messages naming the file and line: `button(className, label,
 * onClick)` in `src/ui/dom.ts` builds exactly that (#735).
 */
export function findHandBuiltButtons(files: SourceFile[]): string[] {
  return files.flatMap(({ path, source }) => {
    const lines = source.split('\n');
    return lines.flatMap((line, index) => {
      const name = CREATE_BUTTON.exec(line)?.[1];
      if (!name) return [];
      const next = lines.slice(index + 1, index + 4).map((l) => l.trimStart());
      const plain = next.some((l) => l.startsWith(`${name}.type = 'button'`));
      const labelled = next.some((l) => l.startsWith(`${name}.textContent =`));
      if (!plain || !labelled) return [];
      return [
        `Button helper: ${path}:${index + 1} builds a plain labelled button by hand. ` +
          'Use button(className, label, onClick) from src/ui/dom.ts.',
      ];
    });
  });
}
