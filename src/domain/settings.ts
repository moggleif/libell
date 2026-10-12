/** Vehicle parameters used by the leveling math, and their validation. */
import { parseAxisMapping, type AxisMapping } from './axisMapping';
import { isAppearance, type AppearanceSetting } from './appearance';

export interface LevelSettings {
  /**
   * What is being leveled: a motorhome (four wheels) or a caravan
   * (single axle + jockey wheel — ADR 0008). The caravan reuses
   * `trackWidthRearMm` as its axle track and `wheelbaseMm` as the
   * axle-to-jockey-wheel distance.
   */
  vehicleType: VehicleType;
  /**
   * The wheel axle's configuration: single, or a boggie (tandem) pair.
   * A boggie is modeled as one leveling axle at its midpoint (ADR 0009)
   * — the math is untouched; the diagram draws wheel pairs and the
   * measurements are taken to the boggie's centre.
   */
  rearAxle: AxleConfig;
  wheelbaseMm: number;
  trackWidthFrontMm: number;
  /** May differ from the front. */
  trackWidthRearMm: number;
  /**
   * Sorted ascending. A ramp is a staircase — the wheel rests on one of these
   * heights, so the app recommends the step closest to the required lift.
   */
  rampStepHeightsMm: number[];
  /**
   * How many ramps the user owns (1–MAX_RAMP_COUNT). The ramp plan (ADR 0011)
   * never asks for more than this; a boggie pair consumes two ramps. Ramps
   * are sold in pairs, so 2 is the default.
   */
  rampCount: number;
  /**
   * Where the waste-water drain sits, seen from the driver's seat. When
   * several ramp placements level the vehicle, the plan prefers the one
   * leaving this side lowest so sink and shower water runs toward the outlet.
   */
  drainPosition: DrainPosition;
  /**
   * Max height a wheel may sit below the highest wheel and still count
   * as level, in mm. Height-based, so wheelbase and track width are
   * inherently accounted for.
   */
  toleranceMm: number;
  /**
   * Display hysteresis dead band in mm: how far a reading must move past
   * a boundary before the shown value changes. 0 disables it.
   */
  stabilityMm: number;
  /**
   * How long (ms) a reading must sit clearly past `stabilityMm` before the
   * shown mm figure and ramp plan adopt it — the baseline used whenever
   * the reading isn't already trending (jitter, a bump, first settling).
   */
  dwellRestMs: number;
  /**
   * A shorter dwell (ms), used only for a wheel's mm figure once it has been
   * confirmed moving consistently in one direction — like driving up a ramp —
   * so the live figure doesn't lag by the full `dwellRestMs` on every step
   * while the wheel climbs. Never exceeds `dwellRestMs` (clamped where used).
   */
  dwellMotionMs: number;
  /** Unit used for displayed lengths; storage and math stay mm. */
  displayUnit: 'mm' | 'cm';
  /** Play a chime when the vehicle reaches level. */
  soundOnLevel: boolean;
  /**
   * Continuous audio guidance while approaching level (`audioGuidance.ts`).
   * Independent of `soundOnLevel`, which only covers the "reached" chime.
   */
  soundGuidance: boolean;
  theme: ThemeSetting;
  /**
   * Visual preset, independent of light/dark (`theme`). 'glossy' reuses
   * classic's structure with a "Web 2.0" skin layered on purely via CSS.
   */
  appearance: AppearanceSetting;
  /**
   * Which physical sensor the gravity reading comes from (ADR 0014). An
   * external source is always opt-in, never a silent replacement for the
   * phone.
   */
  sensorSource: SensorSource;
  /**
   * Settings that belong to one external sensor, keyed by source id
   * (ADR 0016).
   *
   * An untyped bag on purpose: entries for sources this build does not know
   * survive a load/save round trip, so moving between builds cannot destroy
   * the other build's device settings. Read it only through the typed
   * accessors (`easyLevelSettings`), which validate each field.
   */
  sensorDevices: SensorDeviceSettings;
}

/**
 * Values are validated when read by a typed accessor rather than at parse
 * time, which lets an unknown source's entry survive this build.
 */
export type SensorDeviceSettings = Record<string, unknown>;

