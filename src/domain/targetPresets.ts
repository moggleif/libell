/**
 * Saved vehicle level targets / presets (#122, ADR 0013) — pure
 * TypeScript, no browser APIs.
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
import type { Calibration } from './settings';

export interface TargetPreset {
  id: string;
  /** User-entered name (e.g. "Shower drain") — shown verbatim, never
   * looked up in i18n. */
  name: string;
  /** Tilt offset relative to true level (the two-layer calibration sum),
   * in degrees — added on top of it, not stored inside it. */
  offset: Calibration;
}

/** An offset beyond this is a mis-capture, not an intentional target —
 * the same cap `calibration.ts` uses for the phone bias and vehicle
 * zero. */
const MAX_OFFSET_DEG = 15;

/** Long enough for "Grey-water drainage" and then some; short enough to
 * stay a badge, not a paragraph. */
const MAX_NAME_LENGTH = 40;

/** More presets than this cannot help fast selection — same idea as
 * `MAX_RAMP_COUNT` in settings.ts. */
export const MAX_PRESET_COUNT = 20;

function isValidOffset(value: unknown): value is Calibration {
  if (typeof value !== 'object' || value === null) return false;
  const raw = value as Record<string, unknown>;
  return (
    typeof raw.rollDeg === 'number' &&
    typeof raw.pitchDeg === 'number' &&
    Number.isFinite(raw.rollDeg) &&
    Number.isFinite(raw.pitchDeg) &&
    Math.abs(raw.rollDeg) <= MAX_OFFSET_DEG &&
    Math.abs(raw.pitchDeg) <= MAX_OFFSET_DEG
  );
}

/** Validate one stored preset; null when missing or corrupt — the same
 * validate-on-read discipline as `parseCalibration` in settings.ts. */
export function parseTargetPreset(value: unknown): TargetPreset | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== 'string' || raw.id === '') return null;
  if (typeof raw.name !== 'string' || raw.name.trim() === '') return null;
  if (!isValidOffset(raw.offset)) return null;
  return { id: raw.id, name: raw.name.trim().slice(0, MAX_NAME_LENGTH), offset: raw.offset };
}

/**
 * Parse the stored preset list: each entry validated independently — one
 * corrupt preset never drops the rest — deduplicated by id and capped at
 * `MAX_PRESET_COUNT`.
 */
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

/**
 * Validate a stored active-target id against the known presets — a
 * dangling or corrupt id (a preset deleted elsewhere, hand-edited
 * storage) resolves to "Normal" (`null`), never a crash or a silently
 * wrong target.
 */
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

/** True when a captured reading is too steep to be an intentional
 * target rather than a mis-capture — same cap as storage validation. */
export function offsetTooSteep(offset: Calibration): boolean {
  return Math.abs(offset.rollDeg) > MAX_OFFSET_DEG || Math.abs(offset.pitchDeg) > MAX_OFFSET_DEG;
}
