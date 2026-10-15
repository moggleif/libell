import { describe, expect, it } from 'vitest';
import type { KeyValueStorage } from '../data/keyValueStorage';
import { NO_TRIM } from '../domain/zeroTrim';
import { createZeroTrims } from './zeroTrims';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe('createZeroTrims (#596)', () => {
  it('starts with no trim for every source', () => {
    const trims = createZeroTrims(memoryStorage());
    expect(trims.valueOf('phone')).toEqual(NO_TRIM);
    expect(trims.valueOf('xparkle')).toEqual(NO_TRIM);
  });

  it('survives a reload', () => {
    const storage = memoryStorage();
    createZeroTrims(storage).nudge('easylevel', 'left');
    expect(createZeroTrims(storage).valueOf('easylevel')).toEqual({ rollDeg: -0.1, pitchDeg: 0 });
  });

  it('keeps each source to its own trim', () => {
    const storage = memoryStorage();
    const trims = createZeroTrims(storage);
    trims.nudge('phone', 'front');
    trims.nudge('xparkle', 'right');
    expect(trims.valueOf('phone')).toEqual({ rollDeg: 0, pitchDeg: 0.1 });
    expect(trims.valueOf('xparkle')).toEqual({ rollDeg: 0.1, pitchDeg: 0 });
    expect(trims.valueOf('easylevel')).toEqual(NO_TRIM);
    const reloaded = createZeroTrims(storage);
    expect(reloaded.valueOf('phone')).toEqual({ rollDeg: 0, pitchDeg: 0.1 });
    expect(reloaded.valueOf('easylevel')).toEqual(NO_TRIM);
  });

  it('resets to exactly the captured zero, also after a reload', () => {
    const storage = memoryStorage();
    const trims = createZeroTrims(storage);
    trims.nudge('phone', 'back');
    trims.reset('phone');
    expect(trims.valueOf('phone')).toEqual(NO_TRIM);
    expect(createZeroTrims(storage).valueOf('phone')).toEqual(NO_TRIM);
  });

  it('reads a corrupt stored trim as none', () => {
    const trims = createZeroTrims(memoryStorage({ 'libell.zeroTrim.phone': '{"rollDeg":"x"}' }));
    expect(trims.valueOf('phone')).toEqual(NO_TRIM);
  });
});