export interface EasyLevelSettings {
  /**
   * Which of the four physical orientations the box is mounted in — mirrors
   * the official app's `"sensor_Placing"` (see `applyEasyLevelMounting`).
   * `'standard'` never changes any reading.
   */
  mounting: EasyLevelMounting;
  /**
   * Whether the user has picked the placement, so the box's page asks until
   * they have. Readings use `mounting` either way. An entry without this
   * field counts as picked when its rotation is not the default, which only
   * a choice could have stored.
   */
  mountingPicked: boolean;
  /**
   * Debug-only hardware-compatibility workaround, reached from the EasyLevel
   * status page's "Debug info". When on, the transport waits
   * `connectDelayMs` after a GATT connect and before discovering services,
   * loosely mirroring a settle delay in the official app's decompiled
   * connection handling. No physical box has confirmed needing it; it lets a
   * box owner without a dev setup experiment.
   */
  connectDelayEnabled: boolean;
  /**
   * Clamped to `MAX_EASYLEVEL_CONNECT_DELAY_MS`. One flat delay, not the
   * official app's two-tier scheme (1600ms if bonded, 300ms otherwise): Web
   * Bluetooth exposes no bonding state, and 300ms is the branch that matters,
   * since EasyLevel's protocol needs no encryption and has no WRITE
   * characteristic, so Android has no reason to bond with it.
   */
  connectDelayMs: number;
}

export type ThemeSetting = 'system' | 'light' | 'dark';

export type { AppearanceSetting };

/**
 * The multi-source seam (ADR 0014): which `OrientationSensor` produced a
 * reading. `'phone'` covers the built-in sensor and its `?demo` stand-in.
 */
export type SensorSource = 'phone' | 'easylevel' | 'xparkle';

export const SENSOR_SOURCES: readonly SensorSource[] = ['phone', 'easylevel', 'xparkle'];

/**
 * How the EasyLevel box is rotated in place. Defined here, not in
 * `sensor/easyLevelProtocol.ts` (which applies the transform), so `sensor/`
 * depends on `domain/`, never the reverse (ADR 0002).
 */
export type EasyLevelMounting = 'standard' | 'rotated90' | 'rotated180' | 'rotated270';

/** All four ways a box lying flat can be bolted in. The official app only
 * models the first two (`sensor_Placing` 1/2), but the other two are exactly
 * the ones the installation offset (R34) cannot rescue: they invert a sign rather
 * than add one, so level still reads level and the wrong wheel gets flagged
 * with full confidence. In rotation order. */
export const EASYLEVEL_MOUNTINGS: readonly EasyLevelMounting[] = [
  'standard',
  'rotated90',
  'rotated180',
  'rotated270',
];

export type VehicleType = 'motorhome' | 'caravan';

export type AxleConfig = 'single' | 'boggie';

/**
 * `left`/`right`/`front`/`rear` target the middle of that edge (the mean of
 * its two wheels); the corner values target one specific wheel.
 */
export type DrainPosition =
  | 'none'
  | 'left'
  | 'right'
  | 'front'
  | 'rear'
  | 'frontLeft'
  | 'frontRight'
  | 'rearLeft'
  | 'rearRight';

export const DRAIN_POSITIONS: readonly DrainPosition[] = [
  'none',
  'left',
  'right',
  'front',
  'rear',
  'frontLeft',
  'frontRight',
  'rearLeft',
  'rearRight',
];

/** More ramps than this cannot help a four-wheel vehicle. */
export const MAX_RAMP_COUNT = 4;

/** Long enough for any plausible settle-time experiment, short enough that a
 * mistyped value can't effectively hang every connect attempt. */
export const MAX_EASYLEVEL_CONNECT_DELAY_MS = 5000;

/** Lives here rather than in the adapter so all defaults stay beside
 * `DEFAULT_SETTINGS`, which embeds this. */
export const DEFAULT_EASYLEVEL_SETTINGS: EasyLevelSettings = {
  // Matches the official app's default `sensor_Placing` — most boxes are
  // never touched by this setting at all.
  mounting: 'standard',
  mountingPicked: false,
  connectDelayEnabled: false,
  // The official app's "not bonded" delay (see `connectDelayMs`), not its
  // bonded 1600ms — an EasyLevel box has no reason to ever be bonded.
  connectDelayMs: 300,
};

export interface XparkleSettings {
  /**
   * How the box sits in the vehicle, learned by lifting the front and the
   * right side (`domain/axisMapping.ts`), or null for "as the box reports
   * it". Applied to every reading before anything else sees it.
   */
  axisMapping: AxisMapping | null;
  /**
   * Offered on every connect. The factory code unless the user typed another
   * after the box rejected it — so a code changed in the vendor app is fixed
   * here.
   */
  password: string;
}

const DEFAULT_XPARKLE_SETTINGS: XparkleSettings = {
  // Nothing learned: the box's own axes.
  axisMapping: null,
  // The factory code every box ships with (`XPARKLE_DEFAULT_PASSWORD`).
  password: '0000',
};

