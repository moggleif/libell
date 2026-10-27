/**
 * Settings page (Modern only): the gear icon opens the tabbed form
 * (`settingsPanel.ts`) as a standalone page with a ✕ to close. Classic uses
 * the drawer-based `menu.ts` instead.
 */
import type { MenuSection } from './menu';
import type { SettingsOptions } from './settingsOptions';
import { createSettingsForm } from './settingsPanel';
import type { SettingsFormElement } from './settingsLayout';
import { createStandalonePage } from './standalonePage';
import { t } from './i18n';

export interface SettingsPage {
  element: HTMLElement;
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
  /** Open on whichever tab was last active. */
  open(): void;
  /** Open directly on the Kalibrering tab — the "not calibrated" lamp's shortcut. */
  openCalibration(): void;
  /** Open directly on the Targets tab — the main-screen badge's shortcut. */
  openTargets(): void;
  /** Open directly on any tab — Help's topic buttons. */
  openTab(id: MenuSection): void;
  /**
   * Redraw the open tab if the page is open — the active sensor changed
   * underneath it, e.g. the box disconnected from its own page, which
   * opens on top of this one.
   */
  refreshOpenTab(): void;
}

export function createSettingsPage(options: SettingsOptions): SettingsPage {
  const page = createStandalonePage(t('menu.settings'), () => {
    // The bottom bar's mute toggle can change the sound prefs while this
    // page is closed — resync every reopen.
    settingsForm.resyncSoundFields?.(options.getSoundPrefs());
    // And the open tab: a box connected or disconnected elsewhere changes
    // what Kalibrering shows.
    settingsForm.refreshOpenTab?.();
  });

  const settingsForm: SettingsFormElement = createSettingsForm(
    options.initialSettings,
    // Every change is stored as it is made; only the ✕ closes the page.
    (settings) => {
      options.onSettingsSaved(settings);
    },
    { hosts: options, onShareVehicleSetup: options.onShareVehicleSetup },
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
