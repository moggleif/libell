/**
 * External sensor page (screen-cleanup follow-up): reached only from the
 * top-right sensor-status icon in the top bar now that the ☰ Settings
 * menu no longer carries an "External sensor" entry — its own standalone
 * page (`standalonePage.ts`), with a ✕ to close, never a ‹ back into a
 * drawer. Only ever constructed when at least one external source can work
 * in this browser (`hasAvailableExternalSensor()`, checked by the caller)
 * — never a silently broken option on Safari/iOS (#116's original
 * acceptance criteria, still true here).
 *
 * **A list, not a device** (#268): one section per available source, each
 * with its own device page behind its own row, built from the same
 * components parameterised by that source's descriptor (ADR 0016). With
 * one source registered this looks and behaves exactly as #226 left it.
 *
 * Each device page is composed here, alongside its section, rather than
 * `main.ts` wiring pages directly — `main.ts` only ever needs
 * `refreshLive()` below, never the pages themselves.
 *
 * `statusElements` are returned rather than appended to `document.body`
 * here, matching how `main.ts` attaches every other top-level page itself
 * (and keeping this factory free of a real-DOM side effect tests don't
 * need). They must be attached AFTER `element` — `openStack`'s "most
 * recently opened page reveals whichever is beneath it on close" only
 * looks right if a device page's `.menu-page` paints on top of this one's
 * when both are open, which plain DOM order already gives them at their
 * shared z-index.
 */
import {
  createSensorSourceSection,
  type SensorSourceOptions,
  type SensorSourceSection,
} from './sensorSourceSection';
import {
  createEasyLevelStatusPage,
  type EasyLevelStatusOptions,
  type EasyLevelStatusPage,
} from './easyLevelStatusPage';
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
 * `createSensorPage`'s actual return type — a `SensorPage` plus the two
 * extras only it (not `iosSensorGuidePage.ts`'s same-shaped stand-in, which
 * has no device pages to show) can offer. Kept as a separate interface
 * rather than widening `SensorPage` itself, so that page never has to fake
 * a `statusElements`/`refreshLive()` it can't meaningfully implement.
 */
export interface ExternalSensorPage extends SensorPage {
  /** Each source's own page element — attach them too, right after
   * `element` (see the module doc comment for why the order matters). */
  statusElements: HTMLElement[];
  /** Re-reads the open device page's live values, but only while one is
   * actually open — call unconditionally every animation frame, same
   * "runs every frame regardless of what's open" discipline `main.ts`
   * already uses for the top-bar sensor-status dot. */
  refreshLive(): void;
}

export type SensorPageOptions = SensorSourceOptions & EasyLevelStatusOptions;

export function createSensorPage(
  sensors: readonly ExternalSensorDescriptor[],
  optionsFor: (sensor: ExternalSensorDescriptor) => SensorPageOptions,
): ExternalSensorPage {
  // Declared before the page so its `onOpen` can close over it; filled
  // immediately below, and never read until the page is actually opened.
  const sources: { statusPage: EasyLevelStatusPage; section: SensorSourceSection }[] = [];
  const refreshAll = () => {
    for (const source of sources) source.section.refresh();
  };
  const page = createStandalonePage(t('menu.sensorSource'), refreshAll);

  // The browser requirement is the same for every box, so it is said once
  // here rather than repeated in each source's own intro (#272).
  const requirements = document.createElement('p');
  requirements.className = 'menu__text';
  requirements.textContent = t('sensorSource.intro.requirements');
  page.body.append(requirements);

  for (const sensor of sensors) {
    const options = optionsFor(sensor);
    const statusPage = createEasyLevelStatusPage(options);
    const section = createSensorSourceSection(
      options,
      () => {
        // The mounting/offset controls live on the device page (#226) and
        // are refreshed by this section, not by that page — so re-read them
        // here, on the way in, exactly as opening the list page does for
        // the half it still shows.
        section.refresh();
        statusPage.open();
      },
      // Connecting one source changes what every other row should say
      // (#272) — none of them is "using the phone's own sensor" any more.
      () => refreshAll(),
    );
    // A list of sources: just the connect half (#226). The per-device
    // settings half goes on that device's own page below, so this page
    // never grows longer than the detail pages its chevrons lead to.
    page.body.append(section.connectElement);
    statusPage.settingsSlot.append(section.installElement);
    sources.push({ statusPage, section });
  }

  return {
    element: page.element,
    statusElements: sources.map((source) => source.statusPage.element),
    isOpen: page.isOpen,
    attach: page.attach,
    open: page.open,
    refreshLive: () => {
      for (const source of sources) {
        if (source.statusPage.isOpen()) source.statusPage.refresh();
      }
    },
  };
}
