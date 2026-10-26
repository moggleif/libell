import type { Language } from './i18n';

/** Where a language's privacy policy page is served, under the app's base
 * path. Apart from the policy's text, so the app can link to it without
 * loading every language (ADR 0024). */
export function privacyPolicyPath(base: string, lang: Language): string {
  return `${base}privacy/${lang}/`;
}
