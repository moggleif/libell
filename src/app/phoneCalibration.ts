/**
 * The phone's two calibration layers (ADR 0010): the sensor's own
 * bias, taken on a flat surface, and the vehicle zero, the phone spot's
 * tilt on a level vehicle, stored sensor-corrected so it survives a later
 * recalibration. Their sum is what "level" means while the phone is the
 * source.
 */
import {
  type Calibration,
  type CaptureResult,
  combineCalibrations,
  vehicleZeroFromReading,
} from '../domain/calibration';
import {
  clearCalibration,
  clearVehicleCalibration,
  loadCalibrationInfo,
  loadVehicleCalibrationInfo,
  saveCalibration,
  saveVehicleCalibration,
} from '../data/calibrationStore';
import type { KeyValueStorage } from '../data/keyValueStorage';
import { t } from '../ui/i18n';
import { exceedsCalibrationLimit } from './tiltReading';

/** A check reading within this of zero counts as "still good". */
const CHECK_GOOD_DEG = 0.3;

export interface PhoneCalibrationDeps {
  /** The phone's tilt now, or the message to show instead. */
  readTilt(): Calibration | string;
  /** A bias or zero was just taken: the user is calibrating the phone. */
  onCaptured(): void;
  onCleared(): void;
  /** The vehicle zero was retaken or forgotten: its fine adjustment no
   * longer applies (#596). */
  onVehicleZeroReplaced?(): void;
  storage?: KeyValueStorage | null;
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
   * unless `anyway` says the user has chosen to go ahead. */
  calibrate(anyway?: boolean): CaptureResult;
  /** Store a bias computed elsewhere (the flip method). */
  applyBias(bias: Calibration): void;
  clearBias(): void;
  /** Take the vehicle zero — warns above 15° like `calibrate`. */
  zeroVehicle(anyway?: boolean): CaptureResult;
  clearVehicleZero(): void;
  /** How far the reading is from the bias's promise of zero. */
  checkBias(): string;
  /** How far the reading is from bias plus vehicle zero. */
  checkZero(): string;
}

/** The deps and what is stored now; the functions below work on one. */
interface PhoneLayers {
  readonly deps: PhoneCalibrationDeps;
  readonly now: () => number;
  bias: ReturnType<typeof loadCalibrationInfo>;
  vehicleZero: ReturnType<typeof loadVehicleCalibrationInfo>;
}

export function createPhoneCalibration(deps: PhoneCalibrationDeps): PhoneCalibration {
  const layers: PhoneLayers = {
    deps,
    now: deps.now ?? Date.now,
    bias: loadCalibrationInfo(deps.storage),
    vehicleZero: loadVehicleCalibrationInfo(deps.storage),
  };
  const zero = () =>
    combineCalibrations(layers.bias?.value ?? null, layers.vehicleZero?.value ?? null);
  return {
    bias: () => layers.bias?.value ?? null,
    biasCapturedAt: () => layers.bias?.capturedAt ?? null,
    vehicleZero: () => layers.vehicleZero?.value ?? null,
    vehicleZeroCapturedAt: () => layers.vehicleZero?.capturedAt ?? null,
    zero,
    calibrate: (anyway = false) => calibrate(layers, anyway),
    applyBias: (value) => storeBias(layers, value),
    clearBias() {
      layers.bias = null;
      clearCalibration(deps.storage);
      deps.onCleared();
    },
    zeroVehicle: (anyway = false) => zeroVehicle(layers, anyway),
    clearVehicleZero() {
      layers.vehicleZero = null;
      clearVehicleCalibration(deps.storage);
      deps.onVehicleZeroReplaced?.();
      deps.onCleared();
    },
    checkBias: () => checkAgainst(deps, layers.bias?.value ?? null, 'calibration.check.off'),
    checkZero: () => checkAgainst(deps, zero(), 'calibration.vehicle.check.off'),
  };
}

function calibrate(layers: PhoneLayers, anyway: boolean): CaptureResult {
  const reading = layers.deps.readTilt();
  if (typeof reading === 'string') return reading;
  if (!anyway && exceedsCalibrationLimit(reading)) {
    return { warning: t('calibration.warn.notFlat') };
  }
  storeBias(layers, reading);
  return null;
}

function storeBias(layers: PhoneLayers, value: Calibration): void {
  const capturedAt = layers.now();
  layers.bias = { value, capturedAt };
  saveCalibration(value, layers.deps.storage, capturedAt);
  layers.deps.onCaptured();
}

function zeroVehicle(layers: PhoneLayers, anyway: boolean): CaptureResult {
  const { deps } = layers;
  const reading = deps.readTilt();
  if (typeof reading === 'string') return reading;
  if (!anyway && exceedsCalibrationLimit(reading)) {
    return { warning: t('calibration.vehicle.warn.notFlat') };
  }
  const value = vehicleZeroFromReading(reading, layers.bias?.value ?? null);
  const capturedAt = layers.now();
  layers.vehicleZero = { value, capturedAt };
  saveVehicleCalibration(value, deps.storage, capturedAt);
  deps.onVehicleZeroReplaced?.();
  deps.onCaptured();
  return null;
}

/** The message for a check that is off: recalibrate the phone, or zero the vehicle again (#506). */
type CheckOffKey = 'calibration.check.off' | 'calibration.vehicle.check.off';

function checkAgainst(
  deps: PhoneCalibrationDeps,
  offset: Calibration | null,
  offKey: CheckOffKey,
): string {
  const reading = deps.readTilt();
  if (typeof reading === 'string') return reading;
  const off = Math.max(
    Math.abs(reading.rollDeg - (offset?.rollDeg ?? 0)),
    Math.abs(reading.pitchDeg - (offset?.pitchDeg ?? 0)),
  );
  const key = off <= CHECK_GOOD_DEG ? 'calibration.check.good' : offKey;
  return t(key, { off: off.toFixed(1) });
}
