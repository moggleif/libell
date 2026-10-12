/**
 * External sensor page, reached from the top-bar sensor-status icon. Only
 * constructed when at least one external source can work in this browser
 * (`hasAvailableExternalSensor()`, checked by the caller) — never a silently
 * broken option on Safari/iOS.
 *
 * **A list, not a device**: one section per available source, each with its
 * own device page behind its row, built from the same components
 * parameterised by that source's descriptor (ADR 0016). The device pages
 * are composed here; `main.ts` only needs `refreshLive()`.
 *
 * `statusElements` are returned rather than appended to `document.body`,
 * like every other top-level page. They must be attached AFTER `element`:
 * a device page has to paint on top of this one at their shared z-index,
 * which DOM order gives them.
 */
import {
  createSensorSourceSection,
  type SensorSourceOptions,
  type SensorSourceSection,
} from './sensorSourceSection';
import { createBoxStatusPage, type BoxStatusOptions, type BoxStatusPage } from './boxStatusPage';
import { createStandalonePage } from './standalonePage';
import { t } from './i18n';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';

export interface SensorPage {
  element: HTMLElement;
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
  open(): void;
}

/**
 * Separate from `SensorPage` so `iosSensorGuidePage.ts`'s same-shaped
 * stand-in, which has no device pages, need not fake these extras.
 */
export interface ExternalSensorPage extends SensorPage {
  /** Each source's own page element — attach right after `element` (see
   * the module doc comment for why the order matters). */
  statusElements: HTMLElement[];
  /** Re-reads the open device page's live values, and the list's cards
   * while it is open — call unconditionally every animation frame. */
  refreshLive(): void;
  /** Opens one source's own device page directly — the quick route from
   * "this sensor looks wrong" to its live values and mounting. */
  openSource(id: string): void;
}

export type SensorPageOptions = SensorSourceOptions & BoxStatusOptions;

export function createSensorPage(
  sensors: readonly ExternalSensorDescriptor[],
  optionsFor: (sensor: ExternalSensorDescriptor) => SensorPageOptions,
): ExternalSensorPage {
  // Declared before the page so its `onOpen` can close over it.
  const sources: { id: string; statusPage: BoxStatusPage; section: SensorSourceSection }[] = [];
  const refreshAll = () => {
    for (const source of sources) source.section.refresh();
  };
  const page = createStandalonePage(t('sensorList.title'), refreshAll);

  for (const sensor of sensors) {
    const options = optionsFor(sensor);
    const statusPage = createBoxStatusPage(options);
    const section = createSensorSourceSection(
      options,
      () => {
        // The mounting/offset controls on the device page are refreshed by
        // this section, not by that page — so re-read them on the way in.
        section.refresh();
        statusPage.open();
      },
      // Connecting one source changes what every other row should say —
      // none of them is "using the phone's own sensor" any more.
      () => refreshAll(),
    );
    // Only the connect half here; the per-device settings go on the device
    // page, so this list never grows longer than the pages it leads to.
    page.body.append(section.connectElement);
    statusPage.settingsSlot.append(section.installElement);
    statusPage.footerSlot.append(section.moreElement);
    statusPage.positionSlot.append(section.positionElement);
    sources.push({ id: sensor.id, statusPage, section });
  }

  // Said once, under the cards, never per box: what is used while no box
  // is. No browser named: this page exists wherever Web Bluetooth does,
  // including Bluefy on iOS.
  const phoneLine = document.createElement('p');
  phoneLine.className = 'menu__text sensor-list__phone';
  phoneLine.textContent = t('sensorList.phone');
  page.body.append(phoneLine);

  return {
    element: page.element,
    statusElements: sources.map((source) => source.statusPage.element),
    // A device page opened straight from a main-screen overlay has no list
    // page beneath it — it still counts as open, or `main.ts` keeps that
    // overlay painted on top of it.
    isOpen: () => page.isOpen() || sources.some((source) => source.statusPage.isOpen()),
    attach: page.attach,
    open: page.open,
    openSource: (id) => {
      const source = sources.find((candidate) => candidate.id === id);
      if (!source) return;
      source.section.refresh();
      source.statusPage.open();
    },
    refreshLive: () => {
      for (const source of sources) {
        // The list's own cards too: a box's password verdict arrives after
        // the connect that drew them. Cheap — a card redraws only when what
        // it shows has changed.
        if (page.isOpen() && !source.statusPage.isOpen()) source.section.refreshLive();
        if (!source.statusPage.isOpen()) continue;
        // The position first: the status page's live line starts with it.
        source.section.refreshLive();
        source.statusPage.refresh();
      }
    },
  };
}
