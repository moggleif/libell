/**
 * One flat dictionary per language under `./messages/`, each a file of its own
 * that start-up loads for the one language in use (ADR 0024). `t()` reads the
 * loaded dictionary; build-time code that needs every language uses
 * `./translations` instead.
 */

import type { Messages } from './messages/en';

export type Language = keyof typeof NAMES;
export type MessageKey = keyof Messages;

/** Each language named in itself, never through `t()`, so a Swedish reader
 * can still find "Deutsch". */
const NAMES = {
  sv: 'Svenska',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  nl: 'Nederlands',
  it: 'Italiano',
  pl: 'Polski',
  pt: 'Português',
  da: 'Dansk',
  nb: 'Norsk bokmål',
  fi: 'Suomi',
  cs: 'Čeština',
  hu: 'Magyar',
  ro: 'Română',
  tr: 'Türkçe',
  hr: 'Hrvatski',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  et: 'Eesti',
  lv: 'Latviešu',
  lt: 'Lietuvių',
  ca: 'Català',
  is: 'Íslenska',
} as const;

export const LANGUAGE_NAMES: Record<Language, string> = NAMES;

/** Alphabetical by native name, sorted in a fixed locale so the order is the
 * same on every phone and testable. */
export const LANGUAGES: readonly Language[] = (Object.keys(LANGUAGE_NAMES) as Language[]).sort(
  (a, b) => LANGUAGE_NAMES[a].localeCompare(LANGUAGE_NAMES[b], 'en'),
);

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** Locale subtags that mean a shipped language under another code:
 * phones report Norwegian as `no` or `nn` as well as `nb`. */
const SUBTAG_ALIASES: Record<string, Language> = { no: 'nb', nn: 'nb' };

/** The locale's language subtag decides; anything unshipped → English. */
function detectLanguage(): Language {
  const locale = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : undefined;
  const raw = locale?.split('-')[0];
  const subtag = (raw && SUBTAG_ALIASES[raw]) ?? raw;
  return isLanguage(subtag) ? subtag : 'en';
}

/** Anything not a shipped language (missing, corrupt, dropped) →
 * auto-detect. */
export function resolveLanguage(stored: unknown): Language {
  return isLanguage(stored) ? stored : detectLanguage();
}

let current: Language = resolveLanguage(null);

export function getLanguage(): Language {
  return current;
}

/** Each language's dictionary, fetched only when that language is used. */
const DICTIONARIES: Record<Language, () => Promise<Messages>> = {
  ca: () => import('./messages/ca').then((m) => m.ca),
  cs: () => import('./messages/cs').then((m) => m.cs),
  da: () => import('./messages/da').then((m) => m.da),
  de: () => import('./messages/de').then((m) => m.de),
  en: () => import('./messages/en').then((m) => m.en),
  es: () => import('./messages/es').then((m) => m.es),
  et: () => import('./messages/et').then((m) => m.et),
  fi: () => import('./messages/fi').then((m) => m.fi),
  fr: () => import('./messages/fr').then((m) => m.fr),
  hr: () => import('./messages/hr').then((m) => m.hr),
  hu: () => import('./messages/hu').then((m) => m.hu),
  is: () => import('./messages/is').then((m) => m.is),
  it: () => import('./messages/it').then((m) => m.it),
  lt: () => import('./messages/lt').then((m) => m.lt),
  lv: () => import('./messages/lv').then((m) => m.lv),
  nb: () => import('./messages/nb').then((m) => m.nb),
  nl: () => import('./messages/nl').then((m) => m.nl),
  pl: () => import('./messages/pl').then((m) => m.pl),
  pt: () => import('./messages/pt').then((m) => m.pt),
  ro: () => import('./messages/ro').then((m) => m.ro),
  sk: () => import('./messages/sk').then((m) => m.sk),
  sl: () => import('./messages/sl').then((m) => m.sl),
  sv: () => import('./messages/sv').then((m) => m.sv),
  tr: () => import('./messages/tr').then((m) => m.tr),
};

const loaded: Partial<Record<Language, Messages>> = {};

/** Fetches `lang`'s dictionary, once, so `t()` can speak it. */
export async function loadDictionary(lang: Language): Promise<void> {
  loaded[lang] ??= await DICTIONARIES[lang]();
}

/** Start-up: speak `lang` once its dictionary is in, or English when it
 * cannot load (ADR 0024). */
export async function startLanguage(
  lang: Language,
  load: (lang: Language) => Promise<void> = loadDictionary,
): Promise<void> {
  try {
    await load(lang);
    setLanguage(lang);
  } catch {
    await load('en');
    setLanguage('en');
  }
}

/** Also tells the page, so a screen reader reads it in that language's
 * voice (#535). The app reloads on a language change, so start-up is the
 * one place it is applied. */
export function setLanguage(lang: Language): void {
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

/** Substitutes `{name}` placeholders from `vars`, in the current language.
 * A dictionary that has not loaded falls back to English, then to the key. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  return fillPlaceholders(loaded[current]?.[key] ?? loaded.en?.[key] ?? key, vars);
}

/** `text` with each `{name}` replaced by `vars[name]`. */
export function fillPlaceholders(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  let filled = text;
  for (const [name, value] of Object.entries(vars)) {
    filled = filled.replaceAll(`{${name}}`, String(value));
  }
  return filled;
}
