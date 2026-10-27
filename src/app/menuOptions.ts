/**
 * The options handed to the Settings page and the ☰ menu, the box pages
 * and the wizard's box step, assembled from the shared groups in
 * `menuOptionParts.ts`.
 */
import { soundPrefsOf, type LevelSettings } from '../domain/settings';
import { easyLevelSettings } from '../domain/sensorDeviceSettings';
import type { EasyLevelSensor } from '../sensor/easyLevelSensor';
import type { BoxDescriptor } from '../sensor/boxes';
import type { XparkleSensor } from '../sensor/xparkleSensor';
import { withEasyLevelConnectDelay, type SettingsAccess } from './boxWiring';
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

export interface MenuOptionsDeps {
  parts: MenuOptionDeps;
  settings: () => LevelSettings;
  onSettingsSaved(next: LevelSettings): void;
  openBoxPage(): void;
  shareVehicleSetup(current: LevelSettings): void;
}

/** What the Settings page and the ☰ menu read, in the groups their
 * embedded sections take. */
export function buildMenuOptions(deps: MenuOptionsDeps) {
  const { parts, settings } = deps;
  const initial = settings();
  return {
    initialSettings: initial,
    onSettingsSaved: (next: LevelSettings) => deps.onSettingsSaved(next),
    getSoundPrefs: () => soundPrefsOf(settings()),
    calibration: {
      appearance: initial.appearance,
      ...calibrationOptions(parts),
      openBoxPage: deps.openBoxPage,
    },
    targets: { ...targetOptions(parts.targets), ...hitchOptions(parts) },
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
