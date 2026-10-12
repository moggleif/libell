import { describe, expect, it, vi } from 'vitest';
import {
  loadCalibrationInfo,
  loadVehicleCalibrationInfo,
  saveCalibration,
  saveVehicleCalibration,
} from '../data/calibrationStore';
import type { KeyValueStorage } from '../data/keyValueStorage';
import type { Calibration } from '../domain/settings';
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
  const phone = createPhoneCalibration({
    readTilt: () => reading,
    onCaptured,
    onCleared,
    storage,
    now: () => 5000,
  });
  return { phone, storage, onCaptured, onCleared, tiltTo: (next: Calibration) => (reading = next) };
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

    // #411: "Varning är rätt. Aldrig stopp." — a warning, then the user's call.
    it('warns, without storing, when the phone does not look flat', () => {
      const { phone, onCaptured } = setup({ rollDeg: 16, pitchDeg: 0 });
      expect(phone.calibrate()).toEqual({ warning: t('calibration.warn.notFlat') });
      expect(phone.bias()).toBeNull();
      expect(onCaptured).not.toHaveBeenCalled();
    });

    it('calibrates anyway when the user goes ahead (#411)', () => {
      const { phone, storage, onCaptured } = setup({ rollDeg: 16, pitchDeg: 0 });
      expect(phone.calibrate(true)).toBeNull();
      expect(phone.bias()).toEqual({ rollDeg: 16, pitchDeg: 0 });
      expect(loadCalibrationInfo(storage)?.value).toEqual({ rollDeg: 16, pitchDeg: 0 });
      expect(onCaptured).toHaveBeenCalledTimes(1);
    });

    it('still passes on a reading error when told to go ahead', () => {
      expect(setup('no sensor').phone.calibrate(true)).toBe('no sensor');
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

    it('warns, without storing, when the vehicle looks too steep to be level (#411)', () => {
      const { phone, onCaptured } = setup({ rollDeg: 0, pitchDeg: -20 });
      expect(phone.zeroVehicle()).toEqual({ warning: t('calibration.vehicle.warn.notFlat') });
      expect(phone.vehicleZero()).toBeNull();
      expect(onCaptured).not.toHaveBeenCalled();
    });

    it('zeroes anyway when the user goes ahead (#411)', () => {
      const { phone, storage } = setup({ rollDeg: 0, pitchDeg: -20 });
      expect(phone.zeroVehicle(true)).toBeNull();
      expect(phone.vehicleZero()).toEqual({ rollDeg: 0, pitchDeg: -20 });
      expect(loadVehicleCalibrationInfo(storage)?.value).toEqual({ rollDeg: 0, pitchDeg: -20 });
    });

    it('passes on a reading error', () => {
      expect(setup('no sensor').phone.zeroVehicle()).toBe('no sensor');
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

    it('checks against level when nothing is stored', () => {
      const { phone } = setup({ rollDeg: 0.5, pitchDeg: 0 });
      expect(phone.checkBias()).toBe(t('calibration.check.off', { off: '0.5' }));
    });

    it('passes on a reading error', () => {
      expect(setup('no sensor').phone.checkZero()).toBe('no sensor');
    });
  });
});
