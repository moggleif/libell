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
import { EXTERNAL_SENSORS } from '../sensor/boxes';
import { LANGUAGE_NAMES, LANGUAGES, translate, type Language, type MessageKey } from './i18n';

/** The day the policy's text last changed. Change it with the text. */
const POLICY_CHANGED = '2026-10-25';

const ISSUES_URL = `${REPO_URL}/issues`;

/** Where a language's page is served, under the app's base path. */
export function privacyPolicyPath(base: string, lang: Language): string {
  return `${base}privacy/${lang}/`;
}

/** Every file the build writes, by its name under the output folder: a page
 * per language, `privacy/` in English, and the pages' stylesheet. */
export function privacyPages(base: string): { fileName: string; source: string }[] {
  return [
    { fileName: 'privacy/index.html', source: renderPrivacyPage('en', base) },
    ...LANGUAGES.map((lang) => ({
      fileName: `privacy/${lang}/index.html`,
      source: renderPrivacyPage(lang, base),
    })),
    { fileName: 'privacy/privacy.css', source: PRIVACY_CSS },
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
  const boxes = EXTERNAL_SENSORS.map((box) => box.displayName).join(', ');
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

function link(href: string, label: string, lang?: Language): string {
  const hreflang = lang ? ` hreflang="${lang}" lang="${lang}"` : '';
  return `<a href="${escapeHtml(href)}"${hreflang}>${escapeHtml(label)}</a>`;
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

function languageList(base: string, current: Language): string {
  const items = LANGUAGES.filter((lang) => lang !== current).map(
    (lang) => `<li>${link(privacyPolicyPath(base, lang), LANGUAGE_NAMES[lang], lang)}</li>`,
  );
  return `<ul class="languages">\n${items.join('\n')}\n</ul>`;
}

// No script, no inline style and nothing from elsewhere: the page only
// loads its own stylesheet.
// (`frame-ancestors` is left out: a meta CSP cannot carry it, and a page with
// nothing to click is no clickjacking target.)
const CSP =
  "default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'";

/** The whole page for one language. */
export function renderPrivacyPage(lang: Language, base: string): string {
  const text = (key: MessageKey, vars?: Record<string, string>) => translate(lang, key, vars);
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="no-referrer">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(text('policy.title'))}</title>
<link rel="stylesheet" href="${base}privacy/privacy.css">
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
${languageList(base, lang)}
</main>
</body>
</html>
`;
}

/** The pages' stylesheet: the browser's own light and dark colours, so the
 * page follows the phone's theme without a colour of its own. */
const PRIVACY_CSS = `:root { color-scheme: light dark; }
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
.languages { columns: 2; padding-left: 1.2rem; }
a { color: LinkText; }
`;