function isXparklePassword(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}$/.test(value);
}

export const DEFAULT_SETTINGS: LevelSettings = {
  vehicleType: 'motorhome',
  rearAxle: 'single',
  wheelbaseMm: 3800,
  trackWidthFrontMm: 1810,
  trackWidthRearMm: 1980,
  // Thule Levelers — the most common ready-made ramp in the catalog.
  rampStepHeightsMm: [44, 78, 112],
  rampCount: 2,
  drainPosition: 'none',
  toleranceMm: 20,
  stabilityMm: 3,
  dwellRestMs: 600,
  dwellMotionMs: 150,
  displayUnit: 'mm',
  // On by default: a short chime carries most of its value only if users
  // don't have to discover and enable it. Never overrides an explicit prior
  // choice — see parseSettings' presence check.
  soundOnLevel: true,
  soundGuidance: false,
  theme: 'system',
  // Modern is the default preset; Classic remains a full, permanently
  // supported choice.
  appearance: 'modern',
  sensorSource: 'phone',
  sensorDevices: { easylevel: DEFAULT_EASYLEVEL_SETTINGS },
};

/**
 * Phone calibration: the roll/pitch the sensor reports when the phone lies
 * on a surface known to be level (a case, a slightly warped table). Stored
 * separately from the vehicle settings and subtracted from every reading.
 */
export interface Calibration {
  rollDeg: number;
  pitchDeg: number;
}

/** Offsets beyond this are a mis-tap, not a phone bias. */
const MAX_CALIBRATION_DEG = 15;

/**
 * The widest a tilt can read (`atan2`'s range). The phone's calibration and
 * vehicle zero may be stored beyond 15° when the user goes ahead despite the
 * warning, so reading them back only rejects what no sensor could produce.
 */
export const MAX_TILT_DEG = 180;

/** Validate a stored calibration; null when missing, corrupt or beyond
 * `maxDeg` on either axis (default: the 15° capture limit). */
export function parseCalibration(
  value: unknown,
  maxDeg: number = MAX_CALIBRATION_DEG,
): Calibration | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const rollDeg = raw.rollDeg;
  const pitchDeg = raw.pitchDeg;
  if (
    typeof rollDeg !== 'number' ||
    typeof pitchDeg !== 'number' ||
    !Number.isFinite(rollDeg) ||
    !Number.isFinite(pitchDeg) ||
    Math.abs(rollDeg) > maxDeg ||
    Math.abs(pitchDeg) > maxDeg
  ) {
    return null;
  }
  return { rollDeg, pitchDeg };
}

export function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function normalizeHeights(values: number[]): number[] {
  const cleaned = values.filter((v) => Number.isFinite(v) && v > 0);
  return [...new Set(cleaned)].sort((a, b) => a - b);
}

/**
 * Parse the settings-form text for available step heights: mm values
 * separated by semicolons (commas tolerated as a decimal or list
 * separator), e.g. "20; 45; 60". Invalid entries are dropped.
 */
export function parseStepHeightsList(text: string): number[] {
  const items = text.split(';').flatMap((part) => {
    const trimmed = part.trim();
    if (trimmed === '') return [];
    // Accept a decimal comma ("4,5") but also plain comma-separated lists.
    if (trimmed.includes(',') && !/^\d+,\d+$/.test(trimmed)) {
      return trimmed.split(',').map((p) => Number.parseFloat(p.trim().replace(',', '.')));
    }
    return [Number.parseFloat(trimmed.replace(',', '.'))];
  });
  return normalizeHeights(items);
}

/** Format the step heights back into the form's "20; 40; 60" notation. */
export function formatStepHeightsList(heights: number[]): string {
  return heights.join('; ');
}

/**
 * Turn untrusted input (localStorage JSON, hand-edited or from an older
 * version) into a usable `LevelSettings`. Each field falls back to its
 * default independently, so one bad value never breaks startup. Legacy
 * values are migrated: everything once stored in cm (wheelbase, track
 * widths — including a single `trackWidthCm` for both axles — and step
 * heights) is converted to mm.
 */
