/**
 * External sensor page shown on iOS when Web Bluetooth is unsupported
 * (regular Safari) — R39. Apple has no plans to add Web Bluetooth to
 * WebKit, so unlike other unsupported browsers this page is never hidden
 * outright there: it explains the Bluefy workaround instead, since Bluefy
 * (a third-party Web Bluetooth browser) makes the ordinary
 * `sensorSourceSection.ts` connect flow work completely unchanged once
 * Libell is opened inside it. See docs/ios-easylevel-bluefy-guide.md for
 * the long-form version of this same guide.
 *
 * Deliberately its own page rather than a branch inside
 * `sensorSourceSection.ts`: none of that page's connect/health/install
 * logic can ever run here (there is no `navigator.bluetooth` to drive it),
 * so mixing the two would mean carrying dead code paths for a state this
 * page never reaches.
 */
import { createStandalonePage, type StandalonePage } from './standalonePage';
import type { SensorPage } from './sensorPage';
import { t } from './i18n';

const BLUEFY_APP_STORE_SEARCH = 'https://apps.apple.com/search?term=bluefy';

export function createIosSensorGuidePage(): SensorPage {
  const page: StandalonePage = createStandalonePage(t('menu.sensorSource'));

  const intro = document.createElement('p');
  intro.className = 'menu__text';
  intro.textContent = t('sensorSource.ios.intro');

  const step1 = document.createElement('p');
  step1.className = 'menu__text';
  step1.textContent = t('sensorSource.ios.step1');
  const step2 = document.createElement('p');
  step2.className = 'menu__text';
  step2.textContent = t('sensorSource.ios.step2');
  const step3 = document.createElement('p');
  step3.className = 'menu__text';
  step3.textContent = t('sensorSource.ios.step3');
  const step4 = document.createElement('p');
  step4.className = 'menu__text';
  step4.textContent = t('sensorSource.ios.step4');

  const link = document.createElement('a');
  link.className = 'menu__link';
  link.href = BLUEFY_APP_STORE_SEARCH;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t('sensorSource.ios.bluefyLink');

  const note = document.createElement('p');
  note.className = 'menu__text';
  note.textContent = t('sensorSource.ios.note');

  page.body.append(intro, step1, step2, step3, step4, link, note);

  return {
    element: page.element,
    isOpen: page.isOpen,
    attach: page.attach,
    open: page.open,
  };
}
