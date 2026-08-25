/**
 * Settings page (screen-cleanup follow-up, Modern only): the gear icon
 * opens straight to the same tabbed form (General/Kalibrering/Vehicle/
 * Ramps/Targets, `settingsPanel.ts`) that used to sit behind a drawer/card list
 * — now its own standalone page (`standalonePage.ts`), with a ✕ to close
 * instead of a ‹ back that used to reveal that drawer. Classic has no
 * tabs to land on, so it keeps the old drawer-based `menu.ts` unchanged.
 */
import type { MenuOptions } from './menu';
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
}

export function createSettingsPage(options: MenuOptions): SettingsPage {
  const page = createStandalonePage(t('menu.settings'), () => {
    // The bottom bar's mute toggle (#161) can change soundOnLevel/
    // soundGuidance while this page is closed — resync every reopen.
    settingsForm.resyncSoundFields?.(options.getSoundPrefs());
  });

  const settingsForm: SettingsFormElement = createSettingsForm(
    options.initialSettings,
    // Return to the main screen after a successful Save (#159).
    (settings) => {
      options.onSettingsSaved(settings);
      page.close();
    },
    options,
    undefined,
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
  };
}
