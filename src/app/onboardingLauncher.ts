/**
 * Opening the first-run intro and wizard, and what their close means for
 * the rest of the app. Skippable: the lamps stay lit for whatever was
 * skipped.
 */
import type { LevelSettings, SensorSource } from '../domain/settings';
import type { InstallOffer } from '../ui/install';
import type { IntroOptions } from '../ui/intro';
import type { OnboardingOptions } from '../ui/onboarding';
import type { BoxPending } from './indicatorWiring';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import {
  boxConnectionOptions,
  calibrationOptions,
  easyLevelMountingOptions,
  sensorSourceOptions,
  type MenuOptionDeps,
} from './menuOptionParts';
import { countFeature } from './usage';

export interface OnboardingLauncherDeps {
  show(options: OnboardingOptions): void;
  showIntro(options: IntroOptions): void;
  install: InstallOffer;
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
  /** The wizard alone, as "Show introduction" reopens it. */
  open(): void;
  /** The very first visit (#691): the intro, then the wizard if asked. */
  openFirstRun(): void;
  /** While either is open, the level screen pauses its guidance. */
  isOpen(): boolean;
}

export function createOnboardingLauncher(deps: OnboardingLauncherDeps): OnboardingLauncher {
  let open = false;
  function openWizard(): void {
    open = true;
    const current = deps.settings();
    deps.show({
      initialSettings: current,
      appearance: current.appearance,
      onSettingsSaved: (next) => deps.onSettingsSaved(next),
      ...wizardOptions(deps.parts),
      sensorOptionsFor: deps.sensorOptionsFor,
      onFinished(done, path) {
        open = false;
        deps.progress.markSeen();
        if (done) deps.progress.markDone();
        if (done) countFeature('guide-done');
        // A box chosen but not connected: see `createBoxPending`.
        if (done) deps.boxPending.settle(path === 'external' && deps.activeSource() === 'phone');
        deps.refreshLamps();
      },
    });
  }
  function openFirstRun(): void {
    open = true;
    deps.showIntro({
      install: deps.install,
      onStart: openWizard,
      // Counts as a closed wizard: it never opens by itself again.
      onLookAround() {
        open = false;
        deps.progress.markSeen();
        deps.refreshLamps();
      },
    });
  }
  return { open: openWizard, openFirstRun, isOpen: () => open };
}

/**
 * The calibration and sensor-source groups the wizard's steps read. The
 * top-level box fields are EasyLevel's: connection and mounting only,
 * never another box's password or guide.
 */
function wizardOptions(parts: MenuOptionDeps) {
  return {
    ...calibrationOptions(parts),
    ...sensorSourceOptions(parts),
    ...boxConnectionOptions(EASYLEVEL_DESCRIPTOR, parts),
    ...easyLevelMountingOptions(parts.boxWiring),
  };
}
