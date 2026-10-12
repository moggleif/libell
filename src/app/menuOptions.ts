/**
 * The options bags handed to the Settings page, the ☰ menu, the box pages
 * and the wizard's box step, assembled from the shared groups in
 * `menuOptionParts.ts`.
 */
import { easyLevelSettings, type Calibration, type LevelSettings } from '../domain/settings';
import type { EasyLevelSensor } from '../sensor/easyLevelSensor';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import { healthOf, withEasyLevelConnectDelay } from './externalSensorWiring';
import {
  boxConnectionOptions,
  boxSetupOptions,
  boxStatusOptions,
  calibrationOptions,
  easyLevelMountingOptions,
  sensorSourceOptions,
  targetOptions,
  type MenuOptionDeps,
} from './menuOptionParts';
import { calibratedTilt } from './tiltReading';

/**
 * The groups the wizard and the menu both carry. The top-level box
 * fields are EasyLevel's: connection and mounting only, never another
 * box's password or guide.
 */
export function sharedOptions(parts: MenuOptionDeps) {
  return {
    ...calibrationOptions(parts),
    // The wizard's box step embeds the same sensor-source section the menu's
    // page does (ADR 0014).
    ...sensorSourceOptions(parts),
    ...boxConnectionOptions(EASYLEVEL_DESCRIPTOR, parts),
    ...easyLevelMountingOptions(parts.boxWiring),
  };
}

export interface MenuOptionsDeps {
  parts: MenuOptionDeps;
  settings: () => LevelSettings;
  /** Demo mode presents as a configured app. */
  demo: boolean;
  hasStoredMeasurements: () => boolean;
  onSettingsSaved(next: LevelSettings): void;
  openOnboarding(): void;
  openExternalSensor(): void;
  effectiveCalibration(): Calibration | null;
  shareVehicleSetup(current: LevelSettings): void;
}

/** Every field the Settings page, the ☰ menu and the box pages need. */
export function buildMenuOptions(deps: MenuOptionsDeps) {
  const { parts, settings } = deps;
  const settingsAccess = parts.boxWiring.settings;
  const initial = settings();
  return {
    initialSettings: initial,
    appearance: initial.appearance,
    openOnboarding: deps.openOnboarding,
    hasSavedSettings: () => deps.demo || deps.hasStoredMeasurements(),
    onSettingsSaved: (next: LevelSettings) => deps.onSettingsSaved(next),
    ...sharedOptions(parts),
    openExternalSensor: deps.openExternalSensor,
    ...targetOptions(parts.targets),
    getCalibratedTilt: () => calibratedTilt(parts.activeSensor(), deps.effectiveCalibration()),
    getVehicleType: () => settings().vehicleType,
    getActiveTargetName: () => parts.targets.activeName(),
    getHealth: () => healthOf('easylevel', parts.externalSensors.getSensor('easylevel')),
    // Raw status bytes are EasyLevel's own debug surface.
    getEasyLevelStatusBytes: () => {
      const sensor = parts.externalSensors.getSensor('easylevel');
      return sensor && sensor.getSource() === 'easylevel'
        ? (sensor as EasyLevelSensor).getStatusBytes()
        : null;
    },
    getEasyLevelConnectDelay: () => ({
      enabled: easyLevelSettings(settings()).connectDelayEnabled,
      ms: easyLevelSettings(settings()).connectDelayMs,
    }),
    // Debug-only; the transport reads the settings live, so it applies on
    // the next connect.
    setEasyLevelConnectDelay: (enabled: boolean, ms: number) =>
      settingsAccess.set(withEasyLevelConnectDelay(settings(), enabled, ms)),
    getSoundPrefs: () => ({
      soundOnLevel: settings().soundOnLevel,
      soundGuidance: settings().soundGuidance,
    }),
    onShareVehicleSetup: (current: LevelSettings) => deps.shareVehicleSetup(current),
  };
}

export type MenuOptionsBag = ReturnType<typeof buildMenuOptions>;

/** One box's own page: its connection, live status and setup. */
export function boxPageOptions(
  menu: MenuOptionsBag,
  descriptor: ExternalSensorDescriptor,
  parts: MenuOptionDeps,
) {
  return {
    ...menu,
    ...boxConnectionOptions(descriptor, parts),
    ...boxStatusOptions(descriptor, parts),
    ...boxSetupOptions(descriptor, parts),
  };
}

/** One box in the wizard's box step: connection and setup, no live status. */
export function wizardBoxOptions(
  menu: MenuOptionsBag,
  descriptor: ExternalSensorDescriptor,
  parts: MenuOptionDeps,
) {
  return {
    ...menu,
    ...boxConnectionOptions(descriptor, parts),
    ...boxSetupOptions(descriptor, parts),
  };
}
