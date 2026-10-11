import { describe, expect, it } from 'vitest';
import {
  loadInstallCalibrationInfo,
  saveInstallCalibration,
  type KeyValueStorage,
} from '../data/settingsStore';
import { createInstallOffsets } from './installOffsets';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('createInstallOffsets', () => {
  it('starts from what each box has stored', () => {
    const storage = memoryStorage();
    saveInstallCalibration('easylevel', { rollDeg: 1.5, pitchDeg: -0.5 }, storage, 1000);
    const offsets = createInstallOffsets(storage);
    expect(offsets.valueOf('easylevel')).toEqual({ rollDeg: 1.5, pitchDeg: -0.5 });
    expect(offsets.capturedAtOf('easylevel')).toBe(1000);
    expect(offsets.valueOf('xparkle')).toBeNull();
    expect(offsets.capturedAtOf('xparkle')).toBeNull();
  });

  it('never holds an offset for the phone, which has its own calibrations', () => {
    const offsets = createInstallOffsets(memoryStorage());
    offsets.store('easylevel', { rollDeg: 1, pitchDeg: 1 }, 5);
    expect(offsets.valueOf('phone')).toBeNull();
    expect(offsets.capturedAtOf('phone')).toBeNull();
  });

  it('stores one box without touching another (#263)', () => {
    const storage = memoryStorage();
    const offsets = createInstallOffsets(storage);
    offsets.store('xparkle', { rollDeg: 0, pitchDeg: 0 }, 2000);
    expect(offsets.valueOf('xparkle')).toEqual({ rollDeg: 0, pitchDeg: 0 });
    expect(offsets.capturedAtOf('xparkle')).toBe(2000);
    expect(offsets.valueOf('easylevel')).toBeNull();
    expect(loadInstallCalibrationInfo('xparkle', storage)).toEqual({
      value: { rollDeg: 0, pitchDeg: 0 },
      capturedAt: 2000,
    });
  });

  it('clears a box in memory and in storage', () => {
    const storage = memoryStorage();
    saveInstallCalibration('easylevel', { rollDeg: 2, pitchDeg: 3 }, storage, 10);
    const offsets = createInstallOffsets(storage);
    offsets.clear('easylevel');
    expect(offsets.valueOf('easylevel')).toBeNull();
    expect(offsets.capturedAtOf('easylevel')).toBeNull();
    expect(loadInstallCalibrationInfo('easylevel', storage)).toBeNull();
  });
});
