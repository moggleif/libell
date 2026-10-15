/**
 * Each source's fine adjustment of its zero (#596), held in memory and
 * mirrored to storage. The phone has one too, on top of its vehicle zero.
 * A new zero, or a forgotten one, resets the trim: the new zero already
 * captures how the vehicle stands now.
 */
import type { Calibration } from '../domain/calibration';
import { SENSOR_SOURCES, type SensorSource } from '../domain/settings';
import { isTrimmed, NO_TRIM, nudgeTrim, type TrimDirection } from '../domain/zeroTrim';
import { clearZeroTrim, loadZeroTrim, saveZeroTrim } from '../data/calibrationStore';
import type { KeyValueStorage } from '../data/keyValueStorage';

export interface ZeroTrims {
  /** `NO_TRIM` when the source has none. */
  valueOf(source: SensorSource): Calibration;
  nudge(source: SensorSource, direction: TrimDirection): void;
  /** Returns how to put the trim back, for an undo of the new zero (#624). */
  reset(source: SensorSource): () => void;
}

/** Loads every source's trim once; `storage` defaults to localStorage. */
export function createZeroTrims(storage?: KeyValueStorage | null): ZeroTrims {
  const trims = new Map<SensorSource, Calibration>(
    SENSOR_SOURCES.map((source) => [source, loadZeroTrim(source, storage) ?? NO_TRIM]),
  );
  const valueOf = (source: SensorSource) => trims.get(source) ?? NO_TRIM;
  const set = (source: SensorSource, next: Calibration) => {
    trims.set(source, next);
    if (isTrimmed(next)) saveZeroTrim(source, next, storage);
    else clearZeroTrim(source, storage);
  };
  return {
    valueOf,
    nudge: (source, direction) => set(source, nudgeTrim(valueOf(source), direction)),
    reset(source) {
      const before = valueOf(source);
      set(source, NO_TRIM);
      return () => set(source, before);
    },
  };
}
