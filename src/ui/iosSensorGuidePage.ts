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
import { t, type MessageKey } from './i18n';
import { externalLink, paragraph } from './dom';

const BLUEFY_APP_STORE_SEARCH = 'https://apps.apple.com/search?term=bluefy';

export function createIosSensorGuidePage(): SensorPage {
  const page: StandalonePage = createStandalonePage(t('menu.sensorSource'));

  const text = (key: MessageKey) => paragraph('menu__text', t(key));
  page.body.append(
    text('sensorSource.ios.intro'),
    text('sensorSource.ios.step1'),
    text('sensorSource.ios.step2'),
    text('sensorSource.ios.step3'),
    text('sensorSource.ios.step4'),
    externalLink(BLUEFY_APP_STORE_SEARCH, t('sensorSource.ios.bluefyLink')),
    text('sensorSource.ios.note'),
  );

  return {
    element: page.element,
    isOpen: page.isOpen,
    attach: page.attach,
    open: page.open,
  };
}
