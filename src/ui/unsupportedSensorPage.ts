/**
 * The Sensorbox page in a browser with no Web Bluetooth that is not iOS
 * (iOS has its own Bluefy guide, R39): it says why no box can be connected
 * here and which browser can, rather than leaving Help's button and the
 * page out (#507).
 */
import { createStandalonePage } from './standalonePage';
import type { SensorPage } from './sensorPage';
import { createElement } from './dom';
import { t } from './i18n';

export function createUnsupportedSensorPage(): SensorPage {
  const page = createStandalonePage(t('menu.sensorSource'));
  const reason = createElement('p', 'menu__text');
  reason.textContent = t('sensorSource.err.unsupported');
  const browser = createElement('p', 'menu__text');
  browser.textContent = t('sensorSource.unsupported.browser');
  page.body.append(reason, browser);
  return { element: page.element, isOpen: page.isOpen, attach: page.attach, open: page.open };
}
