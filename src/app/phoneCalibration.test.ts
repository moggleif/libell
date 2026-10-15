import { describe, expect, it, vi } from 'vitest';
import {
  loadCalibrationInfo,
  loadVehicleCalibrationInfo,
  saveCalibration,
  saveVehicleCalibration,
} from '../data/calibrationStore';
import type { KeyValueStorage } from '../data/keyValueStorage';
import type { Calibration, CaptureResult } from '../domain/calibration';
import { t } from '../ui/i18n';
import { createPhoneCalibration } from './phoneCalibration';

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

/** A phone calibration reading `tilt` (or a "not running" message). */
function setup(tilt: Calibration | string, storage = memoryStorage()) {
  let reading = tilt;
  const onCaptured = vi.fn();
  const onCleared = vi.fn();
  const onVehicleZeroReplaced = vi.fn();
  const phone = createPhoneCalibration({
    readTilt: () => reading,
    onCaptured,
    onCleared,
    onVehicleZeroReplaced,
    storage,
    now: () => 5000,
  });
  return {
    phone,
    storage,
    onCaptured,
    onCleared,
    onVehicleZeroReplaced,
    tiltTo: (next: Calibration) => (reading = next),
  };
}

/** The undo a tilt warning carries; fails the test when there is none. */
function undoOf(result: CaptureResult): () => void {
  if (result === null || typeof result !== 'object') throw new Error('expected a warning');
  return result.undo;
}

