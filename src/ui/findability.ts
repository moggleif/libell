/**
 * What a search engine or an AI assistant reads about Libell (#701, R61):
 * the page head and link preview (#702), `robots.txt`, `sitemap.xml` and `llms.txt`. The app draws
 * all its text with script, so these are the static words a crawler sees.
 * Built at build time by the `findability` plugin in `vite.config.ts`; the
 * text comes from the message dictionaries, in English for now.
 */
import { REPO_URL, SITE_ORIGIN } from '../domain/site';
import { LANGUAGE_NAMES, LANGUAGES } from './i18n';
import { MESSAGES } from './translations';

/** The shape Vite's `transformIndexHtml` takes, without importing Vite. */
export interface HeadTag {
  tag: string;
  attrs?: Record<string, string>;
  children?: string;
}

const en = MESSAGES.en;

/** The canonical address of the app for a build's base path. */
export function siteUrl(base: string): string {
  return `${SITE_ORIGIN}${base}`;
}

/** The app as schema.org describes it, in the language(s) a page speaks:
 * the app's own head and each language page (#703) say the same. */
export function webApplication(
  site: string,
  description: string,
  inLanguage: string | readonly string[],
): Record<string, unknown> {
  return {
    '@type': 'WebApplication',
    name: 'Libell',
    url: site,
    description,
    inLanguage,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  };
}

/** schema.org data for the app, read by search engines and AI assistants. */
export function structuredData(site: string): object {
  return {
    '@context': 'https://schema.org',
    ...webApplication(site, en['seo.description'], [...LANGUAGES]),
    browserRequirements: 'Requires a browser with JavaScript; installable as a PWA.',
    image: `${site}icons/icon-512.png`,
    license: 'https://opensource.org/licenses/MIT',
    codeRepository: REPO_URL,
  };
}

/** `<` is written as `<`, so no string can end the data block early. */
export function jsonForHtml(value: object): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

/** The preview a chat app shows for a shared link (#702), drawn by
 * `scripts/generate-icons.mjs` from `art/preview.svg`. */
const PREVIEW_IMAGE = { file: 'preview.png', width: 1200, height: 630 };

/** One `<meta>` of a link preview: Open Graph by `property`, X by `name`. */
interface PreviewMeta {
  attr: 'name' | 'property';
  key: string;
  content: string;
}

/** The link preview of a page (#702): the app's head and each language page. */
export function previewMeta(
  site: string,
  page: { title: string; description: string; url: string },
): PreviewMeta[] {
  const og = (key: string, content: string): PreviewMeta => ({ attr: 'property', key, content });
  return [
    og('og:type', 'website'),
    og('og:site_name', 'Libell'),
    og('og:title', page.title),
    og('og:description', page.description),
    og('og:url', page.url),
    og('og:image', site + PREVIEW_IMAGE.file),
    og('og:image:width', String(PREVIEW_IMAGE.width)),
    og('og:image:height', String(PREVIEW_IMAGE.height)),
    { attr: 'name', key: 'twitter:card', content: 'summary_large_image' },
  ];
}

function previewTags(site: string): HeadTag[] {
  const page = { title: en['seo.title'], description: en['seo.description'], url: site };
  return previewMeta(site, page).map(({ attr, key, content }) => ({
    tag: 'meta',
    attrs: { [attr]: key, content },
  }));
}

export function headTags(site: string): HeadTag[] {
  return [
    { tag: 'title', children: en['seo.title'] },
    { tag: 'meta', attrs: { name: 'description', content: en['seo.description'] } },
    { tag: 'link', attrs: { rel: 'canonical', href: site } },
    ...previewTags(site),
    // A data block, not a script: the CSP (ADR 0005) never runs it.
    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      children: jsonForHtml(structuredData(site)),
    },
  ];
}

/** Every crawler is welcome, AI search and AI training alike (Morgan, 2026-10-25). */
export function robotsTxt(site: string): string {
  return [
    '# Libell welcomes every crawler, AI search and AI training included.',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${site}sitemap.xml`,
    '',
  ].join('\n');
}

/** A page is an `index.html`; its address is its folder. */
function pageUrl(site: string, fileName: string): string | null {
  if (fileName !== 'index.html' && !fileName.endsWith('/index.html')) return null;
  return site + fileName.slice(0, -'index.html'.length);
}

export function sitemapXml(site: string, fileNames: readonly string[]): string {
  const urls = fileNames
    .map((fileName) => pageUrl(site, fileName))
    .filter((url): url is string => url !== null)
    .sort();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

/** The llms.txt convention: a name, a quoted summary, then plain Markdown. */
export function llmsTxt(site: string): string {
  const languages = LANGUAGES.map((lang) => `[${LANGUAGE_NAMES[lang]}](${site}${lang}/)`).join(
    ', ',
  );
  return [
    '# Libell',
    '',
    `> ${en['seo.description']}`,
    '',
    en['about.text'],
    '',
    `- ${en['about.offline']}`,
    `- ${en['about.privacy']}`,
    `- ${en['about.source']}`,
    `- Languages, each with a page about Libell: ${languages}.`,
    '',
    '## Links',
    '',
    `- [Open Libell](${site}): the app itself, in the browser or installed on the home screen`,
    `- [Source code and README](${REPO_URL}): how it works, the Sensorbox models it supports, and how to report a problem`,
    `- [Privacy policy](${site}privacy/): what Libell stores on the phone and the one thing it sends`,
    '',
  ].join('\n');
}
