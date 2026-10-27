// The app's stylesheet goes into index.html itself (#730): a linked one holds
// up the first paint for a request of its own. The page's CSP then names each
// inlined block by its hash, so no other inline style runs (ADR 0005).
import { createHash } from 'node:crypto';

export interface Stylesheet {
  fileName: string;
  source: string;
}

export interface Inlined {
  html: string;
  /** The stylesheets now in the page, by file name: no longer needed as files. */
  inlined: string[];
  /** One CSP source per inlined block, `'sha256-…'`. */
  hashes: string[];
}

export function inlineStylesheets(html: string, base: string, sheets: Stylesheet[]): Inlined {
  const result: Inlined = { html, inlined: [], hashes: [] };
  for (const { fileName, source } of sheets) {
    const href = escapeRegExp(`${base}${fileName}`);
    const link = new RegExp(`<link rel="stylesheet"[^>]* href="${href}"[^>]*>`);
    if (!link.test(result.html)) continue;
    // A function, so a `$` in the CSS is never read as a replacement pattern.
    result.html = result.html.replace(link, () => `<style>${source}</style>`);
    result.inlined.push(fileName);
    result.hashes.push(`'sha256-${createHash('sha256').update(source).digest('base64')}'`);
  }
  return result;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function withStyleHashes(csp: string, hashes: string[]): string {
  if (hashes.length === 0) return csp;
  return csp.replace("style-src 'self'", `style-src 'self' ${hashes.join(' ')}`);
}
