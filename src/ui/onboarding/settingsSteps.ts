import type { LevelSettings } from '../../domain/settings';
import { createSettingsForm } from '../settingsPanel';
import { measuresIllustration } from '../helpIllustrations';
import { t, type MessageKey } from '../i18n';
import type { Step } from './types';
import type { WizardState } from './wizardState';

/** Saves from an embedded settings form, keeping `currentSettings` in step. */
function saveSettings(state: WizardState, settings: LevelSettings): void {
  state.currentSettings = settings;
  state.options.onSettingsSaved(settings);
}

/** One of `createSettingsForm`'s compact modes, saved through the wizard. */
function settingsForm(
  state: WizardState,
  compact: 'measurements' | 'language' | 'appearance' | 'sound' | 'ramps',
  settings: LevelSettings = state.currentSettings,
): HTMLElement {
  return createSettingsForm(settings, (saved) => saveSettings(state, saved), undefined, {
    compact,
  });
}

// 'help.settings.h' ("The measurements"), not 'menu.settings': this step
// only ever shows wheelbase/track widths (#189 follow-up). Built from
// `currentSettings` so a Back visit after Next saved shows what was just
// entered, with `vehicleType` overridden to the vehicle step's choice so
// the field labels already match it (#184).
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

// Preference steps: the shipped defaults are already a complete choice,
// so there is nothing to skip and no note (#365). One step per decision
// (design review): Language alone, since the rest of the guide must be
// legible first; Theme + Appearance as "how it looks"; Chime + Continuous
// audio guidance as "what it sounds like".
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

// Ramp model/count (design review): what the ramp catalog and per-wheel
// step guidance run on. Skippable like the measurements step; the note says
// the shipped default ramps stay in place (#365).
export function rampsStep(state: WizardState): Step {
  return {
    title: t('settings.tab.ramps'),
    skippable: true,
    note: () => t('onboard.note.ramps'),
    build: () => [settingsForm(state, 'ramps')],
  };
}
