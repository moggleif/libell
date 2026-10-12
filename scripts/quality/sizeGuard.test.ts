import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countLines, measureFunctions } from './functionSizes.ts';
import { checkSizes, type SizeRules } from './sizeGuard.ts';
import baseline from './size-baseline.json' with { type: 'json' };

/** Limits for new code (#475). Existing exceptions live in size-baseline.json. */
const LIMITS = { maxFunctionLines: 50, maxFileLines: 400 };

/** Language dictionaries are data, not logic, and grow with every string. */
const EXEMPT_DIRS = ['src/ui/messages'];

function productionSources(dir: string): { path: string; source: string }[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return EXEMPT_DIRS.includes(path) ? [] : productionSources(path);
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) return [];
    return [{ path, source: readFileSync(path, 'utf8') }];
  });
}

const fnLines = (n: number) => `function big() {\n${'  x();\n'.repeat(n - 2)}}\n`;

describe('measureFunctions', () => {
  it('measures declarations, arrows and methods by name, inner functions nested', () => {
    const source = [
      'export function outer(): { a: number } {',
      '  const inner = () => {',
      '    return 1;',
      '  };',
      '  return { a: inner() };',
      '}',
      'class C {',
      '  method(): void {}',
      '}',
      'const obj = { prop: function () {} };',
      '[1].map((n) => n);',
    ].join('\n');
    expect(measureFunctions(source)).toEqual([
      { name: 'outer', line: 1, lines: 6 },
      { name: 'outer > inner', line: 2, lines: 3 },
      { name: 'method', line: 8, lines: 1 },
      { name: 'prop', line: 10, lines: 1 },
      { name: '(anonymous)', line: 11, lines: 1 },
    ]);
  });

  it('ignores braces inside strings, templates and comments', () => {
    const source = 'function f() {\n  const s = "}}" + `${"{"}`; // }\n  /* { */\n}\n';
    expect(measureFunctions(source)).toEqual([{ name: 'f', line: 1, lines: 4 }]);
  });

  it('skips overload signatures, which have no body', () => {
    const source = 'function f(a: string): void;\nfunction f(a: unknown): void {}\n';
    expect(measureFunctions(source)).toEqual([{ name: 'f', line: 2, lines: 1 }]);
  });
});

describe('countLines', () => {
  it('does not count the trailing newline as a line', () => {
    expect(countLines('a\nb\n')).toBe(2);
    expect(countLines('a\nb')).toBe(2);
  });
});

describe('checkSizes', () => {
  const rules: SizeRules = {
    maxFunctionLines: 5,
    maxFileLines: 10,
    functionBaseline: {},
    fileBaseline: {},
  };

  it('accepts code within the limits', () => {
    expect(checkSizes([{ path: 'a.ts', source: fnLines(5) }], rules)).toEqual([]);
  });

  it('fails a new function over the limit, naming the file, line and function', () => {
    expect(checkSizes([{ path: 'a.ts', source: fnLines(6) }], rules)).toEqual([
      'Function too long: a.ts:1 big is 6 lines, the limit is 5. Split it up.',
    ]);
  });

  it('fails a new file over the limit', () => {
    const source = 'x();\n'.repeat(11);
    expect(checkSizes([{ path: 'a.ts', source }], rules)).toEqual([
      'File too long: a.ts is 11 lines, the limit is 10. Split it up.',
    ]);
  });

  it('lets a baseline function stay at its size but not grow', () => {
    const atBaseline = { ...rules, functionBaseline: { 'a.ts > big': 7 } };
    expect(checkSizes([{ path: 'a.ts', source: fnLines(7) }], atBaseline)).toEqual([]);
    expect(checkSizes([{ path: 'a.ts', source: fnLines(8) }], atBaseline)).toEqual([
      'Function grew: a.ts:1 big is 8 lines, its baseline is 7. Shrink it instead.',
    ]);
  });

  it('makes the baseline follow a function that shrank, so it only tightens', () => {
    const loose = { ...rules, functionBaseline: { 'a.ts > big': 9 } };
    expect(checkSizes([{ path: 'a.ts', source: fnLines(7) }], loose)).toEqual([
      'Function shrank: lower the size baseline for "a.ts > big" from 9 to 7.',
    ]);
    expect(checkSizes([{ path: 'a.ts', source: fnLines(5) }], loose)).toEqual([
      'Function now within the limit: remove "a.ts > big" from the size baseline.',
    ]);
    expect(checkSizes([{ path: 'a.ts', source: '' }], loose)).toEqual([
      'Function is gone: remove "a.ts > big" from the size baseline.',
    ]);
  });
});

describe('the app source', () => {
  it('keeps every function and file within the size limits (#475)', () => {
    const rules: SizeRules = { ...LIMITS, ...baseline };
    expect(checkSizes(productionSources('src'), rules)).toEqual([]);
  });
});
