// @vitest-environment happy-dom
// Pins (#709) of what the findability head, the language pages, the privacy
// policy and the counting explanation say, in every shipped language —
// written before their schema.org data, link preview and box names are
// built in one place, so the move cannot change any of it. A JSON-LD block
// is compared as data with its keys sorted, since key order means nothing
// to a reader of schema.org.
import { describe, expect, it } from 'vitest';
import { createCountingExplanation } from './countingSection';
import { headTags, llmsTxt, structuredData } from './findability';
import { LANGUAGES, setLanguage } from './i18n';
import { renderLanguagePage } from './languagePages';
import { renderPrivacyPage } from './privacyPolicy';

const SITE = 'https://libell.app/';

function sortedKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedKeys);
  if (value === null || typeof value !== 'object') return value;
  const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries.map(([key, item]) => [key, sortedKeys(item)]));
}

function canonicalJson(json: string): string {
  return JSON.stringify(sortedKeys(JSON.parse(json)), null, 2);
}

/** A page with its JSON-LD block written out as sorted, indented data. */
function readable(html: string): string {
  return html.replace(
    /(<script type="application\/ld\+json">)(.*?)(<\/script>)/s,
    (_, open: string, json: string, close: string) => `${open}\n${canonicalJson(json)}\n${close}`,
  );
}

describe('the app head and llms.txt (#701, #702)', () => {
  it('keeps every tag and the schema.org data', () => {
    const tags = headTags(SITE).map((tag) =>
      tag.attrs?.type === 'application/ld+json'
        ? { ...tag, children: canonicalJson(tag.children!) }
        : tag,
    );
    expect(tags).toMatchSnapshot();
    expect(sortedKeys(structuredData(SITE))).toMatchSnapshot();
  });

  it('keeps llms.txt', () => {
    expect(llmsTxt(SITE)).toMatchSnapshot();
  });
});

describe.each(LANGUAGES)('the static pages in %s', (lang) => {
  it('keeps the language page', () => {
    expect(readable(renderLanguagePage(lang, '/'))).toMatchSnapshot();
  });

  it('keeps the privacy policy', () => {
    expect(renderPrivacyPage(lang, '/')).toMatchSnapshot();
  });

  it('keeps the counting explanation in both places', () => {
    setLanguage(lang);
    for (const place of ['choice', 'privacy'] as const)
      expect(createCountingExplanation(place).map((part) => part.textContent)).toMatchSnapshot(
        place,
      );
  });
});
