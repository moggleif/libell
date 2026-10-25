/**
 * What a search engine or an AI assistant reads about Libell (#701, R61):
 * the page head, `robots.txt`, `sitemap.xml` and `llms.txt`. The app draws
 * all its text with script, so these are the static words a crawler sees.
 * Built at build time by the `findability` plugin in `vite.config.ts`; the
 * text comes from the message dictionaries, in English for now.
 */
import { REPO_URL, SITE_ORIGIN } from '../domain/site';
import { LANGUAGE_NAMES, LANGUAGES, MESSAGES } from './i18n';

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

/** schema.org data for the app, read by search engines and AI assistants. */
export function structuredData(site: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Libell',
    url: site,
    description: en['seo.description'],
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires a browser with JavaScript; installable as a PWA.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    inLanguage: [...LANGUAGES],
    image: `${site}icons/icon-512.png`,
    license: 'https://opensource.org/licenses/MIT',
    codeRepository: REPO_URL,
  };
}

/** `<` is written as `<`, so no string can end the data block early. */
function jsonForHtml(value: object): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

export function headTags(site: string): HeadTag[] {
  return [
    { tag: 'title', children: en['seo.title'] },
    { tag: 'meta', attrs: { name: 'description', content: en['seo.description'] } },
    { tag: 'link', attrs: { rel: 'canonical', href: site } },
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
  const languages = LANGUAGES.map((lang) => `${LANGUAGE_NAMES[lang]} (${lang})`).join(', ');
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
    `- Languages: ${languages}.`,
    '',
    '## Links',
    '',
    `- [Open Libell](${site}): the app itself, in the browser or installed on the home screen`,
    `- [Source code and README](${REPO_URL}): how it works, the Sensorbox models it supports, and how to report a problem`,
    '',
  ].join('\n');
}
