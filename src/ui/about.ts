/**
 * About page (issue #95): what Libell is, that it works offline, the
 * privacy promise, where the source lives, and — small and last, like
 * the footer on the main screen — the running version. Static
 * translated text; the single link opens GitHub in a new tab with
 * `noopener` — the page itself loads nothing remote (ADR 0005).
 */

import { t } from './i18n';

const REPO_URL = 'https://github.com/moggleif/libell';

/**
 * @param version the build's version string, or null when it has none —
 *   a CI build without `BUILD_VERSION` shows no version at all. Injected
 *   so both cases are testable wherever the tests run.
 */
export function createAboutSection(version: string | null = __APP_VERSION__): HTMLElement {
  const body = document.createElement('div');

  const what = document.createElement('p');
  what.className = 'menu__text';
  what.textContent = t('about.text');
  body.append(what);

  const offline = document.createElement('p');
  offline.className = 'menu__text';
  offline.textContent = t('about.offline');

  const privacy = document.createElement('p');
  privacy.className = 'menu__text';
  privacy.textContent = t('about.privacy');

  const source = document.createElement('p');
  source.className = 'menu__text';
  const link = document.createElement('a');
  link.className = 'menu__link';
  link.href = REPO_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t('about.source.link');
  source.append(document.createTextNode(`${t('about.source')} `), link);

  body.append(offline, privacy, source);

  // Last and small — reference material, not something to read first. A CI
  // build without a version shows none: better none than a wrong one.
  if (version) {
    const line = document.createElement('p');
    line.className = 'menu__text about__version';
    line.textContent = t('about.version', { v: version });
    body.append(line);
  }

  return body;
}
