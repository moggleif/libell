/**
 * Target presets (ADR 0013): an intentional NON-level target, a
 * third additive term on top of the zero, never conflated with it and
 * never stored in the same field. "Normal" (no active target) leaves the
 * effective calibration identical to the zero.
 */
import type { Calibration, CaptureResult } from '../domain/calibration';
import {
  offsetTooSteep,
  presetOffsetFromReading,
  targetOffsetFor,
  type TargetPreset,
} from '../domain/targetPresets';
import {
  loadActiveTargetId,
  loadTargetPresets,
  saveActiveTargetId,
  saveTargetPresets,
} from '../data/settingsStore';
import type { KeyValueStorage } from '../data/keyValueStorage';
import { t } from '../ui/i18n';

export interface TargetsDeps {
  /** The active sensor's tilt now, or the message to show instead. */
  readTilt(): Calibration | string;
  /** What "level" means now, which a new target is measured from. */
  zeroCalibration(): Calibration | null;
  /** The active target changed or may have. */
  onActiveChanged(): void;
  storage?: KeyValueStorage | null;
  newId?: () => string;
}

export interface Targets {
  presets(): TargetPreset[];
  /** Null for Normal, here and below. */
  activeId(): string | null;
  activeName(): string | null;
  activeOffset(): Calibration | null;
  select(id: string | null): void;
  /** Save the current tilt as a new target: null when saved, an error
   * message, or a warning above 15° unless `anyway`. */
  add(name: string, anyway?: boolean): CaptureResult;
  remove(id: string): void;
  rename(id: string, name: string): void;
}

function randomId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `preset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createTargets(deps: TargetsDeps): Targets {
  const { storage } = deps;
  const newId = deps.newId ?? randomId;
  let presets = loadTargetPresets(storage);
  let activeId = loadActiveTargetId(presets, storage);

  function savePresets(next: TargetPreset[]): void {
    presets = next;
    saveTargetPresets(presets, storage);
  }

  function select(id: string | null): void {
    activeId = id;
    saveActiveTargetId(id, storage);
    deps.onActiveChanged();
  }

  return {
    presets: () => presets,
    activeId: () => activeId,
    activeName: () => presets.find((preset) => preset.id === activeId)?.name ?? null,
    activeOffset: () => targetOffsetFor(presets, activeId),
    select,
    add(name, anyway = false) {
      const reading = deps.readTilt();
      if (typeof reading === 'string') return reading;
      // Relative to the zero, never to any currently active target.
      const offset = presetOffsetFromReading(reading, deps.zeroCalibration());
      if (!anyway && offsetTooSteep(offset)) return { warning: t('targets.warn.tooSteep') };
      savePresets([...presets, { id: newId(), name, offset }]);
      return null;
    },
    rename(id, name) {
      savePresets(presets.map((preset) => (preset.id === id ? { ...preset, name } : preset)));
      deps.onActiveChanged();
    },
    remove(id) {
      savePresets(presets.filter((preset) => preset.id !== id));
      if (activeId === id) select(null);
      else deps.onActiveChanged();
    },
  };
}
