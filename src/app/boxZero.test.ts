import { describe, expect, it, vi } from 'vitest';
import type { SensorSource } from '../domain/settings';
import type { Calibration } from '../domain/calibration';
import type { OrientationSensor, SensorState } from '../sensor/orientation';
import type { XparkleSensor } from '../sensor/xparkleSensor';
import { t } from '../ui/i18n';
import { createBoxZeroing, EASYLEVEL_ZERO_SAMPLE_MS } from './boxZero';
import type { InstallOffsets } from './installOffsets';

function memoryOffsets(): InstallOffsets & {
  stored: Map<SensorSource, [Calibration, number | null]>;
} {
  const stored = new Map<SensorSource, [Calibration, number | null]>();
  return {
    stored,
    valueOf: (source) => stored.get(source)?.[0] ?? null,
    capturedAtOf: (source) => stored.get(source)?.[1] ?? null,
    store: (source, value, at) => void stored.set(source, [value, at]),
    clear: (source) => void stored.delete(source),
  };
}

/** A fake clock and box: each `wait` moves time on and may bring a sample. */
function setup(options: {
  source?: SensorSource;
  readings?: Calibration[];
  xparkle?: Partial<XparkleSensor> | null;
  dropAfterWaits?: number;
}) {
  const readings = [...(options.readings ?? [{ rollDeg: 1, pitchDeg: 2 }])];
  let clock = 0;
  let sampleAt = 0;
  let waits = 0;
  let state: SensorState = 'granted';
  let current = readings.shift()!;
  const active = {
    getSource: () => options.source ?? 'easylevel',
    getState: () => state,
    getLastSampleAt: () => sampleAt,
  } as unknown as OrientationSensor;
  const offsets = memoryOffsets();
  const onChanged = vi.fn();
  const onZeroReplaced = vi.fn();
  const zeroing = createBoxZeroing({
    activeSensor: () => active,
    getXparkle: () =>
      options.xparkle === null
        ? null
        : ({
            getState: () => 'granted',
            zeroBox: () => Promise.resolve(true),
            ...options.xparkle,
          } as XparkleSensor),
    offsets,
    readTilt: () => current,
    onChanged,
    onZeroReplaced,
    now: () => 9000,
    clock: () => clock,
    wait: (ms) => {
      clock += ms;
      waits += 1;
      if (options.dropAfterWaits !== undefined && waits >= options.dropAfterWaits) {
        state = 'disconnected';
      }
      const next = readings.shift();
      if (next) {
        current = next;
        sampleAt = clock;
      }
      return Promise.resolve();
    },
  });
  return { zeroing, offsets, onChanged, onZeroReplaced };
}

