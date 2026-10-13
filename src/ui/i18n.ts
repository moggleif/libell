/**
 * One flat dictionary per language under `./messages/`. The dictionaries are
 * plain data so a unit test can assert every language covers the same keys.
 */

import { de } from './messages/de';
import { en } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { sv } from './messages/sv';

export const MESSAGES = { en, sv, fr, es, de } as const;

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
};

/** Alphabetical by native name, sorted in a fixed locale so the order is the
 * same on every phone and testable. */
export const LANGUAGES: readonly Language[] = (Object.keys(LANGUAGE_NAMES) as Language[]).sort(
  (a, b) => LANGUAGE_NAMES[a].localeCompare(LANGUAGE_NAMES[b], 'en'),
);

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** The locale's language subtag decides; anything unshipped → English. */
function detectLanguage(): Language {
  const locale = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : undefined;
  const subtag = locale?.split('-')[0];
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
