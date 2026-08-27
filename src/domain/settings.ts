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
   * tabs, calibration and onboarding (#106–#110); 'glossy' reuses classic's
   * structure with a mid-2000s "Web 2.0" skin — gradients, bevels, soft
   * shadows — layered on purely via CSS (chat-directed restyle). Named
   * `appearance`, not `theme` — that name is already the light/dark axis.
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
  /**
   * Debug-only EasyLevel hardware-compatibility workaround (#212), reached
   * from the EasyLevel status page's "Debug info" disclosure, never the
   * normal settings panel. Off by default — zero behavior change for
   * anyone who never opens that disclosure. When on, `easyLevelSensor.ts`'s
   * transport waits `easyLevelConnectDelayMs` after a GATT connect
   * succeeds and before discovering services/characteristics, mirroring
   * (loosely — see `easyLevelConnectDelayMs`'s own comment) a settle delay
   * the official app's own decompiled connection handling applies that
   * this app does not. No physical box has confirmed needing this; it
   * exists so a box owner without a dev setup can experiment via the app's
   * own UI instead of needing a code change.
   */
  easyLevelConnectDelayEnabled: boolean;
  /**
   * The delay itself (ms), only applied while
   * `easyLevelConnectDelayEnabled` is true. Clamped to
   * `MAX_EASYLEVEL_CONNECT_DELAY_MS` so a mistyped huge value can't
   * effectively hang every connect attempt. One flat delay, not the
   * official app's own two-tier scheme — its decompiled
   * `onConnectionStateChange` branches on `BluetoothDevice.getBondState()`:
   * 1600ms if bonded, 300ms ("Bonding not required") otherwise. Web
   * Bluetooth exposes no equivalent bonding-state read to a web page, so
   * this app genuinely cannot tell the two cases apart and only ever has
   * one number to offer — but 300ms, not 1600ms, is the one actually worth
   * defaulting to: EasyLevel's own protocol needs no encryption and has no
   * WRITE characteristic (confirmed by decompile, `easyLevelSensor.ts`'s
   * module doc comment), so Android has no reason to ever bond with this
   * specific hardware — the official app's own bonded/1600ms branch is
   * essentially dead code for an EasyLevel box specifically, whatever other
   * devices that shared BLE-manager class might also handle.
   */
  easyLevelConnectDelayMs: number;
  /**
   * Which of the two physical orientations the EasyLevel box is mounted in
   * (#217) — mirrors the official app's own `"sensor_Placing"` setting
   * (see `easyLevelProtocol.ts`'s `EasyLevelMounting`/
   * `applyEasyLevelMounting`), exposed as a normal settings-page choice
   * rather than a debug-only one: unlike `easyLevelConnectDelayMs`, this
   * is an ordinary physical-installation fact any user with the box
   * mounted the second way needs, not a hardware-compatibility experiment.
   * `'standard'` (the official app's own default) never changes any
   * reading — the phone sensor and every other `OrientationSensor` never
   * read this field at all.
   */
  easyLevelMounting: EasyLevelMounting;
}

export type ThemeSetting = 'system' | 'light' | 'dark';

export type AppearanceSetting = 'classic' | 'modern' | 'glossy';

/**
 * The multi-source seam (#128, ADR 0014): identifies which
 * `OrientationSensor` implementation produced a reading. Every
 * implementation returns a fixed member of this union from `getSource()`.
 * `'phone'` covers the built-in sensor and its `?demo` stand-in;
 * `'easylevel'` is the EasyLevel BLE box (#116, `src/sensor/easyLevelSensor.ts`).
 */
export type SensorSource = 'phone' | 'easylevel';

export const SENSOR_SOURCES: readonly SensorSource[] = ['phone', 'easylevel'];

/**
 * The two physical mounting orientations the official EasyLevel app
 * supports (`"sensor_Placing"` 1/2, #217) — the same physical box rotated
 * 90°. Defined here, not in `sensor/easyLevelProtocol.ts` (which applies
 * the transform this selects), so `domain/` stays the one place every
 * settings-shaped type lives and `sensor/` depends on `domain/`, never the
 * reverse (ADR 0002). `'standard'` is the official app's own default.
 */
export type EasyLevelMounting = 'standard' | 'rotated90' | 'rotated180' | 'rotated270';

