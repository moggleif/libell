import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findBypassedElementHelper } from './elementHelper.ts';
import { readSources } from './sourceFiles.ts';

describe('findBypassedElementHelper', () => {
  it('fails an element whose class is set on the next line, naming the file and line', () => {
    const source = "\nconst row = document.createElement('div');\nrow.className = 'row';";
    expect(findBypassedElementHelper([{ path: 'src/ui/a.ts', source }])).toEqual([
      "Element helper: src/ui/a.ts:2 sets row's class on the next line. " +
        'Use createElement(tag, className) from src/ui/dom.ts.',
    ]);
  });

  it('accepts an element without a class, or with its class set later', () => {
    const source = [
      "const plain = document.createElement('div');",
      'plain.append(child);',
      "const button = document.createElement('button');",
      "button.type = 'button';",
      "button.className = 'action';",
    ].join('\n');
    expect(findBypassedElementHelper([{ path: 'src/ui/a.ts', source }])).toEqual([]);
  });
});

describe('the app source', () => {
  it('builds classed elements with createElement(tag, className) (#521)', () => {
    const isUiCode = (path: string, isDir: boolean) =>
      isDir ||
      (path.endsWith('.ts') && !path.endsWith('.test.ts') && path !== join('src', 'ui', 'dom.ts'));
    const files = [...readSources('src/ui', isUiCode), ...readSources('src/app', isUiCode)];
    expect(findBypassedElementHelper(files)).toEqual([]);
  });
});
