import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  availableExternalSensors,
  isLowBattery,
  LOW_BATTERY_HYSTERESIS_PERCENT,
  LOW_BATTERY_PERCENT,
  EXTERNAL_SENSORS,
  externalSensorById,
  hasAvailableExternalSensor,
} from './externalSensors';
import { EASYLEVEL_DESCRIPTOR } from './easyLevelSensor';
import { SENSOR_SOURCES } from '../domain/settings';

const originalNavigator = globalThis.navigator;

function setWebBluetooth(present: boolean): void {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: present ? { bluetooth: {} } : {},
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: originalNavigator,
  });
  vi.unstubAllGlobals();
});

describe('the external sensor registry (#262)', () => {
  it('lists EasyLevel, and only sources that are genuinely external', () => {
    expect(EXTERNAL_SENSORS).toHaveLength(1);
    expect(EXTERNAL_SENSORS[0]).toBe(EASYLEVEL_DESCRIPTOR);
    // The phone is the always-available fallback, not an external source:
    // it has no page, nothing to connect and nothing to remember.
    expect(EXTERNAL_SENSORS.some((sensor) => sensor.id === 'phone')).toBe(false);
  });

  it('gives every registered source an id that is a real SensorSource', () => {
    for (const sensor of EXTERNAL_SENSORS) {
      expect(SENSOR_SOURCES).toContain(sensor.id);
    }
  });

  it('never registers the same id twice', () => {
    const ids = EXTERNAL_SENSORS.map((sensor) => sensor.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every registered source a non-empty product name', () => {
    for (const sensor of EXTERNAL_SENSORS) {
      expect(sensor.displayName.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('availability (#262)', () => {
  it('reports nothing available without Web Bluetooth and without a simulator', () => {
    setWebBluetooth(false);
    expect(availableExternalSensors()).toEqual([]);
    expect(hasAvailableExternalSensor()).toBe(false);
  });

  it('reports EasyLevel available once Web Bluetooth exists', () => {
    setWebBluetooth(true);
    expect(availableExternalSensors()).toEqual([EASYLEVEL_DESCRIPTOR]);
    expect(hasAvailableExternalSensor()).toBe(true);
  });

  it('asks the descriptor every time rather than caching the first answer', () => {
    // Availability depends on the runtime environment and on query flags,
    // both read at call time — a cached answer would strand a session on
    // "unavailable" the way #223 found for the simulator flag.
    setWebBluetooth(false);
    expect(hasAvailableExternalSensor()).toBe(false);
    setWebBluetooth(true);
    expect(hasAvailableExternalSensor()).toBe(true);
  });
});

describe('externalSensorById (#262)', () => {
  it('finds a registered source by its stored id', () => {
    expect(externalSensorById('easylevel')).toBe(EASYLEVEL_DESCRIPTOR);
  });

  it('returns null for the phone, which is not an external source', () => {
    expect(externalSensorById('phone')).toBeNull();
  });

  it('returns null for a source id this build does not know', () => {
    // What a settings blob written by a newer build looks like here.
    // `parseSettings` already tolerates it; this must not be the place
    // that turns it into a crash.
    expect(externalSensorById('nothing-like-this' as never)).toBeNull();
  });
});

describe('the EasyLevel descriptor (#262)', () => {
  it('is the one place the product name is stated', () => {
    expect(EASYLEVEL_DESCRIPTOR.displayName).toBe('EasyLevel');
  });

  it('declares the rows this protocol can actually fill', () => {
    expect(EASYLEVEL_DESCRIPTOR.capabilities).toEqual({
      battery: true,
      temperature: true,
      firmwareVersion: true,
      mounting: true,
      installCalibration: true,
      debugBytes: true,
    });
  });
});

describe('isLowBattery (#123)', () => {
  it('enters the low state once battery drops below LOW_BATTERY_PERCENT', () => {
    expect(isLowBattery(LOW_BATTERY_PERCENT + 1, false)).toBe(false);
    expect(isLowBattery(LOW_BATTERY_PERCENT, false)).toBe(false);
    expect(isLowBattery(LOW_BATTERY_PERCENT - 1, false)).toBe(true);
  });

  it('does not leave the low state until back above the hysteresis band, not just the bare threshold', () => {
    // Still below threshold + hysteresis — stays low even though it's
    // technically back above the bare LOW_BATTERY_PERCENT threshold.
    const justAboveThreshold = LOW_BATTERY_PERCENT + 1;
    expect(justAboveThreshold).toBeLessThan(LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT);
    expect(isLowBattery(justAboveThreshold, true)).toBe(true);
  });

  it('leaves the low state once clearly above the hysteresis band', () => {
    expect(isLowBattery(LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT, true)).toBe(false);
    expect(isLowBattery(LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT + 1, true)).toBe(
      false,
    );
  });

  it('never flickers right at the bare threshold while already low', () => {
    // A reading oscillating around LOW_BATTERY_PERCENT itself must stay
    // "low" throughout, since it never clears the hysteresis band.
    let low = true;
    for (const percent of [19, 21, 19, 20, 19]) {
      low = isLowBattery(percent, low);
      expect(low).toBe(true);
    }
  });
});
