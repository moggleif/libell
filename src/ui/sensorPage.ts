/**
 * External sensor page (screen-cleanup follow-up): reached only from the
 * top-right sensor-status icon in the top bar now that the ☰ Settings
 * menu no longer carries an "External sensor" entry — its own standalone
 * page (`standalonePage.ts`), with a ✕ to close, never a ‹ back into a
 * drawer. Only ever constructed when Web Bluetooth exists
 * (`isWebBluetoothSupported()`, checked by the caller) — never a silently
 * broken option on Safari/iOS (#116's original acceptance criteria, still
 * true here).
 */
import { createSensorSourceSection, type SensorSourceOptions } from './sensorSourceSection';
import { createStandalonePage } from './standalonePage';
import { t } from './i18n';

export interface SensorPage {
  element: HTMLElement;
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
  open(): void;
}

export function createSensorPage(options: SensorSourceOptions): SensorPage {
  const sensorSourceSection = createSensorSourceSection(options);
  const page = createStandalonePage(t('menu.sensorSource'), () => {
    sensorSourceSection.refresh();
  });
  page.body.append(sensorSourceSection.element);

  return {
    element: page.element,
    isOpen: page.isOpen,
    attach: page.attach,
    open: page.open,
  };
}
