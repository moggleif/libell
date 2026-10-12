import { describe, expect, it, vi } from 'vitest';
import {
  loadActiveTargetId,
  loadTargetPresets,
  saveActiveTargetId,
  saveTargetPresets,
  type KeyValueStorage,
} from '../data/settingsStore';
import type { Calibration } from '../domain/settings';
import { t } from '../ui/i18n';
import { createTargets } from './targets';

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

function setup(options: {
  tilt?: Calibration | string;
  zero?: Calibration | null;
  storage?: KeyValueStorage;
}) {
  const storage = options.storage ?? memoryStorage();
  const onActiveChanged = vi.fn();
  let nextId = 0;
  const targets = createTargets({
    readTilt: () => options.tilt ?? { rollDeg: 0, pitchDeg: 0 },
    zeroCalibration: () => options.zero ?? null,
    onActiveChanged,
    storage,
    newId: () => `id-${++nextId}`,
  });
  return { targets, storage, onActiveChanged };
}

describe('createTargets', () => {
  it('starts from what is stored', () => {
    const storage = memoryStorage();
    const preset = { id: 'a', name: 'Ferry', offset: { rollDeg: 1, pitchDeg: 0 } };
    saveTargetPresets([preset], storage);
    saveActiveTargetId('a', storage);
    const { targets } = setup({ storage });
    expect(targets.presets()).toEqual([preset]);
    expect(targets.activeId()).toBe('a');
    expect(targets.activeName()).toBe('Ferry');
    expect(targets.activeOffset()).toEqual({ rollDeg: 1, pitchDeg: 0 });
  });

  it('is Normal, with no offset, when nothing is stored', () => {
    const { targets } = setup({});
    expect(targets.presets()).toEqual([]);
    expect(targets.activeId()).toBeNull();
    expect(targets.activeName()).toBeNull();
    expect(targets.activeOffset()).toBeNull();
  });

  describe('add', () => {
    it('saves the tilt relative to the zero, never to the active target', () => {
      const { targets, storage, onActiveChanged } = setup({
        tilt: { rollDeg: 3, pitchDeg: -1 },
        zero: { rollDeg: 1, pitchDeg: 1 },
      });
      expect(targets.add('Ferry')).toBeNull();
      const saved = { id: 'id-1', name: 'Ferry', offset: { rollDeg: 2, pitchDeg: -2 } };
      expect(targets.presets()).toEqual([saved]);
      expect(loadTargetPresets(storage)).toEqual([saved]);
      expect(targets.activeId()).toBeNull();
      expect(onActiveChanged).not.toHaveBeenCalled();
    });

    // #425: "Varning är rätt. Aldrig stopp." — a warning, then the user's call.
    it('warns, without saving, about more than an intentional target', () => {
      const { targets } = setup({ tilt: { rollDeg: 16, pitchDeg: 0 } });
      expect(targets.add('Steep')).toEqual({ warning: t('targets.warn.tooSteep') });
      expect(targets.presets()).toEqual([]);
    });

    it('saves a steep target anyway when the user goes ahead (#425)', () => {
      const { targets, storage } = setup({ tilt: { rollDeg: 16, pitchDeg: 0 } });
      expect(targets.add('Steep', true)).toBeNull();
      const saved = { id: 'id-1', name: 'Steep', offset: { rollDeg: 16, pitchDeg: 0 } };
      expect(targets.presets()).toEqual([saved]);
      expect(loadTargetPresets(storage)).toEqual([saved]);
    });

    it('passes on a reading error', () => {
      const { targets } = setup({ tilt: 'no sensor' });
      expect(targets.add('X')).toBe('no sensor');
      expect(targets.presets()).toEqual([]);
    });
  });

  it('selects a target and back to Normal, storing each choice', () => {
    const { targets, storage, onActiveChanged } = setup({ tilt: { rollDeg: 2, pitchDeg: 0 } });
    targets.add('Ferry');
    targets.select('id-1');
    expect(targets.activeId()).toBe('id-1');
    expect(targets.activeName()).toBe('Ferry');
    expect(targets.activeOffset()).toEqual({ rollDeg: 2, pitchDeg: 0 });
    expect(loadActiveTargetId(targets.presets(), storage)).toBe('id-1');
    targets.select(null);
    expect(targets.activeId()).toBeNull();
    expect(loadActiveTargetId(targets.presets(), storage)).toBeNull();
    expect(onActiveChanged).toHaveBeenCalledTimes(2);
  });

  describe('remove', () => {
    it('falls back to Normal when the active target goes', () => {
      const { targets, storage, onActiveChanged } = setup({});
      targets.add('Ferry');
      targets.select('id-1');
      targets.remove('id-1');
      expect(targets.presets()).toEqual([]);
      expect(loadTargetPresets(storage)).toEqual([]);
      expect(targets.activeId()).toBeNull();
      expect(onActiveChanged).toHaveBeenCalledTimes(2);
    });

    it('keeps the active target when another goes', () => {
      const { targets, onActiveChanged } = setup({});
      targets.add('Ferry');
      targets.add('Drain');
      targets.select('id-1');
      targets.remove('id-2');
      expect(targets.presets().map((p) => p.name)).toEqual(['Ferry']);
      expect(targets.activeId()).toBe('id-1');
      expect(onActiveChanged).toHaveBeenCalledTimes(2);
    });
  });
});
