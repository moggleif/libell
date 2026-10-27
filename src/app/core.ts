/**
 * The app's state and the sensors, before any page exists: the settings,
 * the sensor controller, and every calibration layer for the active source.
 * What it calls back into (`Screen`) is filled in by the pages and the main
 * screen, and only called once start-up is over.
 */
import { combineCalibrations } from '../domain/calibration';
import type { LevelSettings, SensorSource } from '../domain/settings';
import { trimmedZero } from '../domain/zeroTrim';
import { isBoxPending, loadSettings, saveSettings, setBoxPending } from '../data/settingsStore';
import { loadRememberedDeviceId, saveRememberedDeviceId } from '../data/sensorDeviceStore';
import { createOrientationSensor, type OrientationSensor } from '../sensor/orientation';
import { createBoxController, type BoxController } from '../sensor/boxController';
import type { XparkleSensor } from '../sensor/xparkleSensor';
import { applyAppearance, applyTheme, followSystemTheme } from '../ui/theme';
import { createAppSettings, type AppSettings } from './appSettings';
import { createBoxZeroing } from './boxZero';
import { createDemoSensor } from './demoSensor';
import { createHitchHeight } from './hitchHeight';
import { createVehicles } from './vehicles';
import {
  createBox,
  hasPersistentDeviceAccess,
  isRememberedDeviceUsable,
  type BoxWiring,
  type LibellBox,
} from './boxWiring';
import { createBoxPending, type BoxPending, type Refreshable } from './indicatorWiring';
import { createInstallOffsets, type InstallOffsets } from './installOffsets';
import type { LevelScreenHost } from './levelScreen';
import type { MenuOptionDeps } from './menuOptionParts';
import type { Navigation } from './navigation';
import { createPhoneCalibration, type PhoneCalibration } from './phoneCalibration';
import type { SettingsSurface } from './settingsSurface';
import { createSound, type Sound } from './sound';
import { createTargets } from './targets';
import { readTilt } from './tiltReading';
import { countSensor } from './usage';
import { createZeroTrims, type ZeroTrims } from './zeroTrims';

export interface Core {
  settings: AppSettings;
  /** ?demo: a fixed synthetic tilt, for screenshots and sensorless machines. */
  demo: boolean;
  sound: Sound;
  boxPending: BoxPending;
  boxes: BoxController<LibellBox>;
  /** The source feeding readings right now (ADR 0014); call it each time, it changes. */
  sensor: () => OrientationSensor;
  /** Calibration, zero and target (or the hitch height), combined, for the
   * active source. */
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
  choiceBadges: Refreshable;
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
  const boxes = createSensorController(settings, demo, screen);
  const sensor = () => boxes.getActiveSensor();
  const layers = createCalibrationLayers(sensor, boxes, boxPending, screen);
  const hitch = createHitchHeight({
    readTilt: layers.readTiltNow,
    zeroCalibration: layers.zeroCalibration,
    isCaravan: () => settings.get().vehicleType === 'caravan',
    onChanged: () => screen.choiceBadges.refresh(),
  });
  const boxWiring: BoxWiring = {
    settings,
    getSensor: (source) => boxes.getSensor(source),
    onMountingChanged: () => screen.lamps.refresh(),
  };
  // Going back to the hitch height measures against it, not a target.
  const effectiveCalibration = () =>
    hitch.activeCalibration() ??
    combineCalibrations(layers.zeroCalibration(), layers.targets.activeOffset());
  return {
    settings,
    demo,
    sound: createSound(),
    boxPending,
    boxes,
    sensor,
    effectiveCalibration,
    activeInstallOffset: layers.activeInstallOffset,
    optionDeps: {
      activeSensor: sensor,
      readTilt: layers.readTiltNow,
      effectiveCalibration,
      phoneCalibration: layers.phoneCalibration,
      boxZero: layers.boxZero,
      installOffsets: layers.installOffsets,
      zeroTrims: layers.zeroTrims,
      targets: layers.targets,
      hitch,
      vehicles: createAppVehicles(screen),
      boxes,
      boxWiring,
    },
  };
}

