/**
 * The app's one copy of the settings. `set` stores what it is given;
 * `adopt` takes settings a form has already stored.
 */
import type { LevelSettings } from '../domain/settings';
import type { SettingsAccess } from './externalSensorWiring';

export interface AppSettings extends SettingsAccess {
  adopt(next: LevelSettings): void;
}

export function createAppSettings(
  initial: LevelSettings,
  save: (settings: LevelSettings) => void,
): AppSettings {
  let settings = initial;
  return {
    get: () => settings,
    set(next) {
      settings = next;
      save(next);
    },
    adopt(next) {
      settings = next;
    },
  };
}
