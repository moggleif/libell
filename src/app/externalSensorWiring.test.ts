import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import {
  easyLevelSettings,
  MAX_EASYLEVEL_CONNECT_DELAY_MS,
  xparkleSettings,
} from '../domain/sensorDeviceSettings';
import { SIMULATED_EASYLEVEL_DEVICE_ID } from '../sensor/easyLevelSimulator';
import type { EasyLevelSensor } from '../sensor/easyLevelSensor';
import type { XparkleSensor } from '../sensor/xparkleSensor';
import {
  createExternalSensor,
  externalCalibrationStateFor,
  healthOf,
  isRememberedDeviceUsable,
  learnMountingFor,
  passwordFor,
  pickEasyLevelMounting,
  withEasyLevelConnectDelay,
  type BoxWiring,
  type LibellExternalSensor,
} from './externalSensorWiring';
import type { InstallOffsets } from './installOffsets';

/** An EasyLevel box with just the parts the wiring reads. */
function fakeEasyLevel(parts: Partial<EasyLevelSensor> = {}): EasyLevelSensor {
  return {
    getSource: () => 'easylevel',
    getState: () => 'granted',
    getStatus: () => null,
    getRawGravity: () => null,
    ...parts,
  } as EasyLevelSensor;
}

/** An Xparkle box with just the parts the wiring reads. */
function fakeXparkle(parts: Partial<XparkleSensor> = {}): XparkleSensor {
  return {
    getSource: () => 'xparkle',
    getState: () => 'granted',
    getReading: () => null,
    getOrientation: () => null,
    isPasswordRejected: () => false,
    verifyPassword: () => Promise.resolve(true),
    ...parts,
  } as XparkleSensor;
}

/** Settings held in memory, with every write and refresh recorded. */
function wiringWith(
  sensors: Partial<Record<'easylevel' | 'xparkle', LibellExternalSensor>> = {},
  initial: LevelSettings = DEFAULT_SETTINGS,
) {
  let current = initial;
  const saved: LevelSettings[] = [];
  const onMountingChanged = vi.fn();
  const wiring: BoxWiring = {
    settings: {
      get: () => current,
      set: (next) => {
        current = next;
        saved.push(next);
      },
    },
    getSensor: (source) => (source === 'phone' ? null : (sensors[source] ?? null)),
    onMountingChanged,
  };
  return { wiring, saved, onMountingChanged, current: () => current };
}

describe('createExternalSensor', () => {
  it('builds an adapter for each box and none for the phone', () => {
    const settings = () => DEFAULT_SETTINGS;
    expect(createExternalSensor('phone', settings)).toBeNull();
    expect(createExternalSensor('xparkle', settings)?.getSource()).toBe('xparkle');
    expect(createExternalSensor('easylevel', settings)?.getSource()).toBe('easylevel');
  });
});

describe('isRememberedDeviceUsable', () => {
  it('asks each box its own question (#223)', () => {
    // Outside a simulation, only a real EasyLevel id can be reached.
    expect(isRememberedDeviceUsable('easylevel', 'real-id')).toBe(true);
    expect(isRememberedDeviceUsable('easylevel', SIMULATED_EASYLEVEL_DEVICE_ID)).toBe(false);
  });
});

describe('healthOf', () => {
  it('maps the EasyLevel status struct, firmware tier as text', () => {
    const box = fakeEasyLevel({
      getStatus: () =>
        ({ batteryPercent: 80, temperatureCelsius: 21.5, firmwareTier: 3 }) as ReturnType<
          EasyLevelSensor['getStatus']
        >,
    });
    expect(healthOf('easylevel', box)).toEqual({
      batteryPercent: 80,
      temperatureCelsius: 21.5,
      firmwareLabel: '3',
    });
  });

  it('maps the Xparkle reading: battery and reported orientation only', () => {
    const box = fakeXparkle({
      getReading: () =>
        ({ batteryPercent: 62, pitchDeg: 1, rollDeg: 2 }) as ReturnType<
          XparkleSensor['getReading']
        >,
      getOrientation: () => 'rear',
    });
    expect(healthOf('xparkle', box)).toEqual({
      batteryPercent: 62,
      temperatureCelsius: null,
      firmwareLabel: null,
      reportedOrientation: 'rear',
    });
  });

  it('is null before anything has arrived, with no box, and for the phone', () => {
    expect(healthOf('easylevel', fakeEasyLevel())).toBeNull();
    expect(healthOf('xparkle', fakeXparkle())).toBeNull();
    expect(healthOf('easylevel', null)).toBeNull();
    expect(healthOf('phone', fakeEasyLevel())).toBeNull();
  });
});

