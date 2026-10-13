/**
 * External sensor page on iOS without Web Bluetooth (R39). WebKit has no
 * Web Bluetooth, so this explains the Bluefy workaround: inside Bluefy the
 * ordinary connect flow works unchanged. Long form:
 * docs/ios-easylevel-bluefy-guide.md.
 *
 * Its own page rather than a branch in `sensorSourceSection.ts`: none of
 * that logic can run without `navigator.bluetooth`.
 */
import { createStandalonePage, type StandalonePage } from './standalonePage';
import type { SensorPage } from './sensorPage';
import { t } from './i18n';
import { createElement } from './dom';

const BLUEFY_APP_STORE_SEARCH = 'https://apps.apple.com/search?term=bluefy';

export function createIosSensorGuidePage(): SensorPage {
  const page: StandalonePage = createStandalonePage(t('menu.sensorSource'));

  const intro = createElement('p', 'menu__text');
  intro.textContent = t('sensorSource.ios.intro');

  const step1 = createElement('p', 'menu__text');
  step1.textContent = t('sensorSource.ios.step1');
  const step2 = createElement('p', 'menu__text');
  step2.textContent = t('sensorSource.ios.step2');
  const step3 = createElement('p', 'menu__text');
  step3.textContent = t('sensorSource.ios.step3');
  const step4 = createElement('p', 'menu__text');
  step4.textContent = t('sensorSource.ios.step4');

  const link = createElement('a', 'menu__link');
  link.href = BLUEFY_APP_STORE_SEARCH;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t('sensorSource.ios.bluefyLink');

  const note = createElement('p', 'menu__text');
  note.textContent = t('sensorSource.ios.note');

  page.body.append(intro, step1, step2, step3, step4, link, note);

  return {
    element: page.element,
    isOpen: page.isOpen,
    attach: page.attach,
    open: page.open,
  };
}
