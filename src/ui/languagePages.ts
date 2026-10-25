/**
 * The language pages (#703, R61): one static, script-free page per shipped
 * language at `<lang>/`, saying what Libell is and answering the questions
 * people ask, so a search engine or AI assistant finds and describes Libell
 * in that language. Written by the build (`vite.config.ts`) from the message
 * dictionaries, like the privacy policy. Plain strings, no DOM.
 */
import { EXTERNAL_SENSORS } from '../sensor/boxes';
import { jsonForHtml, PREVIEW_IMAGE, siteUrl } from './findability';
import { LANGUAGES, translate, type Language, type MessageKey } from './i18n';
import { privacyPolicyPath } from './privacyPolicy';
import { escapeHtml, languageList, link, staticHead } from './staticPage';

/** Where a language's page is served, under the app's base path. */
export function languagePagePath(base: string, lang: Language): string {
  return `${base}${lang}/`;
}

export function languagePages(base: string): { fileName: string; source: string }[] {
  return LANGUAGES.map((lang) => ({
    fileName: `${lang}/index.html`,
    source: renderLanguagePage(lang, base),
  }));
}

interface Question {
  q: MessageKey;
  a: MessageKey[];
}

const QUESTIONS: readonly Question[] = [
  { q: 'landing.faq.level.q', a: ['landing.faq.level.a'] },
  { q: 'landing.faq.free.q', a: ['landing.faq.free.a'] },
  { q: 'landing.faq.box.q', a: ['landing.faq.box.a'] },
  { q: 'landing.faq.offline.q', a: ['about.offline'] },
  { q: 'landing.faq.privacy.q', a: ['about.privacy'] },
];

const HOW: readonly MessageKey[] = [
  'landing.how.phone',
  'landing.how.ramps',
  'landing.how.caravan',
  'landing.how.box',
  'landing.how.app',
];

/** The supported boxes as the language lists things: "A and B". */
function boxes(lang: Language): string {
  const names = EXTERNAL_SENSORS.map((box) => box.displayName);
  return new Intl.ListFormat(lang, { type: 'conjunction' }).format(names);
}

function text(lang: Language, key: MessageKey): string {
  return translate(lang, key, { boxes: boxes(lang) });
}

function answer(lang: Language, question: Question): string {
  return question.a.map((key) => text(lang, key)).join(' ');
}

/** schema.org data: the app in this language, and its questions. */
export function pageData(lang: Language, base: string): object {
  const site = siteUrl(base);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Libell',
        url: site,
        description: text(lang, 'seo.description'),
        inLanguage: lang,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (web browser)',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
      {
        '@type': 'FAQPage',
        inLanguage: lang,
        mainEntity: QUESTIONS.map((question) => ({
          '@type': 'Question',
          name: text(lang, question.q),
          acceptedAnswer: { '@type': 'Answer', text: answer(lang, question) },
        })),
      },
    ],
  };
}

function meta(attr: 'name' | 'property', key: string, content: string): string {
  return `<meta ${attr}="${key}" content="${escapeHtml(content)}">`;
}

/** Description, canonical, the other languages and the link preview. */
function headLines(lang: Language, base: string): string[] {
  const site = siteUrl(base);
  const pageUrl = (other: Language) => `${site}${other}/`;
  const description = text(lang, 'seo.description');
  return [
    meta('name', 'description', description),
    `<link rel="canonical" href="${pageUrl(lang)}">`,
    ...LANGUAGES.map(
      (other) => `<link rel="alternate" hreflang="${other}" href="${pageUrl(other)}">`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl('en')}">`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', 'Libell'),
    meta('property', 'og:title', text(lang, 'seo.title')),
    meta('property', 'og:description', description),
    meta('property', 'og:url', pageUrl(lang)),
    meta('property', 'og:image', site + PREVIEW_IMAGE.file),
    meta('name', 'twitter:card', 'summary_large_image'),
    `<script type="application/ld+json">${jsonForHtml(pageData(lang, base))}</script>`,
  ];
}

function how(lang: Language): string {
  return [
    `<h2>${escapeHtml(text(lang, 'landing.how.h'))}</h2>`,
    ...HOW.map((key) => `<p>${escapeHtml(text(lang, key))}</p>`),
  ].join('\n');
}

function questions(lang: Language): string {
  return [
    `<h2>${escapeHtml(text(lang, 'landing.faq.h'))}</h2>`,
    ...QUESTIONS.map(
      (question) =>
        `<h3>${escapeHtml(text(lang, question.q))}</h3>\n<p>${escapeHtml(answer(lang, question))}</p>`,
    ),
  ].join('\n');
}

/** The whole page for one language. */
export function renderLanguagePage(lang: Language, base: string): string {
  return `<!doctype html>
<html lang="${lang}">
<head>
${staticHead(base, text(lang, 'seo.title'), headLines(lang, base))}
</head>
<body>
<main>
<h1>Libell</h1>
<p class="lead">${escapeHtml(text(lang, 'seo.description'))}</p>
<p class="open">${link(base, text(lang, 'policy.open'))}</p>
${how(lang)}
${questions(lang)}
<p>${link(privacyPolicyPath(base, lang), text(lang, 'policy.title'))}</p>
<h2>${escapeHtml(text(lang, 'policy.languages'))}</h2>
${languageList(lang, (other) => languagePagePath(base, other))}
</main>
</body>
</html>
`;
}
