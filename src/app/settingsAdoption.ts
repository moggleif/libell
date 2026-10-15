/**
 * What the rest of the app does with settings the Settings page or the
 * wizard has just saved: take them, restyle, and redraw
 * what depends on them.
 */
import { anySoundOn, type LevelSettings } from '../domain/settings';

export interface SettingsAdoptionDeps {
  /** Make `next` the app's settings (the form has stored them already). */
  adopt(next: LevelSettings): void;
  applyLook(settings: LevelSettings): void;
  unlockAudio(): void;
  /** The lamps and the level screen. */
  refresh(): void;
}

export interface SettingsAdoption {
  fromSettings(next: LevelSettings): void;
  fromWizard(next: LevelSettings): void;
}

export function createSettingsAdoption(deps: SettingsAdoptionDeps): SettingsAdoption {
  return {
    fromSettings(next) {
      deps.adopt(next);
      deps.applyLook(next);
      // A change in Settings comes from a tap, a user gesture: the moment
      // to unlock audio for the level chime or the guidance.
      if (anySoundOn(next)) deps.unlockAudio();
      deps.refresh();
    },
    fromWizard(next) {
      deps.adopt(next);
      deps.applyLook(next);
      deps.refresh();
    },
  };
}