export function parseSettings(value: unknown): LevelSettings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const cm = (v: unknown) => {
    const n = positiveNumber(v, NaN);
    return Number.isNaN(n) ? undefined : n * 10;
  };
  const legacyTrackMm = cm(raw.trackWidthCm);
  const dwellRestMs = positiveNumber(raw.dwellRestMs, DEFAULT_SETTINGS.dwellRestMs);

  let heights = Array.isArray(raw.rampStepHeightsMm)
    ? normalizeHeights(raw.rampStepHeightsMm.filter((v): v is number => typeof v === 'number'))
    : [];
  if (heights.length === 0 && Array.isArray(raw.blockHeightsCm)) {
    heights = normalizeHeights(
      raw.blockHeightsCm.filter((v): v is number => typeof v === 'number').map((v) => v * 10),
    );
  }
  if (heights.length === 0) {
    const legacyBlockCm = positiveNumber(raw.blockHeightCm, NaN);
    heights = Number.isNaN(legacyBlockCm)
      ? DEFAULT_SETTINGS.rampStepHeightsMm
      : [legacyBlockCm * 10];
  }

  return {
    vehicleType: raw.vehicleType === 'caravan' ? 'caravan' : 'motorhome',
    rearAxle: raw.rearAxle === 'boggie' ? 'boggie' : 'single',
    wheelbaseMm: positiveNumber(
      raw.wheelbaseMm,
      cm(raw.wheelbaseCm) ?? DEFAULT_SETTINGS.wheelbaseMm,
    ),
    trackWidthFrontMm: positiveNumber(
      raw.trackWidthFrontMm,
      cm(raw.trackWidthFrontCm) ?? legacyTrackMm ?? DEFAULT_SETTINGS.trackWidthFrontMm,
    ),
    trackWidthRearMm: positiveNumber(
      raw.trackWidthRearMm,
      cm(raw.trackWidthRearCm) ?? legacyTrackMm ?? DEFAULT_SETTINGS.trackWidthRearMm,
    ),
    rampStepHeightsMm: heights,
    rampCount:
      typeof raw.rampCount === 'number' && Number.isFinite(raw.rampCount) && raw.rampCount >= 1
        ? Math.min(MAX_RAMP_COUNT, Math.round(raw.rampCount))
        : DEFAULT_SETTINGS.rampCount,
    drainPosition: DRAIN_POSITIONS.includes(raw.drainPosition as DrainPosition)
      ? (raw.drainPosition as DrainPosition)
      : DEFAULT_SETTINGS.drainPosition,
    // A legacy toleranceDeg (degrees) has no unambiguous mm equivalent —
    // it falls back to the default.
    toleranceMm: positiveNumber(raw.toleranceMm, DEFAULT_SETTINGS.toleranceMm),
    stabilityMm: nonNegativeNumber(raw.stabilityMm, DEFAULT_SETTINGS.stabilityMm),
    dwellRestMs,
    // Clamped against the (already-validated) rest dwell, not its own
    // default, so a corrupt/legacy value can never end up slower than rest.
    dwellMotionMs: Math.min(
      positiveNumber(raw.dwellMotionMs, DEFAULT_SETTINGS.dwellMotionMs),
      dwellRestMs,
    ),
    displayUnit: raw.displayUnit === 'cm' ? 'cm' : 'mm',
    // Presence check, not truthiness: "never saved" falls back to the
    // default, while an explicit prior choice, true or false, is never
    // overridden.
    soundOnLevel:
      typeof raw.soundOnLevel === 'boolean' ? raw.soundOnLevel : DEFAULT_SETTINGS.soundOnLevel,
    soundGuidance: raw.soundGuidance === true,
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
    appearance: isAppearance(raw.appearance) ? raw.appearance : DEFAULT_SETTINGS.appearance,
    // A corrupt or future-version value falls back to the phone, which
    // every install has.
    sensorSource: SENSOR_SOURCES.includes(raw.sensorSource as SensorSource)
      ? (raw.sensorSource as SensorSource)
      : DEFAULT_SETTINGS.sensorSource,
    sensorDevices: parseSensorDevices(raw),
  };
}

/**
 * Unlike every other field, entries are **not** validated here: a source this
 * build has never heard of has no schema, and dropping it would destroy
 * another build's device settings on the first save. Typed accessors
 * (`easyLevelSettings`) validate at the point of use.
 *
 * Also migrates the legacy flat `easyLevel*` fields into the bag, unless the
 * blob already has an `easylevel` entry.
 */
function parseSensorDevices(raw: Record<string, unknown>): SensorDeviceSettings {
  const stored = isRecord(raw.sensorDevices) ? raw.sensorDevices : {};
  const devices: SensorDeviceSettings = { ...DEFAULT_SETTINGS.sensorDevices };
  for (const [source, value] of Object.entries(stored)) {
    if (isRecord(value)) devices[source] = value;
  }
  // Only when the blob carries no entry of its own: an existing entry is
  // newer than the flat fields it replaced, so it always wins.
  if (!isRecord(stored.easylevel)) {
    const legacy = legacyEasyLevelSettings(raw);
    if (legacy) devices.easylevel = legacy;
  }
  return devices;
}

