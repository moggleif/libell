import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { inlineStylesheets, withStyleHashes } from './inlineStylesheets.ts';

const CSS = 'body{color:red}';
const HTML =
  '<head>\n<link rel="modulepreload" crossorigin href="/x/assets/a.js">\n' +
  '<link rel="stylesheet" crossorigin href="/x/assets/index-1.css">\n</head>';
const sha = `'sha256-${createHash('sha256').update(CSS).digest('base64')}'`;

describe('inlineStylesheets (#730)', () => {
  it('puts a linked stylesheet in the page, so the first paint waits for no request', () => {
    const result = inlineStylesheets(HTML, '/x/', [
      { fileName: 'assets/index-1.css', source: CSS },
    ]);
    expect(result.html).toContain(`<style>${CSS}</style>`);
    expect(result.html).not.toContain('index-1.css');
    expect(result.html).toContain('<link rel="modulepreload" crossorigin href="/x/assets/a.js">');
    expect(result.inlined).toEqual(['assets/index-1.css']);
    expect(result.hashes).toEqual([sha]);
  });

  it('leaves a stylesheet the page does not link', () => {
    const result = inlineStylesheets(HTML, '/x/', [{ fileName: 'assets/other.css', source: CSS }]);
    expect(result.html).toBe(HTML);
    expect(result.inlined).toEqual([]);
    expect(result.hashes).toEqual([]);
  });
});

describe('withStyleHashes (#730)', () => {
  it('lets exactly the inlined styles run, and nothing else inline', () => {
    const csp = "default-src 'self'; style-src 'self'; img-src 'self'";
    expect(withStyleHashes(csp, [sha])).toBe(
      `default-src 'self'; style-src 'self' ${sha}; img-src 'self'`,
    );
    expect(withStyleHashes(csp, [])).toBe(csp);
  });
});
