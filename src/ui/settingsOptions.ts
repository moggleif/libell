/**
 * What the ☰ menu and the Settings page both read: the form's starting
 * values and where a change goes, and the hosts behind the sections the
 * form embeds. Each group's fields are documented once, on its own type.
 */
import type { LevelSettings, SoundPrefs } from '../domain/settings';
import type { Hosts } from './settingsLayout';

export interface SettingsOptions extends Hosts {
  initialSettings: LevelSettings;
  onSettingsSaved(settings: LevelSettings): void;
  /** The bottom bar's mute toggle can change these outside the form, so
   * the form resyncs from here every time it (re)opens. */
  getSoundPrefs(): SoundPrefs;
  /** Forwarded to the settings form's own `onShareVehicleSetup`. */
  onShareVehicleSetup?(settings: LevelSettings): void;
}
