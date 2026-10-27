import type { LevelSettings } from '../../domain/settings';
import { createSettingsForm } from '../settingsPanel';
import { measuresIllustration } from '../helpIllustrations';
import { t, type MessageKey } from '../i18n';
import type { Step } from './types';
import type { WizardState } from './wizardState';

function saveSettings(state: WizardState, settings: LevelSettings): void {
  state.currentSettings = settings;
  state.options.onSettingsSaved(settings);
}

// What the wizard has saved so far, for the vehicle the vehicle step picked:
// a skipped step must not fall back to the stored vehicle type (#397).
function chosenSettings(state: WizardState): LevelSettings {
  return { ...state.currentSettings, vehicleType: state.vehicleChoice };
}

/** Stores the picked vehicle when no form step has saved it yet. */
export function saveVehicleChoice(state: WizardState): void {
  if (state.currentSettings.vehicleType === state.vehicleChoice) return;
  saveSettings(state, chosenSettings(state));
}

// Built from `chosenSettings` so a Back visit shows what was just entered
// and the field labels match the vehicle step.
function settingsForm(
  state: WizardState,
  compact: 'measurements' | 'language' | 'appearance' | 'sound' | 'ramps',
): HTMLElement {
  return createSettingsForm(chosenSettings(state), (saved) => saveSettings(state, saved), {
    compact,
  });
}

export function measurementsStep(state: WizardState): Step {
  return {
    title: t('help.settings.h'),
    skippable: true,
    note: () => t('onboard.note.measurements', { lamp: t('lamp.setup') }),
    build: () => [
      measuresIllustration(t('help.settings.h'), state.vehicleChoice),
      settingsForm(state, 'measurements'),
    ],
  };
}

// The shipped defaults are already a complete choice, so there is nothing
// to skip and no note.
export function preferenceStep(
  state: WizardState,
  title: MessageKey,
  compact: 'language' | 'appearance' | 'sound',
): Step {
  return {
    title: t(title),
    build: () => [settingsForm(state, compact)],
  };
}

export function rampsStep(state: WizardState): Step {
  return {
    title: t('settings.tab.ramps'),
    skippable: true,
    note: () => t('onboard.note.ramps'),
    build: () => [settingsForm(state, 'ramps')],
  };
}
