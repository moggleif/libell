/**
 * The language pages (#703, R61): one static, script-free page per shipped
 * language at `<lang>/`, saying what Libell is and answering the questions
 * people ask, so a search engine or AI assistant finds and describes Libell
 * in that language. Written by the build (`vite.config.ts`) from the message
 * dictionaries, like the privacy policy. Plain strings, no DOM.
 */
import { boxNames } from './boxNames';
import { jsonForHtml, previewMeta, siteUrl, webApplication } from './findability';
import { LANGUAGES, type Language, type MessageKey } from './i18n';
import { translate } from './translations';
import { privacyPolicyPath } from './privacyPolicyPath';
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

function text(lang: Language, key: MessageKey): string {
  return translate(lang, key, { boxes: boxNames(lang) });
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
      webApplication(site, text(lang, 'seo.description'), lang),
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
  const preview = { title: text(lang, 'seo.title'), description, url: pageUrl(lang) };
  return [
    meta('name', 'description', description),
    `<link rel="canonical" href="${pageUrl(lang)}">`,
    ...LANGUAGES.map(
      (other) => `<link rel="alternate" hreflang="${other}" href="${pageUrl(other)}">`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl('en')}">`,
    ...previewMeta(site, preview).map(({ attr, key, content }) => meta(attr, key, content)),
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
