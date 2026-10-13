/**
 * About page. The single link opens GitHub in a new tab with `noopener`;
 * the page itself loads nothing remote (ADR 0005).
 */

import { t } from './i18n';
import { createElement } from './dom';

const REPO_URL = 'https://github.com/moggleif/libell';

/**
 * @param version null for a CI build without `BUILD_VERSION`; injected so
 *   both cases are testable.
 */
export function createAboutSection(version: string | null = __APP_VERSION__): HTMLElement {
  const body = document.createElement('div');

  const what = createElement('p', 'menu__text');
  what.textContent = t('about.text');
  body.append(what);

  const offline = createElement('p', 'menu__text');
  offline.textContent = t('about.offline');

  const privacy = createElement('p', 'menu__text');
  privacy.textContent = t('about.privacy');

  const source = createElement('p', 'menu__text');
  const link = createElement('a', 'menu__link');
  link.href = REPO_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t('about.source.link');
  source.append(document.createTextNode(`${t('about.source')} `), link);

  body.append(offline, privacy, source);

  // A build without a version shows none: better none than a wrong one.
  if (version) {
    const line = createElement('p', 'menu__text about__version');
    line.textContent = t('about.version', { v: version });
    body.append(line);
  }

  return body;
}
