/**
 * The option groups the menu, the Settings page, the wizard and the box
 * pages share (#374). Each group is built here once and spread into every
 * bag that needs it, so the same field can never be wired two ways.
 */
import type { Calibration, EasyLevelMounting } from '../domain/settings';
import { easyLevelSettings } from '../domain/settings';
import type { ExternalSensorController } from '../sensor/externalSensorController';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import type { OrientationSensor } from '../sensor/orientation';
import type { BoxZeroing } from './boxZero';
import {
  externalCalibrationStateFor,
  healthOf,
  learnMountingFor,
  passwordFor,
  pickEasyLevelMounting,
  type BoxWiring,
  type LibellExternalSensor,
} from './externalSensorWiring';
import type { InstallOffsets } from './installOffsets';
import type { PhoneCalibration } from './phoneCalibration';
import type { Targets } from './targets';

export interface MenuOptionDeps {
  /** The source feeding readings right now, read fresh on every use. */
  activeSensor: () => OrientationSensor;
  readTilt: () => Calibration | string;
  phoneCalibration: PhoneCalibration;
  boxZero: BoxZeroing;
  installOffsets: InstallOffsets;
  targets: Targets;
  externalSensors: Pick<
    ExternalSensorController<LibellExternalSensor>,
    'connect' | 'disconnect' | 'getSensor'
  >;
  boxWiring: BoxWiring;
}

/** The phone's calibration and vehicle zero, plus the active box's zero. */
export function calibrationOptions(deps: MenuOptionDeps) {
  const { phoneCalibration: phone, activeSensor } = deps;
  return {
    getCalibration: () => phone.bias(),
    getCalibrationCapturedAt: () => phone.biasCapturedAt(),
    calibrate: (anyway?: boolean) => phone.calibrate(anyway),
    applyCalibration: (next: Calibration) => phone.applyBias(next),
    clearCalibration: () => phone.clearBias(),
    checkCalibration: () => phone.checkBias(),
    getVehicleCalibration: () => phone.vehicleZero(),
    getVehicleCalibrationCapturedAt: () => phone.vehicleZeroCapturedAt(),
    calibrateVehicle: (anyway?: boolean) => phone.zeroVehicle(anyway),
    clearVehicleCalibration: () => phone.clearVehicleZero(),
    checkVehicleCalibration: () => phone.checkZero(),
    readTilt: deps.readTilt,
    isPhoneActive: () => activeSensor().getSource() === 'phone',
    getExternalSensor: () =>
      externalCalibrationStateFor(activeSensor().getSource(), deps.installOffsets),
    calibrateExternalSensor: (anyway?: boolean) =>
      anyway
        ? deps.boxZero.zero(activeSensor().getSource(), true)
        : deps.boxZero.zero(activeSensor().getSource()),
  };
}

/** The target presets (#122). */
export function targetOptions(targets: Targets) {
  return {
    getTargetPresets: () => targets.presets(),
    getActiveTargetId: () => targets.activeId(),
    selectTarget: (id: string | null) => targets.select(id),
    addTargetPreset: (name: string, anyway?: boolean) =>
      anyway ? targets.add(name, true) : targets.add(name),
    deleteTargetPreset: (id: string) => targets.remove(id),
  };
}

/** Which source feeds readings, and how it is doing (#135). */
export function sensorSourceOptions(deps: MenuOptionDeps) {
  return {
    getSensorSource: () => deps.activeSensor().getSource(),
    getSensorState: () => deps.activeSensor().getState(),
  };
}

/** One box's connection and its own installation zero (#263): where one
 * box is bolted in says nothing about where another is. */
export function boxConnectionOptions(descriptor: ExternalSensorDescriptor, deps: MenuOptionDeps) {
  const { id } = descriptor;
  return {
    sensor: descriptor,
    connectSensor: () => deps.externalSensors.connect(id),
    disconnectSensor: () => deps.externalSensors.disconnect(),
    getInstallCalibration: () => deps.installOffsets.valueOf(id),
    getInstallCalibrationCapturedAt: () => deps.installOffsets.capturedAtOf(id),
    calibrateInstall: (anyway?: boolean) =>
      anyway ? deps.boxZero.zero(id, true) : deps.boxZero.zero(id),
    clearInstallCalibration: () => deps.boxZero.clear(id),
  };
}

/** The password and mounting guide, for the boxes that have them. */
export function boxSetupOptions(descriptor: ExternalSensorDescriptor, deps: MenuOptionDeps) {
  return {
    password: passwordFor(descriptor.id, deps.boxWiring),
    learnMounting: learnMountingFor(descriptor.id, deps.boxWiring),
  };
}

/** One box's live status for its page; null until the box exists. */
export function boxStatusOptions(descriptor: ExternalSensorDescriptor, deps: MenuOptionDeps) {
  const box = () => deps.externalSensors.getSensor(descriptor.id);
  return {
    getHealth: () => healthOf(descriptor.id, box()),
    getDeviceId: () => box()?.getDeviceId() ?? null,
    getLastSampleAt: () => box()?.getLastSampleAt() ?? null,
    getRawAccel: () => box()?.getGravity() ?? null,
  };
}

/** The EasyLevel mounting (#217). */
export function easyLevelMountingOptions(boxWiring: BoxWiring) {
  return {
    getMounting: () => easyLevelSettings(boxWiring.settings.get()).mounting,
    isMountingPicked: () => easyLevelSettings(boxWiring.settings.get()).mountingPicked,
    setMounting: (mounting: EasyLevelMounting | null) => pickEasyLevelMounting(mounting, boxWiring),
  };
}
