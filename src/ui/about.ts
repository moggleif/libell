/**
 * About page. The single link opens GitHub in a new tab with `noopener`;
 * the page itself loads nothing remote (ADR 0005).
 */

import { REPO_URL } from '../domain/site';
import { t } from './i18n';
import { createElement, externalLink, paragraph } from './dom';

/**
 * @param version null for a CI build without `BUILD_VERSION`; injected so
 *   both cases are testable.
 */
export function createAboutSection(version: string | null = __APP_VERSION__): HTMLElement {
  const body = document.createElement('div');

  const what = paragraph('menu__text', t('about.text'));
  body.append(what);

  const offline = paragraph('menu__text', t('about.offline'));
  const privacy = paragraph('menu__text', t('about.privacy'));

  const source = createElement('p', 'menu__text');
  source.append(
    document.createTextNode(`${t('about.source')} `),
    externalLink(REPO_URL, t('about.source.link')),
  );

  body.append(offline, privacy, source);

  // A build without a version shows none: better none than a wrong one.
  if (version) {
    body.append(paragraph('menu__text about__version', t('about.version', { v: version })));
  }

  return body;
}
