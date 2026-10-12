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

function settingsForm(
  state: WizardState,
  compact: 'measurements' | 'language' | 'appearance' | 'sound' | 'ramps',
  settings: LevelSettings = state.currentSettings,
): HTMLElement {
  return createSettingsForm(settings, (saved) => saveSettings(state, saved), undefined, {
    compact,
  });
}

// Built from `currentSettings` so a Back visit shows what was just entered,
// with `vehicleType` overridden so the field labels match the vehicle step.
export function measurementsStep(state: WizardState): Step {
  return {
    title: t('help.settings.h'),
    skippable: true,
    note: () => t('onboard.note.measurements', { lamp: t('lamp.setup') }),
    build: () => [
      measuresIllustration(t('help.settings.h'), state.vehicleChoice),
      settingsForm(state, 'measurements', {
        ...state.currentSettings,
        vehicleType: state.vehicleChoice,
      }),
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
