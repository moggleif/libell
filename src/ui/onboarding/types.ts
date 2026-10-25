import type { LevelSettings } from '../../domain/settings';
import type { CalibrationOptions } from '../calibrationSection';
import type { SensorSourceOptions } from '../sensorSourceSection';
import type { BoxDescriptor } from '../../sensor/boxes';
import type { CountingChoice } from '../countingSection';

export interface OnboardingOptions extends CalibrationOptions, SensorSourceOptions {
  /**
   * With more than one sensor available the wizard offers them all rather
   * than silently picking one. Without it the wizard uses this bag.
   */
  sensorOptionsFor?(sensor: BoxDescriptor): SensorSourceOptions;
  initialSettings: LevelSettings;
  onSettingsSaved(settings: LevelSettings): void;
  /** Anonymous counting's on/off choice, for its own step (#674). */
  counting: CountingChoice;
  /**
   * Called on ✕ and at the end. `done` is true only when the end was
   * reached (skipped steps included); both count as "seen".
   */
  onFinished(done: boolean, path: SensorChoice): void;
}

export type SensorChoice = 'phone' | 'external';

/**
 * `skippable` is only set where Next saves a form: elsewhere Skip would do
 * exactly what Next does. `note` says what leaving this step undone means.
 */
export type Step = {
  title: string;
  build: () => Element[];
  skippable?: true;
  note?: () => string;
};
