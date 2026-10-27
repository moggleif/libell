/**
 * The options bags handed to the Settings page, the ☰ menu, the box pages
 * and the wizard's box step, assembled from the shared groups in
 * `menuOptionParts.ts`.
 */
import { soundPrefsOf, type LevelSettings } from '../domain/settings';
import { easyLevelSettings } from '../domain/sensorDeviceSettings';
import type { EasyLevelSensor } from '../sensor/easyLevelSensor';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { BoxDescriptor } from '../sensor/boxes';
import type { XparkleSensor } from '../sensor/xparkleSensor';
import { healthOf, withEasyLevelConnectDelay, type SettingsAccess } from './boxWiring';
import {
  boxConnectionOptions,
  boxSetupOptions,
  boxStatusOptions,
  calibrationOptions,
  easyLevelMountingOptions,
  hitchOptions,
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
  openBoxPage(): void;
  shareVehicleSetup(current: LevelSettings): void;
}

/** Every field the Settings page and the ☰ menu need. */
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
    openBoxPage: deps.openBoxPage,
    ...targetOptions(parts.targets),
    ...hitchOptions(parts),
    getCalibratedTilt: () => calibratedTilt(parts.activeSensor(), parts.effectiveCalibration()),
    getVehicleType: () => settings().vehicleType,
    getActiveTargetName: () => parts.targets.activeName(),
    getHealth: () => healthOf('easylevel', parts.boxes.getSensor('easylevel')),
    ...debugByteOptions(parts),
    ...easyLevelConnectDelayOptions(settingsAccess),
    getSoundPrefs: () => soundPrefsOf(settings()),
    onShareVehicleSetup: (current: LevelSettings) => deps.shareVehicleSetup(current),
    vehicles: parts.vehicles,
  };
}

/**
 * What every box's page and wizard step reads besides its own connection:
 * the active source, the EasyLevel's mounting, the vehicle the mounting
 * picker draws and the live reading for the position step.
 */
function boxCommonOptions(parts: MenuOptionDeps) {
  return {
    ...sensorSourceOptions(parts),
    ...easyLevelMountingOptions(parts.boxWiring),
    getVehicleType: () => parts.boxWiring.settings.get().vehicleType,
    getCalibratedTilt: () => calibratedTilt(parts.activeSensor(), parts.effectiveCalibration()),
  };
}

/** One box in the wizard's box step: connection and setup, no live status. */
export function wizardBoxOptions(descriptor: BoxDescriptor, parts: MenuOptionDeps) {
  return {
    ...boxCommonOptions(parts),
    ...boxConnectionOptions(descriptor, parts),
    ...boxSetupOptions(descriptor, parts),
  };
}

/** One box's own page: its connection, live status, setup and debug extras. */
export function boxPageOptions(descriptor: BoxDescriptor, parts: MenuOptionDeps) {
  return {
    ...wizardBoxOptions(descriptor, parts),
    ...boxStatusOptions(descriptor, parts),
    ...debugByteOptions(parts),
    ...easyLevelConnectDelayOptions(parts.boxWiring.settings),
  };
}

/** Debug-only; the transport reads the settings live, so a change applies
 * on the next connect. */
function easyLevelConnectDelayOptions(settings: SettingsAccess) {
  return {
    getEasyLevelConnectDelay: () => {
      const { connectDelayEnabled, connectDelayMs } = easyLevelSettings(settings.get());
      return { enabled: connectDelayEnabled, ms: connectDelayMs };
    },
    setEasyLevelConnectDelay: (enabled: boolean, ms: number) =>
      settings.set(withEasyLevelConnectDelay(settings.get(), enabled, ms)),
  };
}

/** Each box's own raw bytes for its debug disclosure: the EasyLevel's status
 * bytes, the Xparkle's serial number and firmware (#597). */
function debugByteOptions(parts: MenuOptionDeps) {
  return {
    getEasyLevelStatusBytes: () => {
      const sensor = parts.boxes.getSensor('easylevel');
      return sensor && sensor.getSource() === 'easylevel'
        ? (sensor as EasyLevelSensor).getStatusBytes()
        : null;
    },
    getXparkleVersionBytes: () => {
      const sensor = parts.boxes.getSensor('xparkle');
      return sensor && sensor.getSource() === 'xparkle'
        ? (sensor as XparkleSensor).getVersionBytes()
        : null;
    },
  };
}