/** All four ways a box lying flat can be bolted in (#222) — the official
 * app only models the first two (`sensor_Placing` 1/2), but a real
 * installation can just as easily end up a half or three-quarter turn
 * round, and those two cases are precisely the ones the installation
 * offset (R34) cannot rescue: they invert a sign rather than add one, so
 * level still reads level and the wrong wheel gets flagged with full
 * confidence. Order is the rotation order, and doubles as the picker's
 * option order. */
export const EASYLEVEL_MOUNTINGS: readonly EasyLevelMounting[] = [
  'standard',
  'rotated90',
  'rotated180',
  'rotated270',
];

export type VehicleType = 'motorhome' | 'caravan';

export type AxleConfig = 'single' | 'boggie';

/**
 * `left`/`right`/`front`/`rear` target the middle of that edge (the mean
 * of its two wheels) — a coarser preference than a single corner.
 * `frontLeft`/`frontRight`/`rearLeft`/`rearRight` (design review) target
 * one specific wheel, matching how a waste-water outlet actually sits at
 * one corner of the vehicle, not spread across a whole side or axle.
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

/** Ceiling for `easyLevelConnectDelayMs` (#212) — long enough for any
 * plausible settle-time experiment, short enough that a mistyped value
 * can't turn every connect attempt into an effectively indefinite hang. */
export const MAX_EASYLEVEL_CONNECT_DELAY_MS = 5000;

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
  easyLevelConnectDelayEnabled: false,
  // The official app's own "not bonded" delay (see
  // `easyLevelConnectDelayMs`'s doc comment above), not its bonded 1600ms
  // — an EasyLevel box has no reason to ever be bonded, so this is the
  // branch that's actually relevant here. Not used at all while
  // `easyLevelConnectDelayEnabled` is false.
  easyLevelConnectDelayMs: 300,
  // Matches the official app's own default `sensor_Placing` (#217) — most
  // boxes are never touched by this setting at all.
  easyLevelMounting: 'standard',
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

/** Exported for `domain/vehicleShare.ts` (#207), which validates the same
 * shape of untrusted input (a received link) the same independent-fallback
 * way this module already validates stored settings — reused, not
 * reimplemented. */
export function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Exported for `domain/vehicleShare.ts` (#207) — see `positiveNumber` above. */
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
    // Presence check, not a truthiness check (#153): "never saved" (key
    // absent — fresh install or a pre-#153 settings blob) must fall back to
    // the new default, while an explicit prior choice, true or false, is
    // never overridden. Same pattern #136 used for the appearance default.
    soundOnLevel:
      typeof raw.soundOnLevel === 'boolean' ? raw.soundOnLevel : DEFAULT_SETTINGS.soundOnLevel,
    soundGuidance: raw.soundGuidance === true,
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
    appearance:
      raw.appearance === 'classic' || raw.appearance === 'modern' || raw.appearance === 'glossy'
        ? raw.appearance
        : DEFAULT_SETTINGS.appearance,
    // Validated the same way every other enum-like field is (#128), so a
    // corrupt or future-version value never breaks startup — it falls
    // back to the phone, which every install always has.
    sensorSource: SENSOR_SOURCES.includes(raw.sensorSource as SensorSource)
      ? (raw.sensorSource as SensorSource)
      : DEFAULT_SETTINGS.sensorSource,
    // Presence check (#212), same discipline as soundOnLevel above: absent
    // (never saved) falls back to the off default; an explicit prior
    // choice, true or false, is never overridden.
    easyLevelConnectDelayEnabled:
      typeof raw.easyLevelConnectDelayEnabled === 'boolean'
        ? raw.easyLevelConnectDelayEnabled
        : DEFAULT_SETTINGS.easyLevelConnectDelayEnabled,
    easyLevelConnectDelayMs: Math.min(
      MAX_EASYLEVEL_CONNECT_DELAY_MS,
      nonNegativeNumber(raw.easyLevelConnectDelayMs, DEFAULT_SETTINGS.easyLevelConnectDelayMs),
    ),
    // Validated the same enum-list way as sensorSource above (#217): a
    // corrupt or future-version value falls back to the official app's own
    // default rather than breaking startup.
    easyLevelMounting: EASYLEVEL_MOUNTINGS.includes(raw.easyLevelMounting as EasyLevelMounting)
      ? (raw.easyLevelMounting as EasyLevelMounting)
      : DEFAULT_SETTINGS.easyLevelMounting,
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
