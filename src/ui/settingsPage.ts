/**
 * Settings page (screen-cleanup follow-up, Modern only): the gear icon
 * opens straight to the same tabbed form (Vehicle/Ramps/Calibration/
 * Level/General, `settingsPanel.ts`) that used to sit behind a drawer/card list
 * — now its own standalone page (`standalonePage.ts`), with a ✕ to close
 * instead of a ‹ back that used to reveal that drawer. Classic has no
 * tabs to land on, so it keeps the old drawer-based `menu.ts` unchanged.
 */
import type { MenuOptions, MenuSection } from './menu';
import { createSettingsForm, type SettingsFormElement } from './settingsPanel';
import { createStandalonePage } from './standalonePage';
import { t } from './i18n';

export interface SettingsPage {
  element: HTMLElement;
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
  /** Open on whichever tab was last active — the "settings not saved" lamp's shortcut. */
  open(): void;
  /** Open directly on the Kalibrering tab — the "not calibrated" lamp's shortcut. */
  openCalibration(): void;
  /** Open directly on the Targets tab — the main-screen badge's shortcut. */
  openTargets(): void;
  /** Open directly on any tab — Help's topic buttons (#326). */
  openTab(id: MenuSection): void;
  /**
   * Redraw the open tab if the page is open — the active sensor changed
   * underneath it, e.g. the box disconnected from its own page, which
   * opens on top of this one (#353).
   */
  refreshOpenTab(): void;
}

export function createSettingsPage(options: MenuOptions): SettingsPage {
  const page = createStandalonePage(t('menu.settings'), () => {
    // The bottom bar's mute toggle (#161) can change soundOnLevel/
    // soundGuidance while this page is closed — resync every reopen.
    settingsForm.resyncSoundFields?.(options.getSoundPrefs());
    // And the open tab: a box connected or disconnected elsewhere changes
    // what Kalibrering shows.
    settingsForm.refreshOpenTab?.();
  });

  const settingsForm: SettingsFormElement = createSettingsForm(
    options.initialSettings,
    // Every change is stored as it is made (#328); only the ✕ closes the
    // page.
    (settings) => {
      options.onSettingsSaved(settings);
    },
    options,
    { onShareVehicleSetup: options.onShareVehicleSetup },
    options,
  );
  page.body.append(settingsForm);

  return {
    element: page.element,
    isOpen: page.isOpen,
    attach: page.attach,
    open: page.open,
    openCalibration() {
      settingsForm.selectCalibrationTab?.();
      page.open();
    },
    openTargets() {
      settingsForm.selectTargetsTab?.();
      page.open();
    },
    openTab(id) {
      settingsForm.selectTab?.(id);
      page.open();
    },
    refreshOpenTab() {
      if (page.isOpen()) settingsForm.refreshOpenTab?.();
    },
  };
}
