/**
 * What the ☰ menu and the Settings page both read: the form's starting
 * values and where a change goes, and the hosts behind the sections the
 * form embeds. Each group's fields are documented once, on its own type.
 */
import type { LevelSettings, SoundPrefs } from '../domain/settings';
import type { CalibrationOptions } from './calibrationSection';
import type { TargetsOptions } from './targetsSection';
import type { VehiclePickerOptions } from './vehiclePicker';

export interface SettingsOptions {
  initialSettings: LevelSettings;
  onSettingsSaved(settings: LevelSettings): void;
  /** The bottom bar's mute toggle can change these outside the form, so
   * the form resyncs from here every time it (re)opens. */
  getSoundPrefs(): SoundPrefs;
  calibration: CalibrationOptions;
  targets: TargetsOptions;
  /** Forwarded to the settings form's own `onShareVehicleSetup`. */
  onShareVehicleSetup?(settings: LevelSettings): void;
  /** Several vehicles (#599); no picker when omitted. */
  vehicles?: VehiclePickerOptions;
}
