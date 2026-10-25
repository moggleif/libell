import { describe, expect, it } from 'vitest';
import { LANGUAGES } from './i18n';
import { escapeHtml, languageList, STATIC_CSS, STATIC_CSP, staticHead } from './staticPage';

describe('static pages (#675, #703)', () => {
  it('styles the pages with the browser’s own light and dark colours only', () => {
    expect(STATIC_CSS).toContain('color-scheme: light dark');
    expect(STATIC_CSS).not.toMatch(/#[0-9a-f]{3,8}\b|rgb|hsl/i);
  });

  it('gives every page the same inert head under the base path', () => {
    const head = staticHead('/libell/', 'A & B', ['<meta name="x" content="y">']);
    expect(head).toContain(`content="${STATIC_CSP}"`);
    expect(head).toContain('<title>A &amp; B</title>');
    expect(head).toContain('<meta name="x" content="y">');
    expect(head).toContain('<link rel="stylesheet" href="/libell/page.css">');
  });

  it('links the same page in every other language', () => {
    const list = languageList('sv', (lang) => `/x/${lang}/`);
    for (const lang of LANGUAGES.filter((l) => l !== 'sv')) {
      expect(list).toContain(`href="/x/${lang}/" hreflang="${lang}"`);
    }
    expect(list).not.toContain('/x/sv/');
  });

  it('escapes text and attributes', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
