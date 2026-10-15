import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStorage } from '../data/keyValueStorage';
import { loadHitchPitch } from '../data/settingsStore';
import type { Calibration } from '../domain/calibration';
import { createHitchHeight } from './hitchHeight';

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

function setup(
  options: {
    tilt?: Calibration | string;
    zero?: Calibration | null;
    caravan?: boolean;
    storage?: KeyValueStorage;
  } = {},
) {
  const state = {
    tilt: options.tilt ?? { rollDeg: 2, pitchDeg: 1.5 },
    zero: options.zero ?? null,
    caravan: options.caravan ?? true,
  };
  const storage = options.storage ?? memoryStorage();
  const onChanged = vi.fn();
  const hitch = createHitchHeight({
    readTilt: () => state.tilt,
    zeroCalibration: () => state.zero,
    isCaravan: () => state.caravan,
    onChanged,
    storage,
  });
  return { hitch, state, storage, onChanged };
}

describe('createHitchHeight', () => {
  it('has nothing saved and is not going back at first', () => {
    const { hitch } = setup();
    expect(hitch.savedPitch()).toBeNull();
    expect(hitch.isActive()).toBe(false);
    expect(hitch.activeCalibration()).toBeNull();
  });

  it('saves the current pitch relative to the zero and survives a reload', () => {
    const { hitch, storage, onChanged } = setup({ zero: { rollDeg: 0.5, pitchDeg: 0.5 } });
    expect(hitch.save()).toBeNull();
    expect(hitch.savedPitch()).toBe(1);
    expect(onChanged).toHaveBeenCalled();
    expect(loadHitchPitch(storage)).toBe(1);
    expect(setup({ storage }).hitch.savedPitch()).toBe(1);
  });

  it('reads a corrupt stored value as none saved', () => {
    const storage = memoryStorage();
    storage.setItem('libell.hitchPitch', '"high"');
    expect(setup({ storage }).hitch.savedPitch()).toBeNull();
  });

  it('replaces an earlier save', () => {
    const { hitch, state } = setup();
    hitch.save();
    state.tilt = { rollDeg: 0, pitchDeg: -0.75 };
    hitch.save();
    expect(hitch.savedPitch()).toBe(-0.75);
  });

  it('passes on the message when there is no reading, saving nothing', () => {
    const { hitch, storage } = setup({ tilt: 'No reading yet' });
    expect(hitch.save()).toBe('No reading yet');
    expect(hitch.savedPitch()).toBeNull();
    expect(loadHitchPitch(storage)).toBeNull();
  });

  it('goes back to the saved pitch on top of the zero, and stops again', () => {
    const { hitch, state, onChanged } = setup({ zero: { rollDeg: 0.2, pitchDeg: 0 } });
    hitch.save();
    state.zero = { rollDeg: 0.2, pitchDeg: 0.3 };
    hitch.start();
    expect(hitch.isActive()).toBe(true);
    expect(hitch.activeCalibration()).toEqual({ rollDeg: 0.2, pitchDeg: 1.8 });
    hitch.stop();
    expect(hitch.isActive()).toBe(false);
    expect(hitch.activeCalibration()).toBeNull();
    expect(onChanged).toHaveBeenCalledTimes(3);
  });

  it('cannot go back without a saved height', () => {
    const { hitch } = setup();
    hitch.start();
    expect(hitch.isActive()).toBe(false);
  });

  it('is never active for a motorhome', () => {
    const { hitch, state } = setup();
    hitch.save();
    hitch.start();
    state.caravan = false;
    expect(hitch.isActive()).toBe(false);
    expect(hitch.activeCalibration()).toBeNull();
  });

  it('starts every session leveling as usual', () => {
    const { hitch, storage } = setup();
    hitch.save();
    hitch.start();
    expect(setup({ storage }).hitch.isActive()).toBe(false);
  });

  it('offers to save first for a caravan with none saved, until saved', () => {
    const { hitch, state } = setup();
    expect(hitch.isOfferDue()).toBe(true);
    state.caravan = false;
    expect(hitch.isOfferDue()).toBe(false);
    state.caravan = true;
    hitch.save();
    expect(hitch.isOfferDue()).toBe(false);
  });

  it('stops offering once dismissed, until the next session', () => {
    const { hitch, storage } = setup();
    hitch.dismissOffer();
    expect(hitch.isOfferDue()).toBe(false);
    expect(setup({ storage }).hitch.isOfferDue()).toBe(true);
  });
});
