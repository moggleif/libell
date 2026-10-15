import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import { easyLevelSettings } from '../domain/sensorDeviceSettings';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { OrientationSensor } from '../sensor/orientation';
import { XPARKLE_DESCRIPTOR, type XparkleSensor } from '../sensor/xparkleSensor';
import type { BoxZeroing } from './boxZero';
import type { BoxWiring, LibellBox } from './boxWiring';
import type { InstallOffsets } from './installOffsets';
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
import type { PhoneCalibration } from './phoneCalibration';
import type { Targets } from './targets';
import { createZeroTrims } from './zeroTrims';

/** Every dependency as a spy, so each field can be checked for what it calls. */
function fakeDeps(source: 'phone' | 'easylevel' | 'xparkle' = 'phone') {
  let settings: LevelSettings = DEFAULT_SETTINGS;
  const xparkle = {
    getSource: () => 'xparkle',
    getState: () => 'granted',
    getDeviceId: () => 'box-1',
    getLastSampleAt: () => 1234,
    getGravity: () => ({ x: 0, y: 0, z: 9.81 }),
    getReading: () => ({ batteryPercent: 62, pitchDeg: 0, rollDeg: 0 }),
    getOrientation: () => 'front',
    isPasswordRejected: () => false,
  } as unknown as XparkleSensor;
  const active = {
    getSource: () => source,
    getState: () => 'granted',
  } as unknown as OrientationSensor;
  const phoneCalibration = {
    bias: vi.fn(() => ({ rollDeg: 1, pitchDeg: 1 })),
    biasCapturedAt: vi.fn(() => 10),
    vehicleZero: vi.fn(() => ({ rollDeg: 2, pitchDeg: 2 })),
    vehicleZeroCapturedAt: vi.fn(() => 20),
    zero: vi.fn(),
    calibrate: vi.fn(() => null),
    applyBias: vi.fn(),
    clearBias: vi.fn(),
    zeroVehicle: vi.fn(() => 'too steep'),
    clearVehicleZero: vi.fn(),
    checkBias: vi.fn(() => 'bias ok'),
    checkZero: vi.fn(() => 'zero ok'),
  } satisfies PhoneCalibration;
  const boxZero = {
    zero: vi.fn(() => null),
    clear: vi.fn(),
  } satisfies BoxZeroing;
  const installOffsets = {
    valueOf: vi.fn((s) => (s === 'xparkle' ? { rollDeg: 0, pitchDeg: 0 } : null)),
    capturedAtOf: vi.fn((s) => (s === 'xparkle' ? 99 : null)),
    store: vi.fn(),
    clear: vi.fn(),
  } satisfies InstallOffsets;
  const targets = {
    presets: vi.fn(() => []),
    activeId: vi.fn(() => 'a'),
    activeName: vi.fn(() => 'Ferry'),
    activeOffset: vi.fn(() => null),
    select: vi.fn(),
    add: vi.fn(() => null),
    remove: vi.fn(),
  } satisfies Targets;
  const boxes = {
    connect: vi.fn(() => Promise.resolve('granted' as const)),
    disconnect: vi.fn(),
    getSensor: vi.fn((s) => (s === 'xparkle' ? (xparkle as LibellBox) : null)),
  };
  const onMountingChanged = vi.fn();
  const boxWiring: BoxWiring = {
    settings: { get: () => settings, set: (next) => (settings = next) },
    getSensor: boxes.getSensor,
    onMountingChanged,
  };
  const readTilt = vi.fn(() => ({ rollDeg: 3, pitchDeg: 4 }));
  const zeroTrims = createZeroTrims(null);
  const deps: MenuOptionDeps = {
    activeSensor: () => active,
    readTilt,
    phoneCalibration,
    boxZero,
    installOffsets,
    zeroTrims,
    targets,
    boxes,
    boxWiring,
  };
  return {
    deps,
    zeroTrims,
    phoneCalibration,
    boxZero,
    targets,
    boxes,
    readTilt,
    onMountingChanged,
    settings: () => settings,
  };
}

