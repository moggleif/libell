/**
 * One flat dictionary per language under `./messages/`. The dictionaries are
 * plain data so a unit test can assert every language covers the same keys.
 */

import { cs } from './messages/cs';
import { da } from './messages/da';
import { de } from './messages/de';
import { en } from './messages/en';
import { es } from './messages/es';
import { fi } from './messages/fi';
import { fr } from './messages/fr';
import { hu } from './messages/hu';
import { it } from './messages/it';
import { nb } from './messages/nb';
import { nl } from './messages/nl';
import { pl } from './messages/pl';
import { pt } from './messages/pt';
import { ro } from './messages/ro';
import { sv } from './messages/sv';
import { tr } from './messages/tr';

export const MESSAGES = { en, sv, fr, es, de, nl, it, pl, pt, da, nb, fi, cs, hu, ro, tr } as const;

export type Language = keyof typeof MESSAGES;
export type MessageKey = keyof (typeof MESSAGES)['en'];

/** Each language named in itself, never through `t()`, so a Swedish reader
 * can still find "Deutsch". */
export const LANGUAGE_NAMES: Record<Language, string> = {
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
};

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

/** Also tells the page, so a screen reader reads it in that language's
 * voice (#535). The app reloads on a language change, so start-up is the
 * one place it is applied. */
export function setLanguage(lang: Language): void {
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

/** Substitutes `{name}` placeholders from `vars`. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  let text: string = MESSAGES[current][key] ?? MESSAGES.en[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