describe('createPhoneCalibration', () => {
  it('starts from what is stored', () => {
    const storage = memoryStorage();
    saveCalibration({ rollDeg: 1, pitchDeg: 2 }, storage, 100);
    saveVehicleCalibration({ rollDeg: 0.5, pitchDeg: -0.5 }, storage, 200);
    const { phone } = setup('x', storage);
    expect(phone.bias()).toEqual({ rollDeg: 1, pitchDeg: 2 });
    expect(phone.biasCapturedAt()).toBe(100);
    expect(phone.vehicleZero()).toEqual({ rollDeg: 0.5, pitchDeg: -0.5 });
    expect(phone.vehicleZeroCapturedAt()).toBe(200);
    expect(phone.zero()).toEqual({ rollDeg: 1.5, pitchDeg: 1.5 });
  });

  it('has no zero at all before any calibration', () => {
    const { phone } = setup('x');
    expect(phone.bias()).toBeNull();
    expect(phone.vehicleZero()).toBeNull();
    expect(phone.zero()).toBeNull();
  });

  describe('calibrate', () => {
    it('stores the reading as the bias, with the time', () => {
      const { phone, storage, onCaptured } = setup({ rollDeg: -1.2, pitchDeg: 0.4 });
      expect(phone.calibrate()).toBeNull();
      expect(phone.bias()).toEqual({ rollDeg: -1.2, pitchDeg: 0.4 });
      expect(phone.biasCapturedAt()).toBe(5000);
      expect(loadCalibrationInfo(storage)).toEqual({
        value: { rollDeg: -1.2, pitchDeg: 0.4 },
        capturedAt: 5000,
      });
      expect(onCaptured).toHaveBeenCalledTimes(1);
    });

    // #624: one button — a tilted reading is stored at once, and the warning
    // only informs, with an undo.
    it('stores a reading that does not look flat, and warns with an undo', () => {
      const { phone, storage, onCaptured } = setup({ rollDeg: 16, pitchDeg: 0 });
      const result = phone.calibrate();
      expect(result).toEqual({
        warning: t('calibration.warn.notFlat'),
        undo: expect.any(Function),
      });
      expect(phone.bias()).toEqual({ rollDeg: 16, pitchDeg: 0 });
      expect(loadCalibrationInfo(storage)?.value).toEqual({ rollDeg: 16, pitchDeg: 0 });
      expect(onCaptured).toHaveBeenCalledTimes(1);
    });

    it('undo restores the previous bias exactly, with its time (#624)', () => {
      const storage = memoryStorage();
      saveCalibration({ rollDeg: 1, pitchDeg: 2 }, storage, 100);
      const { phone, onCaptured } = setup({ rollDeg: 16, pitchDeg: 0 }, storage);
      undoOf(phone.calibrate())();
      expect(phone.bias()).toEqual({ rollDeg: 1, pitchDeg: 2 });
      expect(phone.biasCapturedAt()).toBe(100);
      expect(loadCalibrationInfo(storage)).toEqual({
        value: { rollDeg: 1, pitchDeg: 2 },
        capturedAt: 100,
      });
      expect(onCaptured).toHaveBeenCalledTimes(2);
    });

    it('undo restores "none" when there was no bias before (#624)', () => {
      const { phone, storage } = setup({ rollDeg: 16, pitchDeg: 0 });
      undoOf(phone.calibrate())();
      expect(phone.bias()).toBeNull();
      expect(phone.biasCapturedAt()).toBeNull();
      expect(loadCalibrationInfo(storage)).toBeNull();
    });

    it('passes on a reading error', () => {
      const { phone } = setup('no sensor');
      expect(phone.calibrate()).toBe('no sensor');
      expect(phone.bias()).toBeNull();
    });
  });

  it('applies a bias computed elsewhere (the flip method)', () => {
    const { phone, storage, onCaptured } = setup('x');
    phone.applyBias({ rollDeg: 0.3, pitchDeg: 0.1 });
    expect(phone.bias()).toEqual({ rollDeg: 0.3, pitchDeg: 0.1 });
    expect(phone.biasCapturedAt()).toBe(5000);
    expect(loadCalibrationInfo(storage)?.value).toEqual({ rollDeg: 0.3, pitchDeg: 0.1 });
    expect(onCaptured).toHaveBeenCalledTimes(1);
  });

  it('can undo a bias computed elsewhere, back to the one before (#624)', () => {
    const storage = memoryStorage();
    saveCalibration({ rollDeg: 1, pitchDeg: 2 }, storage, 100);
    const { phone } = setup('x', storage);
    const undo = phone.applyBias({ rollDeg: 0.3, pitchDeg: 0.1 });
    undo();
    expect(phone.bias()).toEqual({ rollDeg: 1, pitchDeg: 2 });
    expect(loadCalibrationInfo(storage)).toEqual({
      value: { rollDeg: 1, pitchDeg: 2 },
      capturedAt: 100,
    });
  });

  it('clears the bias in memory and in storage', () => {
    const storage = memoryStorage();
    saveCalibration({ rollDeg: 1, pitchDeg: 2 }, storage, 100);
    const { phone, onCleared, onCaptured } = setup('x', storage);
    phone.clearBias();
    expect(phone.bias()).toBeNull();
    expect(phone.biasCapturedAt()).toBeNull();
    expect(loadCalibrationInfo(storage)).toBeNull();
    expect(onCleared).toHaveBeenCalledTimes(1);
    expect(onCaptured).not.toHaveBeenCalled();
  });

  describe('zeroVehicle', () => {
    it('stores the reading corrected for the bias (ADR 0010)', () => {
      const { phone, storage, tiltTo, onCaptured } = setup({ rollDeg: 1, pitchDeg: 1 });
      phone.calibrate();
      tiltTo({ rollDeg: 3, pitchDeg: -1 });
      expect(phone.zeroVehicle()).toBeNull();
      expect(phone.vehicleZero()).toEqual({ rollDeg: 2, pitchDeg: -2 });
      expect(phone.vehicleZeroCapturedAt()).toBe(5000);
      expect(loadVehicleCalibrationInfo(storage)?.value).toEqual({ rollDeg: 2, pitchDeg: -2 });
      expect(phone.zero()).toEqual({ rollDeg: 3, pitchDeg: -1 });
      expect(onCaptured).toHaveBeenCalledTimes(2);
    });

    it('stores a zero that looks too steep to be level, and warns with an undo (#624)', () => {
      const { phone, storage, onCaptured } = setup({ rollDeg: 0, pitchDeg: -20 });
      const result = phone.zeroVehicle();
      expect(result).toEqual({
        warning: t('calibration.vehicle.warn.notFlat'),
        undo: expect.any(Function),
      });
      expect(phone.vehicleZero()).toEqual({ rollDeg: 0, pitchDeg: -20 });
      expect(loadVehicleCalibrationInfo(storage)?.value).toEqual({ rollDeg: 0, pitchDeg: -20 });
      expect(onCaptured).toHaveBeenCalledTimes(1);
    });

    it('undo restores the previous zero and its fine adjustment (#624)', () => {
      const storage = memoryStorage();
      saveVehicleCalibration({ rollDeg: 0.5, pitchDeg: -0.5 }, storage, 200);
      const restoreTrim = vi.fn();
      const { phone, onVehicleZeroReplaced } = setup({ rollDeg: 0, pitchDeg: -20 }, storage);
      onVehicleZeroReplaced.mockReturnValue(restoreTrim);
      undoOf(phone.zeroVehicle())();
      expect(phone.vehicleZero()).toEqual({ rollDeg: 0.5, pitchDeg: -0.5 });
      expect(phone.vehicleZeroCapturedAt()).toBe(200);
      expect(loadVehicleCalibrationInfo(storage)).toEqual({
        value: { rollDeg: 0.5, pitchDeg: -0.5 },
        capturedAt: 200,
      });
      expect(restoreTrim).toHaveBeenCalledTimes(1);
    });

    it('undo restores "none" when there was no zero before (#624)', () => {
      const { phone, storage } = setup({ rollDeg: 0, pitchDeg: -20 });
      undoOf(phone.zeroVehicle())();
      expect(phone.vehicleZero()).toBeNull();
      expect(loadVehicleCalibrationInfo(storage)).toBeNull();
    });

    it('passes on a reading error', () => {
      expect(setup('no sensor').phone.zeroVehicle()).toBe('no sensor');
    });

    it('says the zero was replaced, so its fine adjustment is dropped (#596)', () => {
      const taken = setup({ rollDeg: 1, pitchDeg: 1 });
      taken.phone.calibrate();
      expect(taken.onVehicleZeroReplaced).not.toHaveBeenCalled();
      taken.phone.zeroVehicle();
      expect(taken.onVehicleZeroReplaced).toHaveBeenCalledTimes(1);
      const failed = setup('no sensor');
      failed.phone.zeroVehicle();
      expect(failed.onVehicleZeroReplaced).not.toHaveBeenCalled();
      failed.phone.clearVehicleZero();
      expect(failed.onVehicleZeroReplaced).toHaveBeenCalledTimes(1);
    });
  });

  it('clears the vehicle zero in memory and in storage', () => {
    const storage = memoryStorage();
    saveVehicleCalibration({ rollDeg: 1, pitchDeg: 2 }, storage, 100);
    const { phone, onCleared } = setup('x', storage);
    phone.clearVehicleZero();
    expect(phone.vehicleZero()).toBeNull();
    expect(phone.vehicleZeroCapturedAt()).toBeNull();
    expect(loadVehicleCalibrationInfo(storage)).toBeNull();
    expect(onCleared).toHaveBeenCalledTimes(1);
  });

  describe('checks (#87)', () => {
    it('reads as still good within 0.3°', () => {
      const { phone, tiltTo } = setup({ rollDeg: 1, pitchDeg: 1 });
      phone.calibrate();
      tiltTo({ rollDeg: 1.2, pitchDeg: 0.9 });
      expect(phone.checkBias()).toBe(t('calibration.check.good', { off: '0.2' }));
    });

    it('reads as off beyond it, by the larger axis', () => {
      const { phone, tiltTo } = setup({ rollDeg: 1, pitchDeg: 1 });
      phone.calibrate();
      tiltTo({ rollDeg: 1.2, pitchDeg: 2 });
      expect(phone.checkBias()).toBe(t('calibration.check.off', { off: '1.0' }));
    });

    it('checks the zero against bias plus vehicle zero', () => {
      const { phone, tiltTo } = setup({ rollDeg: 1, pitchDeg: 0 });
      phone.calibrate();
      tiltTo({ rollDeg: 2, pitchDeg: 0 });
      phone.zeroVehicle();
      expect(phone.checkZero()).toBe(t('calibration.check.good', { off: '0.0' }));
      expect(phone.checkBias()).toBe(t('calibration.check.off', { off: '1.0' }));
    });

    it('speaks of zeroing, not calibrating, when the vehicle zero is off (#506)', () => {
      const { phone, tiltTo } = setup({ rollDeg: 0, pitchDeg: 0 });
      phone.zeroVehicle();
      tiltTo({ rollDeg: 1, pitchDeg: 0 });
      expect(phone.checkZero()).toBe(t('calibration.vehicle.check.off', { off: '1.0' }));
      expect(phone.checkBias()).toBe(t('calibration.check.off', { off: '1.0' }));
    });

    it('checks against level when nothing is stored', () => {
      const { phone } = setup({ rollDeg: 0.5, pitchDeg: 0 });
      expect(phone.checkBias()).toBe(t('calibration.check.off', { off: '0.5' }));
    });

    it('passes on a reading error', () => {
      expect(setup('no sensor').phone.checkZero()).toBe('no sensor');
    });
  });
});