describe('pickEasyLevelMounting', () => {
  it('stores a pick, saves and refreshes', () => {
    const { wiring, saved, onMountingChanged, current } = wiringWith();
    pickEasyLevelMounting('rotated90', wiring);
    expect(easyLevelSettings(current())).toMatchObject({
      mounting: 'rotated90',
      mountingPicked: true,
    });
    expect(saved).toHaveLength(1);
    expect(onMountingChanged).toHaveBeenCalledTimes(1);
  });

  it('forgets a pick back to the standard placement (#359)', () => {
    const { wiring, current } = wiringWith();
    pickEasyLevelMounting('rotated90', wiring);
    pickEasyLevelMounting(null, wiring);
    expect(easyLevelSettings(current())).toMatchObject({
      mounting: 'standard',
      mountingPicked: false,
    });
  });
});

describe('withEasyLevelConnectDelay', () => {
  it('stores the switch and a rounded delay', () => {
    const next = withEasyLevelConnectDelay(DEFAULT_SETTINGS, true, 412.6);
    expect(easyLevelSettings(next)).toMatchObject({
      connectDelayEnabled: true,
      connectDelayMs: 413,
    });
  });

  it('clamps the delay to its range, and reads garbage as zero (#212)', () => {
    const delay = (ms: number) =>
      easyLevelSettings(withEasyLevelConnectDelay(DEFAULT_SETTINGS, false, ms)).connectDelayMs;
    expect(delay(-50)).toBe(0);
    expect(delay(MAX_EASYLEVEL_CONNECT_DELAY_MS + 1000)).toBe(MAX_EASYLEVEL_CONNECT_DELAY_MS);
    expect(delay(Number.NaN)).toBe(0);
  });
});

describe('learnMountingFor', () => {
  it('offers no guide for the phone', () => {
    expect(learnMountingFor('phone', wiringWith().wiring)).toBeUndefined();
  });

  describe('Xparkle', () => {
    it('reads the box as it reports itself, only while connected', () => {
      const reading = { batteryPercent: 50, pitchDeg: 1.5, rollDeg: -2 } as ReturnType<
        XparkleSensor['getReading']
      >;
      const connected = learnMountingFor(
        'xparkle',
        wiringWith({ xparkle: fakeXparkle({ getReading: () => reading }) }).wiring,
      )!;
      expect(connected.getRawReading()).toEqual({ pitchDeg: 1.5, rollDeg: -2 });

      const lost = learnMountingFor(
        'xparkle',
        wiringWith({
          xparkle: fakeXparkle({ getState: () => 'disconnected', getReading: () => reading }),
        }).wiring,
      )!;
      expect(lost.getRawReading()).toBeNull();
      expect(learnMountingFor('xparkle', wiringWith().wiring)!.getRawReading()).toBeNull();
    });

    it('stores the learned axis mapping and refreshes', () => {
      const { wiring, saved, onMountingChanged, current } = wiringWith();
      const guide = learnMountingFor('xparkle', wiring)!;
      const mapping = { swap: true, pitchSign: -1 as const, rollSign: 1 as const };
      guide.setLearnedMounting(mapping);
      expect(xparkleSettings(current()).axisMapping).toEqual(mapping);
      expect(guide.getLearnedMounting()).toEqual(mapping);
      expect(saved).toHaveLength(1);
      expect(onMountingChanged).toHaveBeenCalledTimes(1);
      expect(guide.check).toBeUndefined();
    });
  });

  describe('EasyLevel', () => {
    it('reads the unrotated gravity as degrees, only while connected', () => {
      const raw = { x: 1, y: 1, z: 1 };
      const guide = learnMountingFor(
        'easylevel',
        wiringWith({ easylevel: fakeEasyLevel({ getRawGravity: () => raw }) }).wiring,
      )!;
      const reading = guide.getRawReading()!;
      expect(reading.rollDeg).toBeCloseTo(45);
      expect(reading.pitchDeg).toBeCloseTo(45);

      const lost = learnMountingFor(
        'easylevel',
        wiringWith({
          easylevel: fakeEasyLevel({ getState: () => 'disconnected', getRawGravity: () => raw }),
        }).wiring,
      )!;
      expect(lost.getRawReading()).toBeNull();
    });

    it('shows a mounting as learned only once it was picked', () => {
      const { wiring } = wiringWith();
      const guide = learnMountingFor('easylevel', wiring)!;
      expect(guide.getLearnedMounting()).toBeNull();
      pickEasyLevelMounting('rotated90', wiring);
      expect(guide.getLearnedMounting()).toEqual({ swap: true, pitchSign: 1, rollSign: -1 });
    });

    it("accepts the manual's two placements and explains the rest (#360)", () => {
      const guide = learnMountingFor('easylevel', wiringWith().wiring)!;
      expect(guide.check!({ swap: false, pitchSign: 1, rollSign: 1 })).toBeNull();
      expect(guide.check!({ swap: true, pitchSign: 1, rollSign: -1 })).toBeNull();
      expect(guide.check!({ swap: false, pitchSign: -1, rollSign: -1 })).toBe(
        'sensorSource.learn.err.arrow',
      );
      expect(guide.check!({ swap: false, pitchSign: 1, rollSign: -1 })).toBe(
        'sensorSource.learn.err.mirrored',
      );
    });

    it('stores a learned mapping as a placement pick, and null forgets it', () => {
      const { wiring, current, onMountingChanged } = wiringWith();
      const guide = learnMountingFor('easylevel', wiring)!;
      guide.setLearnedMounting({ swap: true, pitchSign: 1, rollSign: -1 });
      expect(easyLevelSettings(current())).toMatchObject({
        mounting: 'rotated90',
        mountingPicked: true,
      });
      guide.setLearnedMounting(null);
      expect(easyLevelSettings(current())).toMatchObject({
        mounting: 'standard',
        mountingPicked: false,
      });
      expect(onMountingChanged).toHaveBeenCalledTimes(2);
    });
  });
});

