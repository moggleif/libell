/**
 * Opening the first-run wizard and what its close means for the rest of
 * the app. Skippable: the lamps stay lit for whatever was skipped.
 */
import type { LevelSettings, SensorSource } from '../domain/settings';
import type { OnboardingOptions } from '../ui/onboarding';
import type { BoxPending } from './indicatorWiring';
import type { MenuOptionDeps } from './menuOptionParts';
import { sharedOptions } from './menuOptions';

export interface OnboardingLauncherDeps {
  show(options: OnboardingOptions): void;
  settings: () => LevelSettings;
  onSettingsSaved(next: LevelSettings): void;
  parts: MenuOptionDeps;
  sensorOptionsFor: OnboardingOptions['sensorOptionsFor'];
  progress: { markSeen(): void; markDone(): void };
  boxPending: BoxPending;
  activeSource: () => SensorSource;
  refreshLamps(): void;
}

export interface OnboardingLauncher {
  open(): void;
  /** While open, the level screen pauses its guidance. */
  isOpen(): boolean;
}

export function createOnboardingLauncher(deps: OnboardingLauncherDeps): OnboardingLauncher {
  let open = false;
  return {
    open() {
      open = true;
      const current = deps.settings();
      deps.show({
        initialSettings: current,
        appearance: current.appearance,
        onSettingsSaved: (next) => deps.onSettingsSaved(next),
        ...sharedOptions(deps.parts),
        sensorOptionsFor: deps.sensorOptionsFor,
        onFinished(done, path) {
          open = false;
          deps.progress.markSeen();
          if (done) deps.progress.markDone();
          // A box chosen but not connected: see `createBoxPending`.
          if (done) deps.boxPending.settle(path === 'external' && deps.activeSource() === 'phone');
          deps.refreshLamps();
        },
      });
    },
    isOpen: () => open,
  };
}
