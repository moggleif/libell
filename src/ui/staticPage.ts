/**
 * What the static pages share (#675, #703): the privacy policy and the
 * language pages are plain HTML the build writes, with no script and one
 * stylesheet of their own. Plain strings, no DOM: this runs in the build.
 */
import { LANGUAGE_NAMES, LANGUAGES, type Language } from './i18n';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/** Every text and attribute goes through here: the dictionaries are ours,
 * but the page must stay inert whatever a translation contains. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ESCAPES[c] ?? c);
}

export function link(href: string, label: string, lang?: Language): string {
  const hreflang = lang ? ` hreflang="${lang}" lang="${lang}"` : '';
  return `<a href="${escapeHtml(href)}"${hreflang}>${escapeHtml(label)}</a>`;
}

/** Links to the same page in every other language. */
export function languageList(current: Language, pathOf: (lang: Language) => string): string {
  const items = LANGUAGES.filter((lang) => lang !== current).map(
    (lang) => `<li>${link(pathOf(lang), LANGUAGE_NAMES[lang], lang)}</li>`,
  );
  return `<ul class="languages">\n${items.join('\n')}\n</ul>`;
}

// No script, no inline style and nothing from elsewhere: a page only loads
// its own stylesheet and icon (and, for a link preview, its image).
// `connect-src 'self'` lets Lighthouse read /robots.txt from inside the page;
// with no script, nothing else can fetch (#730).
// (`frame-ancestors` is left out: a meta CSP cannot carry it, and a page with
// nothing to click is no clickjacking target.)
export const STATIC_CSP =
  "default-src 'none'; style-src 'self'; img-src 'self'; connect-src 'self'; " +
  "base-uri 'none'; form-action 'none'";

/** Where the stylesheet is written, under the base path. */
export const STATIC_CSS_FILE = 'page.css';

/** The head every static page shares, then its own lines. */
export function staticHead(base: string, title: string, extra: readonly string[] = []): string {
  return [
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${STATIC_CSP}">`,
    '<meta name="referrer" content="no-referrer">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(title)}</title>`,
    ...extra,
    `<link rel="stylesheet" href="${base}${STATIC_CSS_FILE}">`,
    // Named, or the browser asks for /favicon.ico and logs the 404 (#730).
    `<link rel="icon" href="${base}icons/icon.svg" type="image/svg+xml">`,
  ].join('\n');
}

/** The browser's own light and dark colours, so a page follows the phone's
 * theme without a colour of its own. */
export const STATIC_CSS = `:root { color-scheme: light dark; }
body {
  margin: 0;
  background: Canvas;
  color: CanvasText;
  font: 1rem/1.5 system-ui, sans-serif;
}
main { max-width: 40rem; margin: 0 auto; padding: 16px; }
h1 { font-size: 1.6rem; line-height: 1.2; }
h2 { font-size: 1.2rem; margin-top: 2rem; }
h3 { font-size: 1rem; margin-bottom: 0; }
h3 + p { margin-top: 0.25rem; }
.changed { opacity: 0.75; }
.lead { font-size: 1.15rem; }
.open { font-size: 1.15rem; font-weight: 700; }
.languages { columns: 2; padding-left: 1.2rem; }
a { color: LinkText; }
`;
