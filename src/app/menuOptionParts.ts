/**
 * The option groups the menu, the Settings page, the wizard and the box
 * pages share. Each group is built here once and spread into every bag
 * that needs it, so the same field can never be wired two ways.
 */
import type { Calibration } from '../domain/calibration';
import type { SensorSource } from '../domain/settings';
import type { TrimDirection } from '../domain/zeroTrim';
import { type EasyLevelMounting, easyLevelSettings } from '../domain/sensorDeviceSettings';
import type { BoxController } from '../sensor/boxController';
import type { BoxDescriptor } from '../sensor/boxes';
import type { OrientationSensor } from '../sensor/orientation';
import type { BoxZeroing } from './boxZero';
import type { HitchHeight } from './hitchHeight';
import {
  externalCalibrationStateFor,
  healthOf,
  learnMountingFor,
  passwordFor,
  pickEasyLevelMounting,
  type BoxWiring,
  type LibellBox,
} from './boxWiring';
import type { InstallOffsets } from './installOffsets';
import type { PhoneCalibration } from './phoneCalibration';
import type { Targets } from './targets';
import type { Vehicles } from './vehicles';
import type { ZeroTrims } from './zeroTrims';

export interface MenuOptionDeps {
  /** Read fresh on every use: the active source changes. */
  activeSensor: () => OrientationSensor;
  readTilt: () => Calibration | string;
  phoneCalibration: PhoneCalibration;
  boxZero: BoxZeroing;
  installOffsets: InstallOffsets;
  zeroTrims: ZeroTrims;
  targets: Targets;
  hitch: HitchHeight;
  vehicles: Vehicles;
  boxes: Pick<BoxController<LibellBox>, 'connect' | 'disconnect' | 'getSensor'>;
  boxWiring: BoxWiring;
}

/** The phone's calibration and vehicle zero, plus the active box's zero. */
export function calibrationOptions(deps: MenuOptionDeps) {
  const { phoneCalibration: phone, activeSensor } = deps;
  return {
    getCalibration: () => phone.bias(),
    getCalibrationCapturedAt: () => phone.biasCapturedAt(),
    calibrate: () => phone.calibrate(),
    applyCalibration: (next: Calibration) => phone.applyBias(next),
    clearCalibration: () => phone.clearBias(),
    checkCalibration: () => phone.checkBias(),
    getVehicleCalibration: () => phone.vehicleZero(),
    getVehicleCalibrationCapturedAt: () => phone.vehicleZeroCapturedAt(),
    calibrateVehicle: () => phone.zeroVehicle(),
    clearVehicleCalibration: () => phone.clearVehicleZero(),
    checkVehicleCalibration: () => phone.checkZero(),
    vehicleZeroTrim: zeroTrimOptions('phone', deps.zeroTrims, () => phone.vehicleZero() !== null),
    readTilt: deps.readTilt,
    isPhoneActive: () => activeSensor().getSource() === 'phone',
    getBox: () => externalCalibrationStateFor(activeSensor().getSource(), deps.installOffsets),
    calibrateBox: () => deps.boxZero.zero(activeSensor().getSource()),
  };
}

export function targetOptions(targets: Targets) {
  return {
    getTargetPresets: () => targets.presets(),
    getActiveTargetId: () => targets.activeId(),
    selectTarget: (id: string | null) => targets.select(id),
    addTargetPreset: (name: string) => targets.add(name),
    deleteTargetPreset: (id: string) => targets.remove(id),
    renameTargetPreset: (id: string, name: string) => targets.rename(id, name),
  };
}

/** A caravan's hitch height (#598), shown with the targets. */
export function hitchOptions(deps: MenuOptionDeps) {
  const { hitch } = deps;
  return {
    hitch: {
      isCaravan: () => deps.boxWiring.settings.get().vehicleType === 'caravan',
      savedPitch: () => hitch.savedPitch(),
      save: () => hitch.save(),
      isActive: () => hitch.isActive(),
      start: () => hitch.start(),
      stop: () => hitch.stop(),
    },
  };
}

export function sensorSourceOptions(deps: MenuOptionDeps) {
  return {
    getSensorSource: () => deps.activeSensor().getSource(),
    getSensorState: () => deps.activeSensor().getState(),
  };
}

/** One box's connection and its own installation zero: where one box is
 * bolted in says nothing about where another is. */
export function boxConnectionOptions(descriptor: BoxDescriptor, deps: MenuOptionDeps) {
  const { id } = descriptor;
  return {
    sensor: descriptor,
    connectSensor: () => deps.boxes.connect(id),
    disconnectSensor: () => deps.boxes.disconnect(),
    getInstallCalibration: () => deps.installOffsets.valueOf(id),
    getInstallCalibrationCapturedAt: () => deps.installOffsets.capturedAtOf(id),
    calibrateInstall: () => deps.boxZero.zero(id),
    clearInstallCalibration: () => deps.boxZero.clear(id),
    installZeroTrim: zeroTrimOptions(
      id,
      deps.zeroTrims,
      () => deps.installOffsets.valueOf(id) !== null,
    ),
  };
}

/** One source's fine adjustment of its zero (#596). */
function zeroTrimOptions(source: SensorSource, trims: ZeroTrims, hasZero: () => boolean) {
  return {
    hasZero,
    getTrim: () => trims.valueOf(source),
    nudge: (direction: TrimDirection) => trims.nudge(source, direction),
    reset: () => trims.reset(source),
  };
}

/** The password and mounting guide, for the boxes that have them. */
export function boxSetupOptions(descriptor: BoxDescriptor, deps: MenuOptionDeps) {
  return {
    password: passwordFor(descriptor.id, deps.boxWiring),
    learnMounting: learnMountingFor(descriptor.id, deps.boxWiring),
  };
}

/** One box's live status for its page; null until the box exists. */
export function boxStatusOptions(descriptor: BoxDescriptor, deps: MenuOptionDeps) {
  const box = () => deps.boxes.getSensor(descriptor.id);
  return {
    getHealth: () => healthOf(descriptor.id, box()),
    getDeviceId: () => box()?.getDeviceId() ?? null,
    getLastSampleAt: () => box()?.getLastSampleAt() ?? null,
    getRawAccel: () => box()?.getGravity() ?? null,
  };
}

export function easyLevelMountingOptions(boxWiring: BoxWiring) {
  return {
    getMounting: () => easyLevelSettings(boxWiring.settings.get()).mounting,
    setMounting: (mounting: EasyLevelMounting) => pickEasyLevelMounting(mounting, boxWiring),
  };
}
