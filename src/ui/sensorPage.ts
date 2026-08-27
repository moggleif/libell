/**
 * External sensor page (screen-cleanup follow-up): reached only from the
 * top-right sensor-status icon in the top bar now that the ☰ Settings
 * menu no longer carries an "External sensor" entry — its own standalone
 * page (`standalonePage.ts`), with a ✕ to close, never a ‹ back into a
 * drawer. Only ever constructed when Web Bluetooth exists
 * (`isEasyLevelAvailable()`, checked by the caller) — never a silently
 * broken option on Safari/iOS (#116's original acceptance criteria, still
 * true here).
 *
 * Also owns the deeper `easyLevelStatusPage.ts`, opened by tapping the
 * sensor row inside `sensorSourceSection`: composed here, alongside that
 * section, rather than main.ts wiring a third page directly — `main.ts`
 * only ever needs `refreshLive()` below, never the status page itself.
 * `options` already satisfies `EasyLevelStatusOptions` too (`main.ts`'s
 * single `menuOptions` bag covers every menu page's options interface), so
 * no extra wiring is needed to hand the status page what it needs.
 *
 * `statusElement` is returned rather than appended to `document.body`
 * here, matching how `main.ts` attaches every other top-level page itself
 * (and keeping this factory free of a real-DOM side effect tests don't
 * need). It must be attached AFTER `element` — `openStack`'s "most
 * recently opened page reveals whichever is beneath it on close" only
 * looks right if the status page's `.menu-page` paints on top of this
 * one's when both are open, which plain DOM order already gives it at
 * their shared z-index.
 */
import { createSensorSourceSection, type SensorSourceOptions } from './sensorSourceSection';
import { createEasyLevelStatusPage, type EasyLevelStatusOptions } from './easyLevelStatusPage';
import { createStandalonePage } from './standalonePage';
import { t } from './i18n';

export interface SensorPage {
  element: HTMLElement;
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
  open(): void;
}

/**
 * `createSensorPage`'s actual return type — a `SensorPage` plus the two
 * extras only it (not `iosSensorGuidePage.ts`'s same-shaped stand-in, which
 * has no BLE status to show) can offer. Kept as a separate interface
 * rather than widening `SensorPage` itself, so that page never has to fake
 * a `statusElement`/`refreshLive()` it can't meaningfully implement.
 */
export interface EasyLevelSensorPage extends SensorPage {
  /** The nested status page's element — attach it too, right after
   * `element` (see the module doc comment for why the order matters). */
  statusElement: HTMLElement;
  /** Re-reads the nested status page's live values, but only while it's
   * actually open — call unconditionally every animation frame, same
   * "runs every frame regardless of what's open" discipline `main.ts`
   * already uses for the top-bar sensor-status dot. */
  refreshLive(): void;
}

export function createSensorPage(
  options: SensorSourceOptions & EasyLevelStatusOptions,
): EasyLevelSensorPage {
  const statusPage = createEasyLevelStatusPage(options);
  const sensorSourceSection = createSensorSourceSection(options, () => {
    // The mounting/offset controls now live on the status page (#226) and
    // are refreshed by this section, not by that page — so re-read them
    // here, on the way in, exactly as opening the list page does for the
    // half it still shows.
    sensorSourceSection.refresh();
    statusPage.open();
  });
  const page = createStandalonePage(t('menu.sensorSource'), () => {
    sensorSourceSection.refresh();
  });
  // A list of sources: just the connect half (#226). The per-device
  // settings half goes on the device's own page below, so this page never
  // grows longer than the detail page its chevron leads to.
  page.body.append(sensorSourceSection.connectElement);
  statusPage.settingsSlot.append(sensorSourceSection.installElement);

  return {
    element: page.element,
    statusElement: statusPage.element,
    isOpen: page.isOpen,
    attach: page.attach,
    open: page.open,
    refreshLive: () => {
      if (statusPage.isOpen()) statusPage.refresh();
    },
  };
}
