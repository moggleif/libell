import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findBypassedElementHelper, findHandBuiltButtons } from './elementHelper.ts';
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

describe('findHandBuiltButtons', () => {
  it('fails a type="button" button labelled within three lines, naming the file and line', () => {
    const source = [
      '',
      "const go = document.createElement('button');",
      "go.type = 'button';",
      "go.className = 'action';",
      'go.textContent = label;',
    ].join('\n');
    expect(findHandBuiltButtons([{ path: 'src/ui/a.ts', source }])).toEqual([
      'Button helper: src/ui/a.ts:2 builds a plain labelled button by hand. ' +
        'Use button(className, label, onClick) from src/ui/dom.ts.',
    ]);
  });

  it('accepts a submit button, and a button labelled later', () => {
    const source = [
      "const submit = createElement('button', 'action');",
      "submit.type = 'submit';",
      'submit.textContent = label;',
      "const icon = createElement('button', 'icon');",
      "icon.type = 'button';",
      'icon.append(svg);',
      "icon.title = 'x';",
      'icon.textContent = later;',
    ].join('\n');
    expect(findHandBuiltButtons([{ path: 'src/ui/a.ts', source }])).toEqual([]);
  });
});

describe('the app source', () => {
  const isUiCode = (path: string, isDir: boolean) =>
    isDir ||
    (path.endsWith('.ts') && !path.endsWith('.test.ts') && path !== join('src', 'ui', 'dom.ts'));
  const files = [...readSources('src/ui', isUiCode), ...readSources('src/app', isUiCode)];

  it('builds classed elements with createElement(tag, className) (#521)', () => {
    expect(findBypassedElementHelper(files)).toEqual([]);
  });

  it('builds plain labelled buttons with button(className, label, onClick) (#735)', () => {
    expect(findHandBuiltButtons(files)).toEqual([]);
  });
});