describe('createBoxZeroing', () => {
  describe('EasyLevel', () => {
    it('stores the average of the samples over the sampling window', async () => {
      const { zeroing, offsets, onChanged } = setup({
        readings: [
          { rollDeg: 1, pitchDeg: 2 },
          { rollDeg: 3, pitchDeg: 4 },
          { rollDeg: 2, pitchDeg: 3 },
        ],
      });
      await expect(zeroing.zero('easylevel')).resolves.toBeNull();
      expect(offsets.stored.get('easylevel')).toEqual([{ rollDeg: 2, pitchDeg: 3 }, 9000]);
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('counts a sample only once, however many waits pass before the next', async () => {
      const { zeroing, offsets } = setup({
        readings: [
          { rollDeg: 0, pitchDeg: 0 },
          { rollDeg: 3, pitchDeg: 3 },
        ],
      });
      await zeroing.zero('easylevel');
      expect(offsets.valueOf('easylevel')).toEqual({ rollDeg: 1.5, pitchDeg: 1.5 });
    });

    it('samples for the whole window and no longer', async () => {
      // One sample per 50 ms wait: the first reading plus 30 more fill the
      // window; anything after it (steep here) must never be counted.
      const inWindow = EASYLEVEL_ZERO_SAMPLE_MS / 50 + 1;
      const readings = [
        ...Array.from({ length: inWindow }, () => ({ rollDeg: 1, pitchDeg: 1 })),
        ...Array.from({ length: 10 }, () => ({ rollDeg: 20, pitchDeg: 0 })),
      ];
      const { zeroing, offsets } = setup({ readings });
      await expect(zeroing.zero('easylevel')).resolves.toBeNull();
      expect(offsets.valueOf('easylevel')).toEqual({ rollDeg: 1, pitchDeg: 1 });
    });

    it('stores nothing and says why when the box drops mid-sample', async () => {
      const { zeroing, offsets, onChanged } = setup({ dropAfterWaits: 3 });
      await expect(zeroing.zero('easylevel')).resolves.toBe(
        t('calibration.external.err.notConnected', { name: 'EasyLevel' }),
      );
      expect(offsets.valueOf('easylevel')).toBeNull();
      expect(onChanged).not.toHaveBeenCalled();
    });

    // #624: one button — a steep zero is stored at once, and the warning
    // only informs, with an undo.
    it('stores a zero that looks too steep to be level, and warns with an undo', async () => {
      const { zeroing, offsets, onChanged } = setup({ readings: [{ rollDeg: 20, pitchDeg: 0 }] });
      await expect(zeroing.zero('easylevel')).resolves.toEqual({
        warning: t('calibration.vehicle.warn.notFlat'),
        undo: expect.any(Function),
      });
      expect(offsets.valueOf('easylevel')).toEqual({ rollDeg: 20, pitchDeg: 0 });
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('undo restores the previous zero, its time and its fine adjustment', async () => {
      const { zeroing, offsets, onChanged, onZeroReplaced } = setup({
        readings: [{ rollDeg: 20, pitchDeg: 0 }],
      });
      offsets.store('easylevel', { rollDeg: 1, pitchDeg: -1 }, 400);
      const restoreTrim = vi.fn();
      onZeroReplaced.mockReturnValue(restoreTrim);
      const result = await zeroing.zero('easylevel');
      if (result === null || typeof result !== 'object') throw new Error('expected a warning');
      result.undo();
      expect(offsets.stored.get('easylevel')).toEqual([{ rollDeg: 1, pitchDeg: -1 }, 400]);
      expect(restoreTrim).toHaveBeenCalledTimes(1);
      expect(onChanged).toHaveBeenCalledTimes(2);
    });

    it('undo restores "none" when the box had no zero before', async () => {
      const { zeroing, offsets } = setup({ readings: [{ rollDeg: 20, pitchDeg: 0 }] });
      const result = await zeroing.zero('easylevel');
      if (result === null || typeof result !== 'object') throw new Error('expected a warning');
      result.undo();
      expect(offsets.valueOf('easylevel')).toBeNull();
    });
  });

  describe('Xparkle', () => {
    it('has the box zero itself, then stores a zero offset with the time', async () => {
      const zeroBox = vi.fn(() => Promise.resolve(true));
      const { zeroing, offsets, onChanged } = setup({ source: 'xparkle', xparkle: { zeroBox } });
      await expect(zeroing.zero('xparkle')).resolves.toBeNull();
      expect(zeroBox).toHaveBeenCalledTimes(1);
      expect(offsets.stored.get('xparkle')).toEqual([{ rollDeg: 0, pitchDeg: 0 }, 9000]);
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it('says the box is not connected without asking it', async () => {
      const notConnected = t('calibration.external.err.notConnected', { name: 'Xparkle RVS01' });
      await expect(setup({ xparkle: null }).zeroing.zero('xparkle')).resolves.toBe(notConnected);
      const lost = setup({ xparkle: { getState: () => 'disconnected' } });
      await expect(lost.zeroing.zero('xparkle')).resolves.toBe(notConnected);
    });

    it('says so when the box refuses, and stores nothing', async () => {
      const { zeroing, offsets } = setup({ xparkle: { zeroBox: () => Promise.resolve(false) } });
      await expect(zeroing.zero('xparkle')).resolves.toBe(
        t('calibration.external.err.failed', { name: 'Xparkle RVS01' }),
      );
      expect(offsets.valueOf('xparkle')).toBeNull();
    });
  });

  it('stores one reading, at once, for any other source', () => {
    const { zeroing, offsets } = setup({ readings: [{ rollDeg: 2, pitchDeg: 1 }] });
    expect(zeroing.zero('phone')).toBeNull();
    expect(offsets.stored.get('phone')).toEqual([{ rollDeg: 2, pitchDeg: 1 }, 9000]);
  });

  it('says which box got a new or no zero, so its fine adjustment is dropped (#596)', async () => {
    const { zeroing, onZeroReplaced } = setup({ source: 'xparkle' });
    await zeroing.zero('xparkle');
    expect(onZeroReplaced).toHaveBeenLastCalledWith('xparkle');
    zeroing.clear('easylevel');
    expect(onZeroReplaced).toHaveBeenLastCalledWith('easylevel');
    const refused = setup({ xparkle: { zeroBox: () => Promise.resolve(false) } });
    await refused.zeroing.zero('xparkle');
    expect(refused.onZeroReplaced).not.toHaveBeenCalled();
  });

  it('clears a box zero and refreshes', () => {
    const { zeroing, offsets, onChanged } = setup({});
    offsets.store('easylevel', { rollDeg: 1, pitchDeg: 1 }, 1);
    zeroing.clear('easylevel');
    expect(offsets.valueOf('easylevel')).toBeNull();
    expect(onChanged).toHaveBeenCalledTimes(1);
  });
});

describe('createBoxZeroing when there is no reading, and on its own clock (#484)', () => {
  function withoutReading(source: SensorSource) {
    const offsets = memoryOffsets();
    const zeroing = createBoxZeroing({
      activeSensor: () => ({ getSource: () => source }) as unknown as OrientationSensor,
      getXparkle: () => null,
      offsets,
      readTilt: () => 'no reading',
      onChanged: vi.fn(),
    });
    return { zeroing, offsets };
  }

  it('says why an EasyLevel zero cannot start, and stores nothing', async () => {
    const { zeroing, offsets } = withoutReading('easylevel');
    expect(await zeroing.zero('easylevel')).toBe('no reading');
    expect(offsets.stored.size).toBe(0);
  });

  it('says why any other source cannot be zeroed, and stores nothing', () => {
    const { zeroing, offsets } = withoutReading('phone');
    expect(zeroing.zero('phone')).toBe('no reading');
    expect(offsets.stored.size).toBe(0);
  });

  it('samples an EasyLevel box on real timers by default, and stamps wall time', async () => {
    vi.useFakeTimers({ now: 5000 });
    try {
      const offsets = memoryOffsets();
      const zeroing = createBoxZeroing({
        activeSensor: () =>
          ({
            getSource: () => 'easylevel',
            getState: () => 'granted',
            getLastSampleAt: () => 0,
          }) as unknown as OrientationSensor,
        getXparkle: () => null,
        offsets,
        readTilt: () => ({ rollDeg: 1, pitchDeg: 2 }),
        onChanged: vi.fn(),
      });
      const result = zeroing.zero('easylevel');
      await vi.advanceTimersByTimeAsync(EASYLEVEL_ZERO_SAMPLE_MS + 100);
      expect(await result).toBeNull();
      expect(offsets.stored.get('easylevel')?.[1]).toBeGreaterThanOrEqual(5000);
    } finally {
      vi.useRealTimers();
    }
  });
});
