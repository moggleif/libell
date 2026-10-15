/**
 * Saved vehicle level targets / presets (ADR 0013).
 *
 * A target preset is an intentional request for the vehicle to be
 * NON-level (e.g. tilted toward the shower or grey-water drain). This is
 * architecturally distinct from the two-layer calibration in
 * `calibration.ts` (ADR 0010): sensor calibration and the vehicle zero
 * both describe what "level" *means*; a preset is a third, separately
 * stored offset applied on top of their sum, describing an intentional
 * departure from it. "Normal" — no preset active — is represented by a
 * `null` active id, never a preset of its own, so it can never be lost
 * or accidentally overwritten.
 */
import { MAX_TILT_DEG, type Calibration } from './calibration';

/** What saving a target answered: null when saved, an error text when
 * nothing was saved, or a warning when it was saved but looks steeper than
 * 15° (#621). There is no undo: the target is deleted with its cross. */
export type TargetSaveResult = null | string | { warning: string };

export interface TargetPreset {
  id: string;
  /** User-entered name (e.g. "Shower drain") — shown verbatim, never
   * looked up in i18n. */
  name: string;
  /** Tilt offset relative to true level (the two-layer calibration sum),
   * in degrees — added on top of it, not stored inside it. */
  offset: Calibration;
}

/** An offset beyond this looks like a mis-capture, not an intentional
 * target — the same 15° the phone bias and vehicle zero warn at. */
const MAX_OFFSET_DEG = 15;

/** Long enough for "Grey-water drainage" and then some; short enough to
 * stay a badge, not a paragraph. */
const MAX_NAME_LENGTH = 40;

/** More presets than this cannot help fast selection. */
export const MAX_PRESET_COUNT = 20;

function isValidOffset(value: unknown): value is Calibration {
  if (typeof value !== 'object' || value === null) return false;
  const raw = value as Record<string, unknown>;
  return (
    typeof raw.rollDeg === 'number' &&
    typeof raw.pitchDeg === 'number' &&
    Number.isFinite(raw.rollDeg) &&
    Number.isFinite(raw.pitchDeg) &&
    // Up to any tilt a sensor can read: a target may be saved anyway above
    // `MAX_OFFSET_DEG`, and must survive a reload.
    Math.abs(raw.rollDeg) <= MAX_TILT_DEG &&
    Math.abs(raw.pitchDeg) <= MAX_TILT_DEG
  );
}

export function parseTargetPreset(value: unknown): TargetPreset | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== 'string' || raw.id === '') return null;
  if (typeof raw.name !== 'string' || raw.name.trim() === '') return null;
  if (!isValidOffset(raw.offset)) return null;
  return { id: raw.id, name: raw.name.trim().slice(0, MAX_NAME_LENGTH), offset: raw.offset };
}

/** Each entry is validated independently — one corrupt preset never drops
 * the rest. */
export function parseTargetPresets(value: unknown): TargetPreset[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: TargetPreset[] = [];
  for (const entry of value) {
    const preset = parseTargetPreset(entry);
    if (!preset || seen.has(preset.id)) continue;
    seen.add(preset.id);
    result.push(preset);
    if (result.length >= MAX_PRESET_COUNT) break;
  }
  return result;
}

/** A dangling or corrupt id resolves to "Normal" (`null`), never a silently
 * wrong target. */
export function parseActiveTargetId(value: unknown, presets: TargetPreset[]): string | null {
  if (typeof value !== 'string') return null;
  return presets.some((preset) => preset.id === value) ? value : null;
}

/**
 * The active preset's offset, or `null` for "Normal" (true level). The
 * host composes this with `combineCalibrations` — called a second time,
 * unchanged — to form the third additive term (ADR 0013):
 * `combineCalibrations(combineCalibrations(sensor, vehicleZero), targetOffsetFor(...))`.
 */
export function targetOffsetFor(
  presets: TargetPreset[],
  activeId: string | null,
): Calibration | null {
  if (activeId === null) return null;
  return presets.find((preset) => preset.id === activeId)?.offset ?? null;
}

/**
 * The offset to store when creating a preset from a live capture: the
 * raw reading minus whatever two-layer calibration is already in effect
 * — so the stored value is purely "how far from true level", exactly
 * what `targetOffsetFor` later adds back on top of that same sum.
 */
export function presetOffsetFromReading(
  raw: Calibration,
  zeroCalibration: Calibration | null,
): Calibration {
  return {
    rollDeg: raw.rollDeg - (zeroCalibration?.rollDeg ?? 0),
    pitchDeg: raw.pitchDeg - (zeroCalibration?.pitchDeg ?? 0),
  };
}

/** Too steep to be an intentional target rather than a mis-capture — the
 * user is warned first. */
export function offsetTooSteep(offset: Calibration): boolean {
  return Math.abs(offset.rollDeg) > MAX_OFFSET_DEG || Math.abs(offset.pitchDeg) > MAX_OFFSET_DEG;
}
