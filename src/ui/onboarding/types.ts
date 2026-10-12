/** The wizard's public types (#415): what callers pass in, and one step. */
import type { LevelSettings } from '../../domain/settings';
import type { CalibrationOptions } from '../calibrationSection';
import type { SensorSourceOptions } from '../sensorSourceSection';
import type { ExternalSensorDescriptor } from '../../sensor/externalSensors';

export interface OnboardingOptions extends CalibrationOptions, SensorSourceOptions {
  /**
   * The per-source options for each available external sensor (#272).
   * With more than one available the wizard offers them all rather than
   * silently picking one, so a user who owns the other box is not quietly
   * steered to the first. Optional: callers with a single source can leave
   * it out and the wizard uses this bag as it always did.
   */
  sensorOptionsFor?(sensor: ExternalSensorDescriptor): SensorSourceOptions;
  initialSettings: LevelSettings;
  onSettingsSaved(settings: LevelSettings): void;
  /**
   * Called whenever the wizard closes, either way — ✕ at any point, or
   * reaching the end. `done` distinguishes the two (design review,
   * follow-up): true only when every step was actually stepped through
   * to the end (whatever individual steps the user chose to skip along
   * the way), false for an early ✕. Both still count as "seen" for the
   * auto-launch gate (`hasSeenOnboarding`) — only `done` decides whether
   * "Show introduction" still reads as an unfinished first-run task
   * (green) or a plain re-launch (secondary), see `infoMenu.ts`.
   */
  onFinished(done: boolean, path: SensorChoice): void;
}

/** Which source the first step's radios currently have selected — 'phone'
 * until the user picks otherwise, so an unfinished/closed wizard always
 * resolves to the phone sensor (see the module doc comment above). */
export type SensorChoice = 'phone' | 'external';

/**
 * `skippable` is only set where Next saves a form (#365) — elsewhere Skip
 * did exactly what Next does. `note` says what leaving this step undone
 * means, specific to the step (#365; #189 had one generic note on every
 * step). `renderStep` puts it right above the nav buttons it explains,
 * not at the end of the (scrollable) body — see #239: there it was both
 * the first thing pushed out of view and three lines of the height budget.
 */
export type Step = {
  title: string;
  build: () => Element[];
  skippable?: true;
  note?: () => string;
};
