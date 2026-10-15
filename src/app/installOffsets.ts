/**
 * Each external box's installation offset (ADR 0014): the "vehicle zero"
 * for that box, held in memory and mirrored to storage.
 *
 * One per box: each box sits in its own place in the vehicle,
 * so two boxes never share a value — ADR 0014's "never conflate" rule,
 * held here the same way it is held in storage. The phone has no entry:
 * its own two calibration layers live elsewhere.
 */
import { SENSOR_SOURCES, type SensorSource } from '../domain/settings';
import type { Calibration } from '../domain/calibration';
import {
  clearInstallCalibration,
  loadInstallCalibrationInfo,
  saveInstallCalibration,
  type StoredCalibration,
} from '../data/calibrationStore';
import type { KeyValueStorage } from '../data/keyValueStorage';

export interface InstallOffsets {
  /** The box's zero, or null for none yet (and always for the phone). */
  valueOf(source: SensorSource): Calibration | null;
  /** When that zero was taken, or null when unknown or none. */
  capturedAtOf(source: SensorSource): number | null;
  /** `capturedAt` is null only when restoring a zero whose time is unknown. */
  store(source: SensorSource, value: Calibration, capturedAt: number | null): void;
  clear(source: SensorSource): void;
}

/** Loads every box's offset once; `storage` defaults to localStorage. */
export function createInstallOffsets(storage?: KeyValueStorage | null): InstallOffsets {
  const offsets = new Map<SensorSource, StoredCalibration | null>(
    SENSOR_SOURCES.filter((source) => source !== 'phone').map((source) => [
      source,
      loadInstallCalibrationInfo(source, storage),
    ]),
  );
  return {
    valueOf: (source) => offsets.get(source)?.value ?? null,
    capturedAtOf: (source) => offsets.get(source)?.capturedAt ?? null,
    store(source, value, capturedAt) {
      offsets.set(source, { value, capturedAt });
      saveInstallCalibration(source, value, storage, capturedAt);
    },
    clear(source) {
      offsets.set(source, null);
      clearInstallCalibration(source, storage);
    },
  };
}