describe('passwordFor', () => {
  it('exists only for the Xparkle box', () => {
    expect(passwordFor('easylevel', wiringWith().wiring)).toBeUndefined();
    expect(passwordFor('phone', wiringWith().wiring)).toBeUndefined();
  });

  it('reports a rejection from the live box', () => {
    const rejected = passwordFor(
      'xparkle',
      wiringWith({ xparkle: fakeXparkle({ isPasswordRejected: () => true }) }).wiring,
    )!;
    expect(rejected.isRejected()).toBe(true);
    expect(passwordFor('xparkle', wiringWith().wiring)!.isRejected()).toBe(false);
  });

  it('keeps a typed code and tries it on the live link (#367)', async () => {
    const verifyPassword = vi.fn(() => Promise.resolve(true));
    const { wiring, current, saved } = wiringWith({ xparkle: fakeXparkle({ verifyPassword }) });
    await expect(passwordFor('xparkle', wiring)!.tryPassword('1234')).resolves.toBe(true);
    expect(xparkleSettings(current()).password).toBe('1234');
    expect(saved).toHaveLength(1);
    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });

  it('keeps the code with no box to ask, and says it could not ask', async () => {
    const { wiring, current } = wiringWith();
    await expect(passwordFor('xparkle', wiring)!.tryPassword('4321')).resolves.toBeNull();
    expect(xparkleSettings(current()).password).toBe('4321');
  });
});

describe('externalCalibrationStateFor', () => {
  const offsets: InstallOffsets = {
    valueOf: (source) => (source === 'easylevel' ? { rollDeg: 1, pitchDeg: 2 } : null),
    capturedAtOf: (source) => (source === 'easylevel' ? 1234 : null),
    store: () => {},
    clear: () => {},
  };

  it("describes a box's name, zero and when it was taken", () => {
    expect(externalCalibrationStateFor('easylevel', offsets)).toEqual({
      name: 'EasyLevel',
      offset: { rollDeg: 1, pitchDeg: 2 },
      capturedAt: 1234,
    });
    expect(externalCalibrationStateFor('xparkle', offsets)).toEqual({
      name: 'Xparkle RVS01',
      offset: null,
      capturedAt: null,
    });
  });

  it('is null for the phone', () => {
    expect(externalCalibrationStateFor('phone', offsets)).toBeNull();
  });
});