describe('calibrationOptions', () => {
  it("hands every phone calibration field to the phone's calibration", () => {
    const { deps, phoneCalibration, readTilt } = fakeDeps();
    const options = calibrationOptions(deps);
    expect(options.getCalibration()).toEqual({ rollDeg: 1, pitchDeg: 1 });
    expect(options.getCalibrationCapturedAt()).toBe(10);
    expect(options.getVehicleCalibration()).toEqual({ rollDeg: 2, pitchDeg: 2 });
    expect(options.getVehicleCalibrationCapturedAt()).toBe(20);
    expect(options.calibrate()).toBeNull();
    expect(options.calibrateVehicle()).toBe('too steep');
    options.calibrate(true);
    expect(phoneCalibration.calibrate).toHaveBeenLastCalledWith(true);
    options.calibrateVehicle(true);
    expect(phoneCalibration.zeroVehicle).toHaveBeenLastCalledWith(true);
    expect(options.checkCalibration()).toBe('bias ok');
    expect(options.checkVehicleCalibration()).toBe('zero ok');
    expect(options.readTilt()).toEqual({ rollDeg: 3, pitchDeg: 4 });
    expect(readTilt).toHaveBeenCalledTimes(1);
    options.applyCalibration({ rollDeg: 5, pitchDeg: 6 });
    expect(phoneCalibration.applyBias).toHaveBeenCalledWith({ rollDeg: 5, pitchDeg: 6 });
    options.clearCalibration();
    expect(phoneCalibration.clearBias).toHaveBeenCalledTimes(1);
    options.clearVehicleCalibration();
    expect(phoneCalibration.clearVehicleZero).toHaveBeenCalledTimes(1);
  });

  it("fine-adjusts the phone's own vehicle zero (#596)", () => {
    const { deps, zeroTrims } = fakeDeps();
    const trim = calibrationOptions(deps).vehicleZeroTrim;
    expect(trim.hasZero()).toBe(true);
    trim.nudge('front');
    expect(zeroTrims.valueOf('phone')).toEqual({ rollDeg: 0, pitchDeg: 0.1 });
    expect(zeroTrims.valueOf('xparkle')).toEqual({ rollDeg: 0, pitchDeg: 0 });
  });

  it('follows the active source for the external fields', () => {
    const phone = calibrationOptions(fakeDeps('phone').deps);
    expect(phone.isPhoneActive()).toBe(true);
    expect(phone.getBox()).toBeNull();

    const { deps, boxZero } = fakeDeps('xparkle');
    const box = calibrationOptions(deps);
    expect(box.isPhoneActive()).toBe(false);
    expect(box.getBox()).toEqual({
      name: 'Xparkle RVS01',
      offset: { rollDeg: 0, pitchDeg: 0 },
      capturedAt: 99,
    });
    box.calibrateBox();
    expect(boxZero.zero).toHaveBeenCalledWith('xparkle');
    box.calibrateBox(true);
    expect(boxZero.zero).toHaveBeenLastCalledWith('xparkle', true);
  });
});

describe('targetOptions', () => {
  it('hands every field to the targets', () => {
    const { deps, targets } = fakeDeps();
    const options = targetOptions(deps.targets);
    expect(options.getTargetPresets()).toEqual([]);
    expect(options.getActiveTargetId()).toBe('a');
    options.selectTarget(null);
    expect(targets.select).toHaveBeenCalledWith(null);
    expect(options.addTargetPreset('Ferry')).toBeNull();
    expect(targets.add).toHaveBeenCalledWith('Ferry');
    options.deleteTargetPreset('a');
    expect(targets.remove).toHaveBeenCalledWith('a');
  });
});

describe('sensorSourceOptions', () => {
  it('reads the active source and its state live', () => {
    const options = sensorSourceOptions(fakeDeps('easylevel').deps);
    expect(options.getSensorSource()).toBe('easylevel');
    expect(options.getSensorState()).toBe('granted');
  });
});

