/**
 * Vehicle parameters used by the leveling math, and their defaults. Reading a
 * stored blob back is `settingsParsing.ts`.
 */
import type { AppearanceSetting } from './appearance';
import type { LengthUnit } from './lengths';
import type { EasyLevelSettings, XparkleSettings } from './sensorDeviceSettings';

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
   * Sorted ascending. On a staircase the wheel rests on one of these
   * heights, so the app recommends the step closest to the required lift;
   * a stepless wedge keeps only its maximum here (`rampStepless`).
   */
  rampStepHeightsMm: number[];
  /**
   * A stepless wedge rather than a staircase (#600): each wheel is driven up
   * exactly as far as it needs, up to the wedge's maximum — then the one
   * height in `rampStepHeightsMm`.
   */
  rampStepless: boolean;
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
  displayUnit: LengthUnit;
  /** Play a chime when the vehicle reaches level. */
  soundOnLevel: boolean;
  /**
   * Continuous audio guidance while approaching level (`audioGuidance.ts`).
   * Independent of `soundOnLevel`, which only covers the "reached" chime.
   */
  soundGuidance: boolean;
  /** Spoken guidance (`spokenGuidance.ts`, #602): says which wheel and how
   * much, with the phone's own offline voice. */
  soundSpeech: boolean;
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

export type ThemeSetting = 'system' | 'light' | 'dark';

export type { AppearanceSetting };

/**
 * The multi-source seam (ADR 0014): which `OrientationSensor` produced a
 * reading. `'phone'` covers the built-in sensor and its `?demo` stand-in.
 */
export type SensorSource = 'phone' | 'easylevel' | 'xparkle';

export const SENSOR_SOURCES: readonly SensorSource[] = ['phone', 'easylevel', 'xparkle'];

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

/**
 * The plausible range of each length read from storage or a shared link
 * (#541), in mm and with both ends included. A value outside falls back to
 * its default, and a step height outside is dropped, so nonsense such as a
 * 1e308 mm wheelbase never reaches the guidance.
 */
export const LENGTH_RANGES_MM = {
  wheelbase: { min: 500, max: 15000 },
  trackWidth: { min: 500, max: 4000 },
  rampStep: { min: 1, max: 500 },
  tolerance: { min: 1, max: 200 },
  stability: { min: 0, max: 50 },
};

/** Lives here rather than in the adapter so all defaults stay beside
 * `DEFAULT_SETTINGS`, which embeds this. */
export const DEFAULT_EASYLEVEL_SETTINGS: EasyLevelSettings = {
  // Matches the official app's default `sensor_Placing` and the manual's
  // "Långsidan framåt", shown as picked from the start (#594).
  mounting: 'standard',
  connectDelayEnabled: false,
  // The official app's "not bonded" delay (see `connectDelayMs`), not its
  // bonded 1600ms — an EasyLevel box has no reason to ever be bonded.
  connectDelayMs: 300,
};

export const DEFAULT_XPARKLE_SETTINGS: XparkleSettings = {
  // Nothing learned: the box's own axes.
  axisMapping: null,
  // The factory code every box ships with (`XPARKLE_DEFAULT_PASSWORD`).
  password: '0000',
};

export const DEFAULT_SETTINGS: LevelSettings = {
  vehicleType: 'motorhome',
  rearAxle: 'single',
  wheelbaseMm: 3800,
  trackWidthFrontMm: 1810,
  trackWidthRearMm: 1980,
  // Thule Levelers — the most common ready-made ramp in the catalog.
  rampStepHeightsMm: [44, 78, 112],
  rampStepless: false,
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
  soundSpeech: false,
  theme: 'system',
  // Modern is the default preset; Classic remains a full, permanently
  // supported choice.
  appearance: 'modern',
  sensorSource: 'phone',
  sensorDevices: { easylevel: DEFAULT_EASYLEVEL_SETTINGS },
};

/** Saving a measurement change is what puts the ⚠ Measurements lamp out; saving a
 * theme or a sound does not. */
export function measurementsDiffer(a: LevelSettings, b: LevelSettings): boolean {
  return (
    a.wheelbaseMm !== b.wheelbaseMm ||
    a.trackWidthFrontMm !== b.trackWidthFrontMm ||
    a.trackWidthRearMm !== b.trackWidthRearMm
  );
}

export type SoundPrefs = Pick<LevelSettings, 'soundOnLevel' | 'soundGuidance' | 'soundSpeech'>;

export function soundPrefsOf(settings: SoundPrefs): SoundPrefs {
  const { soundOnLevel, soundGuidance, soundSpeech } = settings;
  return { soundOnLevel, soundGuidance, soundSpeech };
}

/** Whether anything makes a sound, so audio is worth unlocking. */
export function anySoundOn(settings: SoundPrefs): boolean {
  return settings.soundOnLevel || settings.soundGuidance || settings.soundSpeech;
}

/**
 * One toggle for every sound preference. Muting remembers their exact prior
 * values in `preMute` (`null` when not muted); unmuting restores exactly
 * those, never forcing any back on.
 */
export function toggleMute(
  settings: SoundPrefs,
  preMute: SoundPrefs | null,
): { settings: SoundPrefs; preMute: SoundPrefs | null } {
  if (preMute) {
    return { settings: preMute, preMute: null };
  }
  return {
    settings: { soundOnLevel: false, soundGuidance: false, soundSpeech: false },
    preMute: soundPrefsOf(settings),
  };
}
