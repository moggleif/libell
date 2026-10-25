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
  type StoredCalibration,
} from '../data/calibrationStore';
import type { KeyValueStorage } from '../data/keyValueStorage';
import { t } from '../ui/i18n';
import { exceedsCalibrationLimit } from './tiltReading';
import { countFeature } from './usage';

/** Puts back what a capture replaced. */
type Restore = () => void;

/** A check reading within this of zero counts as "still good". */
const CHECK_GOOD_DEG = 0.3;

export interface PhoneCalibrationDeps {
  /** The phone's tilt now, or the message to show instead. */
  readTilt(): Calibration | string;
  /** A bias or zero was just taken (or an undo put one back): the user is
   * calibrating the phone. */
  onCaptured(): void;
  onCleared(): void;
  /** The vehicle zero was retaken or forgotten: its fine adjustment no
   * longer applies (#596). May hand back how to put that adjustment back,
   * for an undo (#624). */
  onVehicleZeroReplaced?(): Restore | undefined;
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
  /** Take the bias from the phone lying flat. Above 15° it is still stored,
   * with a warning that can undo it (#624). */
  calibrate(): CaptureResult;
  /** Store a bias computed elsewhere (the flip method); returns how to put
   * the previous one back. */
  applyBias(bias: Calibration): Restore;
  clearBias(): void;
  /** Take the vehicle zero — stored and warned above 15° like `calibrate`. */
  zeroVehicle(): CaptureResult;
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
  bias: StoredCalibration | null;
  vehicleZero: StoredCalibration | null;
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
    calibrate() {
      countFeature('calibrate-phone');
      return calibrate(layers);
    },
    applyBias: (value) => storeBias(layers, value),
    clearBias() {
      layers.bias = null;
      clearCalibration(deps.storage);
      deps.onCleared();
    },
    zeroVehicle() {
      countFeature('zero-vehicle');
      return zeroVehicle(layers);
    },
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

function calibrate(layers: PhoneLayers): CaptureResult {
  const reading = layers.deps.readTilt();
  if (typeof reading === 'string') return reading;
  const undo = storeBias(layers, reading);
  return warnIfSteep(reading, 'calibration.warn.notFlat', undo);
}

/** A steep capture stays stored; the warning only informs, with its undo. */
function warnIfSteep(
  reading: Calibration,
  key: 'calibration.warn.notFlat' | 'calibration.vehicle.warn.notFlat',
  undo: Restore,
): CaptureResult {
  return exceedsCalibrationLimit(reading) ? { warning: t(key), undo } : null;
}

function storeBias(layers: PhoneLayers, value: Calibration): Restore {
  const before = layers.bias;
  writeBias(layers, { value, capturedAt: layers.now() });
  return () => writeBias(layers, before);
}

/** Store a bias, or clear it for null (an undo back to none). */
function writeBias(layers: PhoneLayers, stored: StoredCalibration | null): void {
  const { deps } = layers;
  layers.bias = stored;
  if (stored) {
    saveCalibration(stored.value, deps.storage, stored.capturedAt);
    deps.onCaptured();
  } else {
    clearCalibration(deps.storage);
    deps.onCleared();
  }
}

function zeroVehicle(layers: PhoneLayers): CaptureResult {
  const { deps } = layers;
  const reading = deps.readTilt();
  if (typeof reading === 'string') return reading;
  const before = layers.vehicleZero;
  const value = vehicleZeroFromReading(reading, layers.bias?.value ?? null);
  const restoreTrim = deps.onVehicleZeroReplaced?.();
  writeVehicleZero(layers, { value, capturedAt: layers.now() });
  return warnIfSteep(reading, 'calibration.vehicle.warn.notFlat', () => {
    restoreTrim?.();
    writeVehicleZero(layers, before);
  });
}

/** Store a vehicle zero, or clear it for null (an undo back to none). */
function writeVehicleZero(layers: PhoneLayers, stored: StoredCalibration | null): void {
  const { deps } = layers;
  layers.vehicleZero = stored;
  if (stored) {
    saveVehicleCalibration(stored.value, deps.storage, stored.capturedAt);
    deps.onCaptured();
  } else {
    clearVehicleCalibration(deps.storage);
    deps.onCleared();
  }
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
