/**
 * The privacy policy (#675): one static, script-free page per shipped
 * language at `privacy/<lang>/`, and `privacy/` in English with the list of
 * languages. The build writes them (`vite.config.ts`) from the message
 * dictionaries, so the policy says what the app's own texts say and exists
 * in every language. Plain strings, no DOM: this runs in the build, not in
 * the app.
 */
import { REPO_URL } from '../domain/site';
import { COUNTER_ORIGIN } from '../domain/usage';
import { boxNames } from './boxNames';
import { LANGUAGES, translate, type Language, type MessageKey } from './i18n';
import { escapeHtml, languageList, link, staticHead } from './staticPage';

/** The day the policy's text last changed. Change it with the text. */
const POLICY_CHANGED = '2026-10-25';

const ISSUES_URL = `${REPO_URL}/issues`;

/** Where a language's page is served, under the app's base path. */
export function privacyPolicyPath(base: string, lang: Language): string {
  return `${base}privacy/${lang}/`;
}

/** Every file the build writes, by its name under the output folder: a page
 * per language and `privacy/` in English. */
export function privacyPages(base: string): { fileName: string; source: string }[] {
  return [
    { fileName: 'privacy/index.html', source: renderPrivacyPage('en', base) },
    ...LANGUAGES.map((lang) => ({
      fileName: `privacy/${lang}/index.html`,
      source: renderPrivacyPage(lang, base),
    })),
  ];
}

/** A section: an optional heading, then paragraphs, some with a small
 * heading of their own like the app's counting block. */
interface Section {
  heading?: MessageKey;
  paragraphs: (string | [subheading: string, text: string])[];
}

function sections(lang: Language): Section[] {
  const text = (key: MessageKey, vars?: Record<string, string>) => translate(lang, key, vars);
  const where = { help: text('bottombar.help'), tab: text('menu.privacy.tab') };
  const boxes = boxNames(lang, 'disjunction');
  return [
    { paragraphs: [text('policy.intro')] },
    {
      heading: 'policy.stored.h',
      paragraphs: [text('policy.stored'), text('policy.stored.delete', where)],
    },
    { heading: 'policy.sensors.h', paragraphs: [text('policy.sensors')] },
    {
      heading: 'counting.title',
      paragraphs: [
        text('policy.counting'),
        [text('counting.sent.h'), text('counting.sent', { boxes })],
        [text('counting.notSent.h'), text('counting.notSent')],
        text('policy.counting.ip'),
        `${text('policy.counting.change', where)} ${text('counting.gpc')}`,
        text('policy.counting.basis'),
      ],
    },
    {
      heading: 'policy.shared.h',
      paragraphs: [
        text('policy.shared.feedback', { help: where.help, feedback: text('menu.feedback') }),
        text('policy.shared.vehicle', { share: text('settings.shareVehicle') }),
      ],
    },
    { heading: 'policy.site.h', paragraphs: [text('policy.site')] },
    { heading: 'policy.owner.h', paragraphs: [text('policy.owner')] },
    { heading: 'policy.questions.h', paragraphs: [text('policy.questions')] },
  ];
}

function renderParagraph(paragraph: Section['paragraphs'][number]): string {
  if (typeof paragraph === 'string') return `<p>${escapeHtml(paragraph)}</p>`;
  const [subheading, text] = paragraph;
  return `<h3>${escapeHtml(subheading)}</h3>\n<p>${escapeHtml(text)}</p>`;
}

function renderSection(lang: Language, section: Section): string {
  const heading = section.heading
    ? [`<h2>${escapeHtml(translate(lang, section.heading))}</h2>`]
    : [];
  return [...heading, ...section.paragraphs.map(renderParagraph)].join('\n');
}

function changedDate(lang: Language): string {
  // Libell's English is British ("recognise"), so its dates are too.
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : lang, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${POLICY_CHANGED}T12:00:00Z`));
}

/** The whole page for one language. */
export function renderPrivacyPage(lang: Language, base: string): string {
  const text = (key: MessageKey, vars?: Record<string, string>) => translate(lang, key, vars);
  return `<!doctype html>
<html lang="${lang}">
<head>
${staticHead(base, text('policy.title'))}
</head>
<body>
<main>
<h1>${escapeHtml(text('policy.title'))}</h1>
<p class="changed">${escapeHtml(text('policy.changed', { date: changedDate(lang) }))}</p>
${sections(lang)
  .map((section) => renderSection(lang, section))
  .join('\n')}
<p>${link(ISSUES_URL, text('policy.questions.link'))} · ${link(COUNTER_ORIGIN, text('counting.dashboard'))}</p>
<p>${link(base, text('policy.open'))}</p>
<h2>${escapeHtml(text('policy.languages'))}</h2>
${languageList(lang, (other) => privacyPolicyPath(base, other))}
</main>
</body>
</html>
`;
}
