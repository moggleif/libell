/**
 * About page (issue #95): what Libell is, the running version, the
 * privacy promise, and where the source lives. Static translated text;
 * the single link opens GitHub in a new tab with `noopener` — nothing
 * remote is ever loaded (ADR 0005).
 */

import { t } from './i18n';

const REPO_URL = 'https://github.com/moggleif/libell';

export function createAboutSection(): HTMLElement {
  const body = document.createElement('div');

  const what = document.createElement('p');
  what.className = 'menu__text';
  what.textContent = t('about.text');
  body.append(what);

  // A CI build without a version shows none — better none than a wrong one.
  if (__APP_VERSION__) {
    const version = document.createElement('p');
    version.className = 'menu__text menu__text--status';
    version.textContent = t('about.version', { v: __APP_VERSION__ });
    body.append(version);
  }

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

  body.append(privacy, source);
  return body;
}
