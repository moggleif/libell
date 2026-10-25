import { describe, expect, it } from 'vitest';
import { LANGUAGES, MESSAGES } from './i18n';
import { headTags, llmsTxt, robotsTxt, sitemapXml, siteUrl, structuredData } from './findability';

const SITE = 'https://libell.app/';

describe('siteUrl (#701)', () => {
  it('is the origin at the root of libell.app', () => {
    expect(siteUrl('/')).toBe(SITE);
  });

  it('keeps a base path the deploy passes', () => {
    expect(siteUrl('/libell/')).toBe('https://libell.app/libell/');
  });
});

describe('headTags (#701)', () => {
  const tags = headTags(SITE);
  const meta = (name: string) => tags.find((tag) => tag.attrs?.name === name);

  it('gives the page its English title and description from the dictionary', () => {
    expect(tags.find((tag) => tag.tag === 'title')?.children).toBe(MESSAGES.en['seo.title']);
    expect(meta('description')?.attrs?.content).toBe(MESSAGES.en['seo.description']);
  });

  it('names the canonical address', () => {
    const canonical = tags.find((tag) => tag.attrs?.rel === 'canonical');
    expect(canonical?.attrs?.href).toBe(SITE);
  });

  it('gives a shared link a preview: name, description, address and image (#702)', () => {
    const og = (property: string) =>
      tags.find((tag) => tag.attrs?.property === property)?.attrs?.content;
    expect(og('og:type')).toBe('website');
    expect(og('og:site_name')).toBe('Libell');
    expect(og('og:title')).toBe(MESSAGES.en['seo.title']);
    expect(og('og:description')).toBe(MESSAGES.en['seo.description']);
    expect(og('og:url')).toBe(SITE);
    expect(og('og:image')).toBe(`${SITE}preview.png`);
    expect(og('og:image:width')).toBe('1200');
    expect(og('og:image:height')).toBe('630');
    expect(meta('twitter:card')?.attrs?.content).toBe('summary_large_image');
  });

  it('carries the structured data as a data block, not a script the CSP would run', () => {
    const block = tags.find((tag) => tag.tag === 'script');
    expect(block?.attrs?.type).toBe('application/ld+json');
    expect(JSON.parse(String(block?.children))).toEqual(structuredData(SITE));
  });
});

describe('structuredData (#701)', () => {
  const data = structuredData(SITE) as Record<string, unknown>;

  it('describes Libell as a free web app in every shipped language', () => {
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('WebApplication');
    expect(data.name).toBe('Libell');
    expect(data.url).toBe(SITE);
    expect(data.description).toBe(MESSAGES.en['seo.description']);
    expect(data.isAccessibleForFree).toBe(true);
    expect(data.offers).toMatchObject({ price: '0' });
    expect(data.inLanguage).toEqual([...LANGUAGES]);
  });

  it('cannot close the block it sits in, whatever a string holds', () => {
    const block = headTags(SITE).find((tag) => tag.tag === 'script');
    expect(String(block?.children)).not.toMatch(/</);
  });
});

describe('robotsTxt (#701)', () => {
  const robots = robotsTxt(SITE);

  it('lets every crawler in, AI search and AI training alike', () => {
    expect(robots).toMatch(/^User-agent: \*\nAllow: \/$/m);
    expect(robots).not.toMatch(/Disallow/);
  });

  it('points to the sitemap', () => {
    expect(robots).toContain(`Sitemap: ${SITE}sitemap.xml`);
  });
});

describe('sitemapXml (#701)', () => {
  it('lists the canonical address of every page the build writes', () => {
    const xml = sitemapXml(SITE, ['index.html', 'privacy/sv/index.html', 'privacy/index.html']);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([SITE, `${SITE}privacy/`, `${SITE}privacy/sv/`]);
  });

  it('leaves out files that are not pages', () => {
    const xml = sitemapXml(SITE, ['index.html', 'assets/app.js', 'icons/icon.svg']);
    expect([...xml.matchAll(/<loc>/g)]).toHaveLength(1);
  });
});

describe('llmsTxt (#701)', () => {
  const text = llmsTxt(SITE);

  it('opens with the name and the one-line summary, as llms.txt expects', () => {
    expect(text.startsWith(`# Libell\n\n> ${MESSAGES.en['seo.description']}\n`)).toBe(true);
  });

  it('says what the app says about itself and links to it and its source', () => {
    expect(text).toContain(MESSAGES.en['about.text']);
    expect(text).toContain(MESSAGES.en['about.privacy']);
    expect(text).toContain(`(${SITE})`);
    expect(text).toContain('(https://github.com/moggleif/libell)');
  });

  it('names every shipped language', () => {
    for (const lang of LANGUAGES) expect(text).toContain(lang);
  });
});
