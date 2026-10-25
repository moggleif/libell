/**
 * Every static page the build writes (#675, #703): the privacy policy and
 * the language pages, each in every shipped language, and the stylesheet
 * they share. `vite.config.ts` emits these files as they are.
 */
import { languagePages } from './languagePages';
import { privacyPages } from './privacyPolicy';
import { STATIC_CSS, STATIC_CSS_FILE } from './staticPage';

export function staticPages(base: string): { fileName: string; source: string }[] {
  return [
    ...privacyPages(base),
    ...languagePages(base),
    { fileName: STATIC_CSS_FILE, source: STATIC_CSS },
  ];
}
