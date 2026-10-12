/**
 * The phone's two calibration layers (#83, ADR 0010): the sensor's own
 * bias, taken on a flat surface, and the vehicle zero, the phone spot's
 * tilt on a level vehicle, stored sensor-corrected so it survives a later
 * recalibration. Their sum is what "level" means while the phone is the
 * source.
 */
import {
  combineCalibrations,
  vehicleZeroFromReading,
  type CaptureResult,
} from '../domain/calibration';
import type { Calibration } from '../domain/settings';
import {
  clearCalibration,
  clearVehicleCalibration,
  loadCalibrationInfo,
  loadVehicleCalibrationInfo,
  saveCalibration,
  saveVehicleCalibration,
  type KeyValueStorage,
} from '../data/settingsStore';
import { t } from '../ui/i18n';
import { exceedsCalibrationLimit } from './tiltReading';

/** A check reading within this of zero counts as "still good" (#87). */
const CHECK_GOOD_DEG = 0.3;

export interface PhoneCalibrationDeps {
  /** The phone's tilt now, or the message to show instead. */
  readTilt(): Calibration | string;
  /** A bias or zero was just taken: the user is calibrating the phone. */
  onCaptured(): void;
  /** A bias or zero was forgotten. */
  onCleared(): void;
  /** Defaults to localStorage. */
  storage?: KeyValueStorage | null;
  /** Defaults to `Date.now`. */
  now?: () => number;
}

export interface PhoneCalibration {
  bias(): Calibration | null;
  biasCapturedAt(): number | null;
  vehicleZero(): Calibration | null;
  vehicleZeroCapturedAt(): number | null;
  /** Bias plus vehicle zero: what the leveling math subtracts. */
  zero(): Calibration | null;
  /** Take the bias from the phone lying flat. Above 15° it warns instead,
   * unless `anyway` says the user has chosen to go ahead (#411). */
  calibrate(anyway?: boolean): CaptureResult;
  /** Store a bias computed elsewhere (the flip method). */
  applyBias(bias: Calibration): void;
  clearBias(): void;
  /** Take the vehicle zero — warns above 15° like `calibrate`. */
  zeroVehicle(anyway?: boolean): CaptureResult;
  clearVehicleZero(): void;
  /** How far the reading is from the bias's promise of zero (#87). */
  checkBias(): string;
  /** How far the reading is from bias plus vehicle zero (#87). */
  checkZero(): string;
}

export function createPhoneCalibration(deps: PhoneCalibrationDeps): PhoneCalibration {
  const { storage } = deps;
  const now = deps.now ?? Date.now;
  let bias = loadCalibrationInfo(storage);
  let vehicleZero = loadVehicleCalibrationInfo(storage);

  function storeBias(value: Calibration): void {
    const capturedAt = now();
    bias = { value, capturedAt };
    saveCalibration(value, storage, capturedAt);
    deps.onCaptured();
  }

  function checkAgainst(offset: Calibration | null): string {
    const reading = deps.readTilt();
    if (typeof reading === 'string') return reading;
    const off = Math.max(
      Math.abs(reading.rollDeg - (offset?.rollDeg ?? 0)),
      Math.abs(reading.pitchDeg - (offset?.pitchDeg ?? 0)),
    );
    const key = off <= CHECK_GOOD_DEG ? 'calibration.check.good' : 'calibration.check.off';
    return t(key, { off: off.toFixed(1) });
  }

  const zero = () => combineCalibrations(bias?.value ?? null, vehicleZero?.value ?? null);

  return {
    bias: () => bias?.value ?? null,
    biasCapturedAt: () => bias?.capturedAt ?? null,
    vehicleZero: () => vehicleZero?.value ?? null,
    vehicleZeroCapturedAt: () => vehicleZero?.capturedAt ?? null,
    zero,
    calibrate(anyway = false) {
      const reading = deps.readTilt();
      if (typeof reading === 'string') return reading;
      if (!anyway && exceedsCalibrationLimit(reading)) {
        return { warning: t('calibration.warn.notFlat') };
      }
      storeBias(reading);
      return null;
    },
    applyBias: storeBias,
    clearBias() {
      bias = null;
      clearCalibration(storage);
      deps.onCleared();
    },
    zeroVehicle(anyway = false) {
      const reading = deps.readTilt();
      if (typeof reading === 'string') return reading;
      if (!anyway && exceedsCalibrationLimit(reading)) {
        return { warning: t('calibration.vehicle.warn.notFlat') };
      }
      const value = vehicleZeroFromReading(reading, bias?.value ?? null);
      const capturedAt = now();
      vehicleZero = { value, capturedAt };
      saveVehicleCalibration(value, storage, capturedAt);
      deps.onCaptured();
      return null;
    },
    clearVehicleZero() {
      vehicleZero = null;
      clearVehicleCalibration(storage);
      deps.onCleared();
    },
    checkBias: () => checkAgainst(bias?.value ?? null),
    checkZero: () => checkAgainst(zero()),
  };
}
