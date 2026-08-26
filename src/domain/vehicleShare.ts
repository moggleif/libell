/**
 * "Share vehicle setup" (R40, #207): encode/decode the minimal subset of
 * `LevelSettings` that describes the physical vehicle, for a link a family
 * member can open to get the same wheel-raise guidance without re-typing
 * every dimension by hand.
 *
 * Deliberately excludes:
 * - Every calibration value (phone bias, vehicle zero, EasyLevel install
 *   offset) — each is tied to exactly where one phone/box physically sits
 *   in one vehicle (ADR 0010, ADR 0014); sharing it to a different phone
 *   or a different spot would silently produce wrong readings.
 * - Every UI/behavior preference (tolerance, stability, dwell, unit,
 *   sound, theme, appearance, sensor source) — per-person choices, not
 *   "this is my RV".
 *
 * None of the included fields are sensitive or personal, so this is about
 * correctness (fail closed on a bad link) rather than confidentiality —
 * see the issue for the fuller reasoning. Pure module (ADR 0002): the only
 * non-arithmetic APIs used are the base64/UTF-8 encoders every JS runtime
 * (browser or Node) provides as globals, not browser-specific ones.
 */
import {
  DEFAULT_SETTINGS,
  DRAIN_POSITIONS,
  MAX_RAMP_COUNT,
  normalizeHeights,
  positiveNumber,
  type AxleConfig,
  type DrainPosition,
  type LevelSettings,
  type VehicleType,
} from './settings';

export type VehicleGeometry = Pick<
  LevelSettings,
  | 'vehicleType'
  | 'rearAxle'
  | 'wheelbaseMm'
  | 'trackWidthFrontMm'
  | 'trackWidthRearMm'
  | 'rampStepHeightsMm'
  | 'rampCount'
  | 'drainPosition'
>;

/** Bumped only if the encoded shape ever changes incompatibly — a link
 * carrying any other value is rejected outright (`decodeVehicleGeometry`
 * returns null) rather than guessed at. */
const SCHEMA_VERSION = 1;

/** The share payload: exactly the fields above, nothing else — reused by
 * the settings form (what to encode) and the receiving side's preview. */
export function pickVehicleGeometry(settings: LevelSettings): VehicleGeometry {
  return {
    vehicleType: settings.vehicleType,
    rearAxle: settings.rearAxle,
    wheelbaseMm: settings.wheelbaseMm,
    trackWidthFrontMm: settings.trackWidthFrontMm,
    trackWidthRearMm: settings.trackWidthRearMm,
    rampStepHeightsMm: settings.rampStepHeightsMm,
    rampCount: settings.rampCount,
    drainPosition: settings.drainPosition,
  };
}

/** Merge a received geometry into the recipient's own settings — every
 * other field (both calibration layers, EasyLevel pairing, every UI/
 * behavior preference) is left exactly as it already was. */
export function applyVehicleGeometry(
  settings: LevelSettings,
  geometry: VehicleGeometry,
): LevelSettings {
  return { ...settings, ...geometry };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array | null {
  // Reject anything outside the base64url alphabet up front — `atob`
  // otherwise tolerates surprising input (whitespace, partial padding)
  // that would make "malformed" harder to reason about.
  if (text === '' || !/^[A-Za-z0-9_-]+$/.test(text)) return null;
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  try {
    const binary = atob(withPadding);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/**
 * Encodes to a compact, URL-fragment-safe string (no `+`/`/`/`=`, so it
 * never needs percent-encoding). The caller places it after a `#` — a URL
 * fragment is never sent to any server (there is no backend, SECURITY.md),
 * so it never reaches request logs either.
 */
export function encodeVehicleGeometry(geometry: VehicleGeometry): string {
  const json = JSON.stringify({ v: SCHEMA_VERSION, g: geometry });
  return toBase64Url(new TextEncoder().encode(json));
}

/**
 * Decodes and validates a link's payload. Fails closed (`null`) on
 * anything malformed, truncated, or from an unrecognized schema version —
 * never a partial result from a corrupt envelope. Once the envelope
 * itself checks out, individual fields fall back the same independent way
 * `parseSettings` already does for stored settings, so one corrupt field
 * inside an otherwise-valid link never rejects the whole thing.
 */
export function decodeVehicleGeometry(text: string): VehicleGeometry | null {
  const bytes = fromBase64Url(text);
  if (!bytes) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const envelope = parsed as Record<string, unknown>;
  if (envelope.v !== SCHEMA_VERSION) return null;
  if (typeof envelope.g !== 'object' || envelope.g === null) return null;
  return parseVehicleGeometry(envelope.g as Record<string, unknown>);
}

function parseVehicleGeometry(raw: Record<string, unknown>): VehicleGeometry {
  const heights = Array.isArray(raw.rampStepHeightsMm)
    ? normalizeHeights(raw.rampStepHeightsMm.filter((v): v is number => typeof v === 'number'))
    : [];
  return {
    vehicleType: raw.vehicleType === 'caravan' ? 'caravan' : ('motorhome' as VehicleType),
    rearAxle: raw.rearAxle === 'boggie' ? 'boggie' : ('single' as AxleConfig),
    wheelbaseMm: positiveNumber(raw.wheelbaseMm, DEFAULT_SETTINGS.wheelbaseMm),
    trackWidthFrontMm: positiveNumber(raw.trackWidthFrontMm, DEFAULT_SETTINGS.trackWidthFrontMm),
    trackWidthRearMm: positiveNumber(raw.trackWidthRearMm, DEFAULT_SETTINGS.trackWidthRearMm),
    rampStepHeightsMm: heights.length > 0 ? heights : DEFAULT_SETTINGS.rampStepHeightsMm,
    rampCount:
      typeof raw.rampCount === 'number' && Number.isFinite(raw.rampCount) && raw.rampCount >= 1
        ? Math.min(MAX_RAMP_COUNT, Math.round(raw.rampCount))
        : DEFAULT_SETTINGS.rampCount,
    drainPosition: DRAIN_POSITIONS.includes(raw.drainPosition as DrainPosition)
      ? (raw.drainPosition as DrainPosition)
      : DEFAULT_SETTINGS.drainPosition,
  };
}
