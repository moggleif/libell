/**
 * Every language's dictionary at once, for code that writes text in all of
 * them at build time (the static pages, findability) and for the tests that
 * check the dictionaries against each other. The running app never imports
 * this: it loads only its own language through `./i18n` (ADR 0024).
 */

import { fillPlaceholders, type Language, type MessageKey } from './i18n';
import type { Messages } from './messages/en';
import { ca } from './messages/ca';
import { cs } from './messages/cs';
import { da } from './messages/da';
import { de } from './messages/de';
import { en } from './messages/en';
import { es } from './messages/es';
import { et } from './messages/et';
import { fi } from './messages/fi';
import { fr } from './messages/fr';
import { hr } from './messages/hr';
import { hu } from './messages/hu';
import { is } from './messages/is';
import { it } from './messages/it';
import { lt } from './messages/lt';
import { lv } from './messages/lv';
import { nb } from './messages/nb';
import { nl } from './messages/nl';
import { pl } from './messages/pl';
import { pt } from './messages/pt';
import { ro } from './messages/ro';
import { sk } from './messages/sk';
import { sl } from './messages/sl';
import { sv } from './messages/sv';
import { tr } from './messages/tr';

export const MESSAGES = {
  en,
  sv,
  fr,
  es,
  de,
  nl,
  it,
  pl,
  pt,
  da,
  nb,
  fi,
  cs,
  hu,
  ro,
  tr,
  hr,
  sk,
  sl,
  et,
  lv,
  lt,
  ca,
  is,
} as const satisfies Record<Language, Messages>;

/** `t()` in a given language, for text built outside the running app, such
 * as the static privacy pages (#675). */
export function translate(
  lang: Language,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  return fillPlaceholders(MESSAGES[lang][key] ?? MESSAGES.en[key], vars);
}
