/**
 * Vehicle parameters used by the leveling math. Pure module — no browser
 * APIs — so it is shared between the domain tests and the localStorage
 * store in `src/data/settingsStore.ts`.
 */

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
  /** Distance between front and rear axle, in mm. */
  wheelbaseMm: number;
  /** Distance between the front wheels, in mm. */
  trackWidthFrontMm: number;
  /** Distance between the rear wheels, in mm — may differ from the front. */
  trackWidthRearMm: number;
  /**
   * The step heights of the leveling ramp, in mm, sorted ascending. A ramp
   * is a staircase — the wheel rests on one of these heights, so the app
   * recommends the step closest to the required lift.
   */
  rampStepHeightsMm: number[];
  /**
   * How many ramps the user actually owns (1–MAX_RAMP_COUNT). The ramp
   * plan (ADR 0011) never asks for more wheels to drive up than this; a
   * boggie pair consumes two ramps. Ramps are sold in pairs, so 2 is
   * the default.
   */
  rampCount: number;
  /**
   * Where the waste-water drain sits, seen from the driver's seat. When
   * several ramp placements level the vehicle within the tolerance, the
   * plan prefers the one leaving this side lowest so the drains keep
   * working — sink and shower water must run toward the outlet;
   * 'none' disables the preference.
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
   * A shorter dwell (ms), used only for a wheel's mm figure once it has
   * *just* been confirmed moving consistently in one direction — the
   * shape of a deliberate, continuous motion like driving up a ramp —
   * so the live figure doesn't lag by the full `dwellRestMs` on every
   * intermediate step while the wheel is genuinely climbing (#183).
   * Never exceeds `dwellRestMs` (clamped where used).
   */
  dwellMotionMs: number;
  /** Unit used for displayed lengths; storage and math stay mm. */
  displayUnit: 'mm' | 'cm';
  /** Play a chime when the vehicle reaches level (opt-in). */
  soundOnLevel: boolean;
  /**
   * Continuous audio guidance while approaching level (#121, opt-in,
   * default off): pulse rate/pitch tracks the STABILIZED distance from
   * level, plus a non-alarming improving/worsening signal — see
   * `src/domain/audioGuidance.ts`. Independent of `soundOnLevel`, which
   * only covers the "reached" chime.
   */
  soundGuidance: boolean;
  /** Color theme: follow the phone, or force light/dark. */
  theme: ThemeSetting;
  /**
   * Visual preset, independent of light/dark (#104): 'classic' is today's
   * look; 'modern' is the redesigned surfaces, main view, menu, settings
   * tabs, calibration and onboarding (#106–#110). Named `appearance`, not
   * `theme` — that name is already the light/dark axis.
   */
  appearance: AppearanceSetting;
  /**
   * Which physical sensor the gravity reading comes from (#128, ADR 0014).
   * `'phone'` is the built-in DeviceMotion/DeviceOrientation sensor
   * (`?demo` also stands in for it) and stays the default — an external
   * source is always opt-in, never a silent replacement (#116). Future
   * adapters (#119's iOS bridge, ...) extend this union one literal at a
   * time as they land, rather than this field being invented per-adapter.
   */
  sensorSource: SensorSource;
}

export type ThemeSetting = 'system' | 'light' | 'dark';

export type AppearanceSetting = 'classic' | 'modern';

/**
 * The multi-source seam (#128, ADR 0014): identifies which
 * `OrientationSensor` implementation produced a reading. Every
 * implementation returns a fixed member of this union from `getSource()`.
 * `'phone'` covers the built-in sensor and its `?demo` stand-in;
 * `'easylevel'` is the EasyLevel BLE box (#116, `src/sensor/easyLevelSensor.ts`).
 */
export type SensorSource = 'phone' | 'easylevel';

export const SENSOR_SOURCES: readonly SensorSource[] = ['phone', 'easylevel'];

