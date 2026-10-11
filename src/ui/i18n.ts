/**
 * Minimal i18n layer (issue #42, extended to five languages in #178): one
 * flat dictionary per language, keyed by message id, each in its own module
 * under `./messages/` (#377). Language comes from a stored override when
 * present, otherwise from `navigator.language` (the locale's language subtag
 * picks the dictionary; anything we don't ship → English). The dictionaries
 * are plain data so a unit test can assert every language covers the same
 * keys.
 */

import { de } from './messages/de';
import { en } from './messages/en';
import { es } from './messages/es';
import { fr } from './messages/fr';
import { sv } from './messages/sv';

export const MESSAGES = { en, sv, fr, es, de } as const;

export type Language = keyof typeof MESSAGES;
export type MessageKey = keyof (typeof MESSAGES)['en'];

/** Each language named in itself — a picker always names a language in its
 * own language, never translated through `t()`, so a Swedish reader can
 * still find "Deutsch" and vice versa. Typed against `Language`, so a new
 * dictionary cannot ship without a name here. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  sv: 'Svenska',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
};

/** Every language Libell ships, in the order the Language picker lists them:
 * alphabetical by the name each is shown under. Derived rather than written
 * out, so a new dictionary lands in the right place on its own; sorted in a
 * fixed locale rather than the viewer's, so the list reads the same on every
 * phone and the order is testable. "Automatic" is deliberately not in here —
 * `settingsPanel.ts` pins it above this list, never sorted into it. */
export const LANGUAGES: readonly Language[] = (Object.keys(LANGUAGE_NAMES) as Language[]).sort(
  (a, b) => LANGUAGE_NAMES[a].localeCompare(LANGUAGE_NAMES[b], 'en'),
);

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** The locale's language subtag decides — 'de-AT', 'de' and 'DE' all pick
 * German; a region we ship no dictionary for falls back to English. */
function detectLanguage(): Language {
  const locale = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : undefined;
  const subtag = locale?.split('-')[0];
  return isLanguage(subtag) ? subtag : 'en';
}

/** Stored override, validated against the shipped languages; anything else
 * (missing, corrupt, a language we dropped) → auto-detect. */
export function resolveLanguage(stored: unknown): Language {
  return isLanguage(stored) ? stored : detectLanguage();
}

let current: Language = resolveLanguage(null);

export function getLanguage(): Language {
  return current;
}

export function setLanguage(lang: Language): void {
  current = lang;
}

/** Look up a message, substituting `{name}` placeholders from `vars`. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  let text: string = MESSAGES[current][key] ?? MESSAGES.en[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
