/**
 * The app's state and the sensors, before any page exists: the settings,
 * the sensor controller, and every calibration layer for the active source.
 * What it calls back into (`Screen`) is filled in by the pages and the main
 * screen, and only called once start-up is over.
 */
import { combineCalibrations } from '../domain/calibration';
import type { LevelSettings } from '../domain/settings';
import { isBoxPending, loadSettings, saveSettings, setBoxPending } from '../data/settingsStore';
import { loadRememberedDeviceId, saveRememberedDeviceId } from '../data/sensorDeviceStore';
import { createOrientationSensor, type OrientationSensor } from '../sensor/orientation';
import {
  createExternalSensorController,
  type ExternalSensorController,
} from '../sensor/externalSensorController';
import type { XparkleSensor } from '../sensor/xparkleSensor';
import { applyAppearance, applyTheme, followSystemTheme } from '../ui/theme';
import { createAppSettings, type AppSettings } from './appSettings';
import { createBoxZeroing } from './boxZero';
import { createDemoSensor } from './demoSensor';
import {
  createExternalSensor,
  hasPersistentDeviceAccess,
  isRememberedDeviceUsable,
  type BoxWiring,
  type LibellExternalSensor,
} from './externalSensorWiring';
import { createBoxPending, type BoxPending, type Refreshable } from './indicatorWiring';
import { createInstallOffsets } from './installOffsets';
import type { LevelScreenHost } from './levelScreen';
import type { MenuOptionDeps } from './menuOptionParts';
import type { Navigation } from './navigation';
import { createPhoneCalibration } from './phoneCalibration';
import type { SettingsSurface } from './settingsSurface';
import { createSound, type Sound } from './sound';
import { createTargets } from './targets';
import { readTilt } from './tiltReading';

export interface Core {
  settings: AppSettings;
  /** ?demo: a fixed synthetic tilt, for screenshots and sensorless machines. */
  demo: boolean;
  sound: Sound;
  boxPending: BoxPending;
  externalSensors: ExternalSensorController<LibellExternalSensor>;
  /** The source feeding readings right now (ADR 0014); call it each time, it changes. */
  sensor: () => OrientationSensor;
  /** Calibration, zero and target, combined, for the active source. */
  effectiveCalibration: () => ReturnType<typeof combineCalibrations>;
  activeInstallOffset: () => ReturnType<ReturnType<typeof createInstallOffsets>['valueOf']>;
  optionDeps: MenuOptionDeps;
}

/**
 * What the core calls back into, created after it. Filled in during
 * start-up and only called once start-up is over.
 */
export interface Screen {
  lamps: Refreshable;
  targetBadge: Refreshable;
  sensorStatus: Refreshable;
  levelScreen: LevelScreenHost;
  settingsSurface: SettingsSurface;
  navigation: Navigation;
}

export function applyLook(settings: LevelSettings): void {
  applyTheme(settings.theme);
  applyAppearance(settings.appearance);
}

export function createCore(screen: Screen): Core {
  const settings = createAppSettings(loadSettings(), saveSettings);
  applyLook(settings.get());
  followSystemTheme(() => settings.get().theme);
  const demo = new URLSearchParams(location.search).has('demo');
  const boxPending = createBoxPending({ load: isBoxPending, save: setBoxPending });
  const externalSensors = createSensorController(settings, demo, screen);
  const sensor = () => externalSensors.getActiveSensor();
  const layers = createCalibrationLayers(sensor, externalSensors, boxPending, screen);
  const boxWiring: BoxWiring = {
    settings,
    getSensor: (source) => externalSensors.getSensor(source),
    onMountingChanged: () => screen.lamps.refresh(),
  };
  return {
    settings,
    demo,
    sound: createSound(),
    boxPending,
    externalSensors,
    sensor,
    effectiveCalibration: () =>
      combineCalibrations(layers.zeroCalibration(), layers.targets.activeOffset()),
    activeInstallOffset: layers.activeInstallOffset,
    optionDeps: {
      activeSensor: sensor,
      readTilt: layers.readTiltNow,
      phoneCalibration: layers.phoneCalibration,
      boxZero: layers.boxZero,
      installOffsets: layers.installOffsets,
      targets: layers.targets,
      externalSensors,
      boxWiring,
    },
  };
}

/**
 * The phone sensor lives for the whole session, so switching back to it
 * needs no new permission.
 */
function createSensorController(
  settings: AppSettings,
  demo: boolean,
  screen: Screen,
): ExternalSensorController<LibellExternalSensor> {
  const controller = createExternalSensorController<LibellExternalSensor>({
    phoneSensor: demo ? createDemoSensor() : createOrientationSensor(),
    createSensor: (source) => createExternalSensor(source, settings.get),
    loadDeviceId: loadRememberedDeviceId,
    saveDeviceId: saveRememberedDeviceId,
    isRememberedDeviceUsable,
    getPreferredSource: () => settings.get().sensorSource,
    hasPersistentDeviceAccess,
    rememberSource: (source) => settings.set({ ...settings.get(), sensorSource: source }),
    // The level screen may never have been built (a desktop without
    // motion sensors): build it now a real source feeds readings.
    onLevelScreenNeeded: () => screen.levelScreen.show(),
    // The calibration lamp follows the active source.
    onIndicatorsChanged() {
      screen.lamps.refresh();
      screen.settingsSurface.followSource(controller.getActiveSensor().getSource());
    },
    onStatusChanged: () => screen.sensorStatus.refresh(),
  });
  return controller;
}

/** What "level" means for the active source (ADR 0013/0014), and the active
 * target as a third term on top of it. */
function createCalibrationLayers(
  sensor: () => OrientationSensor,
  externalSensors: ExternalSensorController<LibellExternalSensor>,
  boxPending: BoxPending,
  screen: Screen,
) {
  const readTiltNow = () => readTilt(sensor());
  // Each box's installation offset (ADR 0014): a box's whole idea of level,
  // never combined with the phone's.
  const installOffsets = createInstallOffsets();
  const activeInstallOffset = () => installOffsets.valueOf(sensor().getSource());
  // The phone's sensor bias and vehicle zero (ADR 0010). Taking either means
  // the phone is in use after all, so a box chosen in the wizard is no longer
  // awaited.
  const phoneCalibration = createPhoneCalibration({
    readTilt: readTiltNow,
    onCaptured() {
      boxPending.settle(false);
      screen.lamps.refresh();
    },
    onCleared: () => screen.lamps.refresh(),
  });
  const boxZero = createBoxZeroing({
    activeSensor: sensor,
    getXparkle: () => externalSensors.getSensor('xparkle') as XparkleSensor | null,
    offsets: installOffsets,
    readTilt: readTiltNow,
    onChanged: () => screen.lamps.refresh(),
  });
  const zeroCalibration = () =>
    sensor().getSource() === 'phone' ? phoneCalibration.zero() : activeInstallOffset();
  const targets = createTargets({
    readTilt: readTiltNow,
    zeroCalibration,
    onActiveChanged: () => screen.targetBadge.refresh(),
  });
  return {
    readTiltNow,
    installOffsets,
    activeInstallOffset,
    phoneCalibration,
    boxZero,
    zeroCalibration,
    targets,
  };
}
