/**
 * The sensor's pages, reached from the top bar's sensor icon: one list
 * section and one own page per available box, or, on iOS without Web
 * Bluetooth, a guide to the Bluefy workaround (R39). Without either, none:
 * never a silently broken option.
 */
import { availableExternalSensors, hasAvailableExternalSensor } from '../sensor/externalSensors';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import { createIosSensorGuidePage } from '../ui/iosSensorGuidePage';
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
  /** The box list, or iOS's guide, as one page. */
  sensorPage: SensorPage | null;
}

export function mountSensorPages(
  optionsFor: (descriptor: ExternalSensorDescriptor) => SensorPageOptions,
): SensorPages {
  const supported = hasAvailableExternalSensor();
  const showIosGuide = !supported && isIos();
  const externalSensorPage = supported
    ? createSensorPage(availableExternalSensors(), optionsFor)
    : null;
  const sensorPage = externalSensorPage ?? (showIosGuide ? createIosSensorGuidePage() : null);
  if (sensorPage) document.body.append(sensorPage.element);
  // After the list: a box's own page paints on top of it when both are
  // open at once.
  if (externalSensorPage) document.body.append(...externalSensorPage.statusElements);
  return { supported, showIosGuide, externalSensorPage, sensorPage };
}