/** A switch starts the app again on that vehicle (ADR 0017); a rename
 * redraws the main-screen badge (#616). */
function createAppVehicles(screen: Screen) {
  return createVehicles({
    reload: () => location.reload(),
    onRenamed: () => screen.choiceBadges.refresh(),
  });
}

/**
 * The phone sensor lives for the whole session, so switching back to it
 * needs no new permission.
 */
function createSensorController(
  settings: AppSettings,
  demo: boolean,
  screen: Screen,
): BoxController<LibellBox> {
  const controller = createBoxController<LibellBox>({
    phoneSensor: demo ? createDemoSensor() : createOrientationSensor(),
    createSensor: (source) => createBox(source, settings.get),
    loadDeviceId: loadRememberedDeviceId,
    saveDeviceId: saveRememberedDeviceId,
    isRememberedDeviceUsable,
    getPreferredSource: () => settings.get().sensorSource,
    hasPersistentDeviceAccess,
    rememberSource(source) {
      countSensor(source);
      settings.set({ ...settings.get(), sensorSource: source });
    },
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

/** The active source's zero, fine adjustment included (#596). */
function activeZero(
  source: SensorSource,
  phone: PhoneCalibration,
  installOffsets: InstallOffsets,
  zeroTrims: ZeroTrims,
) {
  const zero = source === 'phone' ? phone.zero() : installOffsets.valueOf(source);
  return trimmedZero(zero, zeroTrims.valueOf(source));
}

/**
 * The phone's sensor bias and vehicle zero (ADR 0010). Taking either means
 * the phone is in use after all, so a box chosen in the wizard is no longer
 * awaited.
 */
function createPhoneLayers(
  readTiltNow: () => ReturnType<typeof readTilt>,
  boxPending: BoxPending,
  screen: Screen,
  zeroTrims: ZeroTrims,
): PhoneCalibration {
  return createPhoneCalibration({
    readTilt: readTiltNow,
    onCaptured() {
      boxPending.settle(false);
      screen.lamps.refresh();
    },
    onCleared: () => screen.lamps.refresh(),
    onVehicleZeroReplaced: () => zeroTrims.reset('phone'),
  });
}

/** What "level" means for the active source (ADR 0013/0014), and the active
 * target as a third term on top of it. */
function createCalibrationLayers(
  sensor: () => OrientationSensor,
  boxes: BoxController<LibellBox>,
  boxPending: BoxPending,
  screen: Screen,
) {
  const readTiltNow = () => readTilt(sensor());
  // Each box's installation offset (ADR 0014): a box's whole idea of level,
  // never combined with the phone's.
  const installOffsets = createInstallOffsets();
  const activeInstallOffset = () => installOffsets.valueOf(sensor().getSource());
  // Each source's fine adjustment (#596), dropped with the zero it adjusts.
  const zeroTrims = createZeroTrims();
  const phoneCalibration = createPhoneLayers(readTiltNow, boxPending, screen, zeroTrims);
  const boxZero = createBoxZeroing({
    activeSensor: sensor,
    getXparkle: () => boxes.getSensor('xparkle') as XparkleSensor | null,
    offsets: installOffsets,
    readTilt: readTiltNow,
    onChanged: () => screen.lamps.refresh(),
    onZeroReplaced: (source) => zeroTrims.reset(source),
  });
  const zeroCalibration = () =>
    activeZero(sensor().getSource(), phoneCalibration, installOffsets, zeroTrims);
  const targets = createTargets({
    readTilt: readTiltNow,
    zeroCalibration,
    onChanged: () => screen.choiceBadges.refresh(),
  });
  return {
    readTiltNow,
    installOffsets,
    activeInstallOffset,
    phoneCalibration,
    boxZero,
    zeroTrims,
    zeroCalibration,
    targets,
  };
}