export type VehicleType = 'motorhome' | 'caravan';

export type AxleConfig = 'single' | 'boggie';

export type DrainPosition = 'none' | 'left' | 'right' | 'front' | 'rear';

export const DRAIN_POSITIONS: readonly DrainPosition[] = ['none', 'left', 'right', 'front', 'rear'];

/** More ramps than this cannot help a four-wheel vehicle. */
export const MAX_RAMP_COUNT = 4;

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
  // On by default (#153): a single short chime carries most of its value
  // only if users don't have to discover and enable it themselves. Never
  // overrides an explicit prior choice — see parseSettings' presence check.
  soundOnLevel: true,
  soundGuidance: false,
  theme: 'system',
  // Modern is the default preset (#136); Classic remains a full,
  // permanently-supported choice for anyone who picks it.
  appearance: 'modern',
  sensorSource: 'phone',
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

/** Validate a stored calibration; null when missing or corrupt. */
export function parseCalibration(value: unknown): Calibration | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const rollDeg = raw.rollDeg;
  const pitchDeg = raw.pitchDeg;
  if (
    typeof rollDeg !== 'number' ||
    typeof pitchDeg !== 'number' ||
    !Number.isFinite(rollDeg) ||
    !Number.isFinite(pitchDeg) ||
    Math.abs(rollDeg) > MAX_CALIBRATION_DEG ||
    Math.abs(pitchDeg) > MAX_CALIBRATION_DEG
  ) {
    return null;
  }
  return { rollDeg, pitchDeg };
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeHeights(values: number[]): number[] {
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
    // Presence check, not a truthiness check (#153): "never saved" (key
    // absent — fresh install or a pre-#153 settings blob) must fall back to
    // the new default, while an explicit prior choice, true or false, is
    // never overridden. Same pattern #136 used for the appearance default.
    soundOnLevel:
      typeof raw.soundOnLevel === 'boolean' ? raw.soundOnLevel : DEFAULT_SETTINGS.soundOnLevel,
    soundGuidance: raw.soundGuidance === true,
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
    appearance:
      raw.appearance === 'classic' || raw.appearance === 'modern'
        ? raw.appearance
        : DEFAULT_SETTINGS.appearance,
    // Validated the same way every other enum-like field is (#128), so a
    // corrupt or future-version value never breaks startup — it falls
    // back to the phone, which every install always has.
    sensorSource: SENSOR_SOURCES.includes(raw.sensorSource as SensorSource)
      ? (raw.sensorSource as SensorSource)
      : DEFAULT_SETTINGS.sensorSource,
  };
}

/**
 * The number only, no unit suffix ("63" / "6.3") — for callers that show
 * several lengths under one shared unit label (R14) rather than repeating
 * "mm"/"cm" on every value.
 */
export function formatLengthValue(mm: number, unit: 'mm' | 'cm'): string {
  if (unit === 'cm') {
    const cm = mm / 10;
    return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
  }
  return String(Math.round(mm));
}

/** Format a length in the chosen display unit ("63 mm" / "6.3 cm"). */
export function formatLength(mm: number, unit: 'mm' | 'cm'): string {
  return `${formatLengthValue(mm, unit)} ${unit}`;
}

/** The two sound preferences the bottom bar's mute toggle (#161) acts on
 * together — a plain object rather than reusing LevelSettings so this
 * stays obviously unrelated to every other field. */
export type SoundPrefs = Pick<LevelSettings, 'soundOnLevel' | 'soundGuidance'>;

/**
 * Mute/unmute (#161): a single toggle for `soundOnLevel` + `soundGuidance`
 * together. Muting remembers their exact prior values; unmuting restores
 * exactly those values — never forcing either back to `true` if the user
 * had it off already before muting. `preMute` is that memory: `null` when
 * not currently muted, otherwise what to restore. Pure, so the toggle and
 * restore logic is unit-testable without any DOM/storage involved.
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
