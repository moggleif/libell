import { describe, expect, it } from 'vitest';
import { LANGUAGES, translate } from './i18n';
import { languagePagePath, languagePages, pageData, renderLanguagePage } from './languagePages';
import { escapeHtml } from './staticPage';

const SITE = 'https://libell.app/';

describe('language pages (#703)', () => {
  it('writes one page per shipped language at <lang>/', () => {
    const files = languagePages('/');
    expect(files.map((f) => f.fileName)).toEqual(LANGUAGES.map((lang) => `${lang}/index.html`));
    expect(files[0]!.source).toBe(renderLanguagePage(LANGUAGES[0]!, '/'));
    expect(languagePagePath('/libell/', 'sv')).toBe('/libell/sv/');
  });

  it.each(LANGUAGES)('says what Libell is and answers the questions in %s', (lang) => {
    const html = renderLanguagePage(lang, '/');
    expect(html).toContain(`<html lang="${lang}">`);
    expect(html).toContain(`<title>${escapeHtml(translate(lang, 'seo.title'))}</title>`);
    for (const key of [
      'seo.description',
      'landing.how.h',
      'landing.how.phone',
      'landing.how.ramps',
      'landing.how.caravan',
      'landing.how.app',
      'landing.faq.h',
      'landing.faq.level.q',
      'landing.faq.level.a',
      'landing.faq.free.q',
      'landing.faq.free.a',
      'landing.faq.box.q',
      'landing.faq.box.a',
      'landing.faq.offline.q',
      'about.offline',
      'landing.faq.privacy.q',
      'about.privacy',
    ] as const) {
      expect(html).toContain(escapeHtml(translate(lang, key)));
    }
    expect(html).not.toMatch(/\{[a-z]+\}/);
  });

  it('names the supported boxes as the language lists things', () => {
    expect(renderLanguagePage('en', '/')).toContain(
      'Libell works with EasyLevel and Xparkle RVS01.',
    );
  });

  it('opens the app, links its privacy policy and the same page in every other language', () => {
    const html = renderLanguagePage('sv', '/libell/');
    expect(html).toContain(`<a href="/libell/">${translate('sv', 'policy.open')}</a>`);
    expect(html).toContain(
      `<a href="/libell/privacy/sv/">${escapeHtml(translate('sv', 'policy.title'))}</a>`,
    );
    for (const lang of LANGUAGES.filter((l) => l !== 'sv')) {
      expect(html).toContain(`href="/libell/${lang}/" hreflang="${lang}"`);
    }
  });

  it('tells search engines its address and every language version', () => {
    const html = renderLanguagePage('de', '/');
    expect(html).toContain(`<link rel="canonical" href="${SITE}de/">`);
    for (const lang of LANGUAGES) {
      expect(html).toContain(`<link rel="alternate" hreflang="${lang}" href="${SITE}${lang}/">`);
    }
    expect(html).toContain(`<link rel="alternate" hreflang="x-default" href="${SITE}en/">`);
    expect(html).toContain(`<meta property="og:url" content="${SITE}de/">`);
    expect(html).toContain(`<meta property="og:image" content="${SITE}preview.png">`);
  });

  it('carries the app and its questions as schema.org data in the page language', () => {
    const graph = (pageData('fr', '/') as { '@graph': Record<string, unknown>[] })['@graph'];
    expect(graph[0]).toMatchObject({ '@type': 'WebApplication', inLanguage: 'fr', url: SITE });
    const faq = graph[1] as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(faq.mainEntity).toHaveLength(5);
    expect(faq.mainEntity[0]).toMatchObject({
      name: translate('fr', 'landing.faq.level.q'),
      acceptedAnswer: { text: translate('fr', 'landing.faq.level.a') },
    });
  });

  it('is inert: no runnable script, no style, the static CSP', () => {
    const html = renderLanguagePage('fr', '/');
    expect(html.match(/<script[^>]*>/g)).toEqual(['<script type="application/ld+json">']);
    expect(html).not.toMatch(/<style|\sstyle=|\son[a-z]+=/i);
    expect(html).toContain("default-src 'none'; style-src 'self'");
  });
});
