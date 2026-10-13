/**
 * The sensor's pages, reached from the top bar's sensor icon and Help: one
 * list section and one own page per available box, or, on iOS without Web
 * Bluetooth, a guide to the Bluefy workaround (R39). Any other browser
 * without Web Bluetooth gets a page that says so and names one that works
 * (#507): never a silently broken option.
 */
import { availableExternalSensors, hasAvailableExternalSensor } from '../sensor/externalSensors';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import { createIosSensorGuidePage } from '../ui/iosSensorGuidePage';
import { createUnsupportedSensorPage } from '../ui/unsupportedSensorPage';
import { isIos } from '../ui/platform';
import {
  createSensorPage,
  type ExternalSensorPage,
  type SensorPage,
  type SensorPageOptions,
} from '../ui/sensorPage';

export interface SensorPages {
  /** Web Bluetooth and at least one box type are available. */
  supported: boolean;
  showIosGuide: boolean;
  /** The box list with each box's own page. */
  externalSensorPage: ExternalSensorPage | null;
  /** The box list, iOS's guide, or why no box can connect here, as one page. */
  sensorPage: SensorPage;
}

export function mountSensorPages(
  optionsFor: (descriptor: ExternalSensorDescriptor) => SensorPageOptions,
): SensorPages {
  const supported = hasAvailableExternalSensor();
  const showIosGuide = !supported && isIos();
  const externalSensorPage = supported
    ? createSensorPage(availableExternalSensors(), optionsFor)
    : null;
  const sensorPage =
    externalSensorPage ??
    (showIosGuide ? createIosSensorGuidePage() : createUnsupportedSensorPage());
  document.body.append(sensorPage.element);
  // After the list: a box's own page paints on top of it when both are
  // open at once.
  if (externalSensorPage) document.body.append(...externalSensorPage.statusElements);
  return { supported, showIosGuide, externalSensorPage, sensorPage };
}