function legacyEasyLevelSettings(raw: Record<string, unknown>): Record<string, unknown> | null {
  const hasAny =
    raw.easyLevelMounting !== undefined ||
    raw.easyLevelConnectDelayEnabled !== undefined ||
    raw.easyLevelConnectDelayMs !== undefined;
  if (!hasAny) return null;
  return {
    mounting: raw.easyLevelMounting,
    connectDelayEnabled: raw.easyLevelConnectDelayEnabled,
    connectDelayMs: raw.easyLevelConnectDelayMs,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A missing, corrupt or partly-corrupt entry yields defaults per field
 * rather than failing — the rest of the settings must still load.
 */
export function easyLevelSettings(settings: LevelSettings): EasyLevelSettings {
  const stored = settings.sensorDevices.easylevel;
  const raw = isRecord(stored) ? stored : {};
  const mounting = EASYLEVEL_MOUNTINGS.includes(raw.mounting as EasyLevelMounting)
    ? (raw.mounting as EasyLevelMounting)
    : DEFAULT_EASYLEVEL_SETTINGS.mounting;
  return {
    mounting,
    mountingPicked:
      typeof raw.mountingPicked === 'boolean'
        ? raw.mountingPicked
        : mounting !== DEFAULT_EASYLEVEL_SETTINGS.mounting,
    // Presence check, as for soundOnLevel.
    connectDelayEnabled:
      typeof raw.connectDelayEnabled === 'boolean'
        ? raw.connectDelayEnabled
        : DEFAULT_EASYLEVEL_SETTINGS.connectDelayEnabled,
    connectDelayMs: Math.min(
      MAX_EASYLEVEL_CONNECT_DELAY_MS,
      nonNegativeNumber(raw.connectDelayMs, DEFAULT_EASYLEVEL_SETTINGS.connectDelayMs),
    ),
  };
}

export function xparkleSettings(settings: LevelSettings): XparkleSettings {
  const stored = settings.sensorDevices.xparkle;
  const raw = isRecord(stored) ? stored : {};
  return {
    axisMapping: parseAxisMapping(raw.axisMapping),
    password: isXparklePassword(raw.password) ? raw.password : DEFAULT_XPARKLE_SETTINGS.password,
  };
}

export function withXparkleSettings(
  settings: LevelSettings,
  patch: Partial<XparkleSettings>,
): LevelSettings {
  return {
    ...settings,
    sensorDevices: {
      ...settings.sensorDevices,
      xparkle: { ...xparkleSettings(settings), ...patch },
    },
  };
}

/** Every other source's entry, known or not, is carried through untouched. */
export function withEasyLevelSettings(
  settings: LevelSettings,
  patch: Partial<EasyLevelSettings>,
): LevelSettings {
  return {
    ...settings,
    sensorDevices: {
      ...settings.sensorDevices,
      easylevel: { ...easyLevelSettings(settings), ...patch },
    },
  };
}

/** Saving a measurement change is what puts the ⚠ Setup lamp out; saving a
 * theme or a sound does not. */
export function measurementsDiffer(a: LevelSettings, b: LevelSettings): boolean {
  return (
    a.wheelbaseMm !== b.wheelbaseMm ||
    a.trackWidthFrontMm !== b.trackWidthFrontMm ||
    a.trackWidthRearMm !== b.trackWidthRearMm
  );
}

/** The number only, no unit suffix ("63" / "6.3"), for several lengths under
 * one shared unit label (R14). */
export function formatLengthValue(mm: number, unit: 'mm' | 'cm'): string {
  if (unit === 'cm') {
    const cm = mm / 10;
    return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
  }
  return String(Math.round(mm));
}

/** "63 mm" / "6.3 cm". */
export function formatLength(mm: number, unit: 'mm' | 'cm'): string {
  return `${formatLengthValue(mm, unit)} ${unit}`;
}

export type SoundPrefs = Pick<LevelSettings, 'soundOnLevel' | 'soundGuidance'>;

/**
 * One toggle for both sound preferences. Muting remembers their exact prior
 * values in `preMute` (`null` when not muted); unmuting restores exactly
 * those, never forcing either back on.
 */
export function toggleMute(
  settings: SoundPrefs,
  preMute: SoundPrefs | null,
): { settings: SoundPrefs; preMute: SoundPrefs | null } {
  if (preMute) {
    return { settings: preMute, preMute: null };
  }
  return {
    settings: { soundOnLevel: false, soundGuidance: false },
    preMute: { soundOnLevel: settings.soundOnLevel, soundGuidance: settings.soundGuidance },
  };
}
