/**
 * What each stored key holds (#678), so the stored-data view can say it in
 * plain words. Each store lists its own keys; `storedData.ts` gathers them.
 */
import type { SensorSource } from '../domain/settings';

/** Every key Libell stores starts with this; nothing else is Libell's. */
export const LIBELL_PREFIX = 'libell.';

export type StoredKind =
  | 'settings'
  | 'language'
  | 'vehicles'
  | 'phoneCalibration'
  | 'vehicleZero'
  | 'boxZero'
  | 'zeroTrim'
  | 'targets'
  | 'activeTarget'
  | 'hitch'
  | 'rememberedBox'
  /** Anonymous counting switched off (#674). */
  | 'counting'
  /** First-run, migration and reload marks: how far the app has come. */
  | 'note'
  /** A copy an older version wrote, kept for a rollback. */
  | 'legacy'
  /** A libell.* key no store knows, say from a version since removed. */
  | 'other';

export interface StoredKey {
  key: string;
  kind: StoredKind;
  /** The box (or the phone) a per-source key belongs to. */
  source?: SensorSource;
  /** In `sessionStorage`, gone when the tab closes. */
  session?: boolean;
}

/** The same kind for each source's own key. */
export function perSource(
  sources: readonly SensorSource[],
  keyOf: (source: SensorSource) => string,
  kind: StoredKind,
): StoredKey[] {
  return sources.map((source) => ({ key: keyOf(source), kind, source }));
}