describe('boxConnectionOptions', () => {
  it("wires one box's connection and zero to that box", async () => {
    const { deps, boxes, boxZero } = fakeDeps();
    const options = boxConnectionOptions(XPARKLE_DESCRIPTOR, deps);
    expect(options.sensor).toBe(XPARKLE_DESCRIPTOR);
    await options.connectSensor();
    expect(boxes.connect).toHaveBeenCalledWith('xparkle');
    options.disconnectSensor();
    expect(boxes.disconnect).toHaveBeenCalledTimes(1);
    expect(options.getInstallCalibration()).toEqual({ rollDeg: 0, pitchDeg: 0 });
    expect(options.getInstallCalibrationCapturedAt()).toBe(99);
    options.calibrateInstall();
    expect(boxZero.zero).toHaveBeenCalledWith('xparkle');
    options.calibrateInstall(true);
    expect(boxZero.zero).toHaveBeenLastCalledWith('xparkle', true);
    options.clearInstallCalibration();
    expect(boxZero.clear).toHaveBeenCalledWith('xparkle');
  });

  it("fine-adjusts that box's zero, and only that box's (#596)", () => {
    const { deps, zeroTrims } = fakeDeps();
    const xparkle = boxConnectionOptions(XPARKLE_DESCRIPTOR, deps).installZeroTrim;
    const easyLevel = boxConnectionOptions(EASYLEVEL_DESCRIPTOR, deps).installZeroTrim;
    expect(xparkle.hasZero()).toBe(true);
    expect(easyLevel.hasZero()).toBe(false);
    xparkle.nudge('left');
    expect(xparkle.getTrim()).toEqual({ rollDeg: -0.1, pitchDeg: 0 });
    expect(zeroTrims.valueOf('xparkle')).toEqual({ rollDeg: -0.1, pitchDeg: 0 });
    expect(easyLevel.getTrim()).toEqual({ rollDeg: 0, pitchDeg: 0 });
    xparkle.reset();
    expect(zeroTrims.valueOf('xparkle')).toEqual({ rollDeg: 0, pitchDeg: 0 });
  });

  it('has no setup extras', () => {
    const options = boxConnectionOptions(EASYLEVEL_DESCRIPTOR, fakeDeps().deps);
    expect('password' in options).toBe(false);
    expect('learnMounting' in options).toBe(false);
  });
});

describe('boxSetupOptions', () => {
  it("adds the box's password and learn guide where it has them", () => {
    const xparkle = boxSetupOptions(XPARKLE_DESCRIPTOR, fakeDeps().deps);
    expect(xparkle.password?.isRejected()).toBe(false);
    // Each box's own guide: the Xparkle one reads the connected box's angles,
    // the EasyLevel one finds no EasyLevel box here (#526).
    expect(xparkle.learnMounting?.getRawReading()).toEqual({ pitchDeg: 0, rollDeg: 0 });
    const easyLevel = boxSetupOptions(EASYLEVEL_DESCRIPTOR, fakeDeps().deps);
    expect(easyLevel.password).toBeUndefined();
    expect(easyLevel.learnMounting?.getRawReading()).toBeNull();
    expect(easyLevel.learnMounting?.check).toBeTypeOf('function');
  });
});

describe('boxStatusOptions', () => {
  it("reads one box's own live values, or nothing before it exists", () => {
    const { deps } = fakeDeps();
    const xparkle = boxStatusOptions(XPARKLE_DESCRIPTOR, deps);
    expect(xparkle.getHealth()).toMatchObject({ batteryPercent: 62 });
    expect(xparkle.getDeviceId()).toBe('box-1');
    expect(xparkle.getLastSampleAt()).toBe(1234);
    expect(xparkle.getRawAccel()).toEqual({ x: 0, y: 0, z: 9.81 });
    const easyLevel = boxStatusOptions(EASYLEVEL_DESCRIPTOR, deps);
    expect(easyLevel.getHealth()).toBeNull();
    expect(easyLevel.getDeviceId()).toBeNull();
    expect(easyLevel.getLastSampleAt()).toBeNull();
    expect(easyLevel.getRawAccel()).toBeNull();
  });
});

describe('easyLevelMountingOptions', () => {
  it('reads and picks the EasyLevel mounting through the settings', () => {
    const { deps, settings, onMountingChanged } = fakeDeps();
    const options = easyLevelMountingOptions(deps.boxWiring);
    expect(options.getMounting()).toBe('standard');
    options.setMounting('rotated90');
    expect(easyLevelSettings(settings()).mounting).toBe('rotated90');
    expect(options.getMounting()).toBe('rotated90');
    expect(onMountingChanged).toHaveBeenCalledTimes(1);
  });
});
