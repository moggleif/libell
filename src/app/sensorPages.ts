/**
 * The sensor's pages, reached from the top bar's sensor icon and Help: one
 * list section and one own page per available box, or, on iOS without Web
 * Bluetooth, a guide to the Bluefy workaround (R39). Any other browser
 * without Web Bluetooth gets a page that says so and names one that works
 * (#507): never a silently broken option.
 */
import { availableBoxes, hasAvailableBox } from '../sensor/boxes';
import type { BoxDescriptor } from '../sensor/boxes';
import { createIosSensorGuidePage } from '../ui/iosSensorGuidePage';
import { createUnsupportedSensorPage } from '../ui/unsupportedSensorPage';
import { isIos } from '../ui/platform';
import {
  createSensorPage,
  type BoxListPage,
  type SensorPage,
  type SensorPageOptions,
} from '../ui/sensorPage';

export interface SensorPages {
  /** Web Bluetooth and at least one box type are available. */
  supported: boolean;
  showIosGuide: boolean;
  /** The box list with each box's own page. */
  boxListPage: BoxListPage | null;
  /** The box list, iOS's guide, or why no box can connect here, as one page. */
  sensorPage: SensorPage;
}

export function mountSensorPages(
  optionsFor: (descriptor: BoxDescriptor) => SensorPageOptions,
): SensorPages {
  const supported = hasAvailableBox();
  const showIosGuide = !supported && isIos();
  const boxListPage = supported ? createSensorPage(availableBoxes(), optionsFor) : null;
  const sensorPage =
    boxListPage ?? (showIosGuide ? createIosSensorGuidePage() : createUnsupportedSensorPage());
  document.body.append(sensorPage.element);
  // After the list: a box's own page paints on top of it when both are
  // open at once.
  if (boxListPage) document.body.append(...boxListPage.statusElements);
  return { supported, showIosGuide, boxListPage, sensorPage };
}
