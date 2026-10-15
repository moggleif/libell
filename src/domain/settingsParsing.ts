/** Reading a stored settings blob back into a valid `LevelSettings`. */
import { isAppearance } from './appearance';
import { isLengthUnit, unitToMm, type LengthUnit } from './lengths';
import { rampHeights } from './ramps';
import {
  DEFAULT_SETTINGS,
  DRAIN_POSITIONS,
  LENGTH_RANGES_MM,
  MAX_RAMP_COUNT,
  SENSOR_SOURCES,
  type DrainPosition,
  type LevelSettings,
  type SensorDeviceSettings,
  type SensorSource,
} from './settings';
import {
  heightsWithin,
  isRecord,
  numberWithin,
  positiveNumber,
  type Range,
} from './untrustedValues';

/**
 * Turn untrusted input (localStorage JSON, hand-edited or from an older
 * version) into a usable `LevelSettings`. Each field falls back to its
 * default independently, so one bad value never breaks startup. Legacy
 * values are migrated: everything once stored in cm (wheelbase, track
 * widths — including a single `trackWidthCm` for both axles — and step
 * heights) is converted to mm.
 */
export function parseSettings(
  value: unknown,
  defaultUnit: LengthUnit = DEFAULT_SETTINGS.displayUnit,
): LevelSettings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as StoredSettings;
  return {
    ...parseVehicle(raw),
    ...parseRamps(raw),
    ...parseLevelingFeel(raw),
    ...parsePreferences(raw, defaultUnit),
    // A corrupt or future-version value falls back to the phone, which
    // every install has.
    sensorSource: SENSOR_SOURCES.includes(raw.sensorSource as SensorSource)
      ? (raw.sensorSource as SensorSource)
      : DEFAULT_SETTINGS.sensorSource,
    sensorDevices: parseSensorDevices(raw),
  };
}

/** A settings blob as stored: any field may be missing, legacy or corrupt. */
type StoredSettings = Record<string, unknown>;

/** A legacy cm length as mm, or undefined when absent or unusable. */
function legacyCmAsMm(value: unknown): number | undefined {
  const cm = positiveNumber(value, NaN);
  return Number.isNaN(cm) ? undefined : unitToMm(cm, 'cm');
}

type VehicleFields = Pick<
  LevelSettings,
  'vehicleType' | 'rearAxle' | 'wheelbaseMm' | 'trackWidthFrontMm' | 'trackWidthRearMm'
>;

function parseVehicle(raw: StoredSettings): VehicleFields {
  const legacyTrackMm = legacyCmAsMm(raw.trackWidthCm);
  const { wheelbase, trackWidth } = LENGTH_RANGES_MM;
  const mmOrLegacy = (
    mmField: unknown,
    legacyMm: number | undefined,
    range: Range,
    fallback: number,
  ) => numberWithin(mmField, range, numberWithin(legacyMm, range, fallback));
  return {
    vehicleType: raw.vehicleType === 'caravan' ? 'caravan' : 'motorhome',
    rearAxle: raw.rearAxle === 'boggie' ? 'boggie' : 'single',
    wheelbaseMm: mmOrLegacy(
      raw.wheelbaseMm,
      legacyCmAsMm(raw.wheelbaseCm),
      wheelbase,
      DEFAULT_SETTINGS.wheelbaseMm,
    ),
    trackWidthFrontMm: mmOrLegacy(
      raw.trackWidthFrontMm,
      legacyCmAsMm(raw.trackWidthFrontCm) ?? legacyTrackMm,
      trackWidth,
      DEFAULT_SETTINGS.trackWidthFrontMm,
    ),
    trackWidthRearMm: mmOrLegacy(
      raw.trackWidthRearMm,
      legacyCmAsMm(raw.trackWidthRearCm) ?? legacyTrackMm,
      trackWidth,
      DEFAULT_SETTINGS.trackWidthRearMm,
    ),
  };
}

type RampFields = Pick<
  LevelSettings,
  'rampStepHeightsMm' | 'rampStepless' | 'rampCount' | 'drainPosition'
>;

function parseRamps(raw: StoredSettings): RampFields {
  // Anything stored before stepless wedges (#600) is a staircase.
  const rampStepless = raw.rampStepless === true;
  const steps = parseStepHeights(raw);
  return {
    rampStepHeightsMm: rampHeights(steps, rampStepless),
    rampStepless,
    rampCount:
      typeof raw.rampCount === 'number' && Number.isFinite(raw.rampCount) && raw.rampCount >= 1
        ? Math.min(MAX_RAMP_COUNT, Math.round(raw.rampCount))
        : DEFAULT_SETTINGS.rampCount,
    drainPosition: DRAIN_POSITIONS.includes(raw.drainPosition as DrainPosition)
      ? (raw.drainPosition as DrainPosition)
      : DEFAULT_SETTINGS.drainPosition,
  };
}

/** The newest stored format that holds any usable height wins. */
function parseStepHeights(raw: StoredSettings): number[] {
  const range = LENGTH_RANGES_MM.rampStep;
  const mm = heightsWithin(raw.rampStepHeightsMm, range);
  if (mm.length > 0) return mm;
  const cmList = Array.isArray(raw.blockHeightsCm) ? raw.blockHeightsCm : [];
  const fromCmList = heightsWithin(
    cmList.map((v: unknown) => (typeof v === 'number' ? unitToMm(v, 'cm') : v)),
    range,
  );
  if (fromCmList.length > 0) return fromCmList;
  const singleBlockMm = numberWithin(legacyCmAsMm(raw.blockHeightCm), range, NaN);
  return Number.isNaN(singleBlockMm) ? DEFAULT_SETTINGS.rampStepHeightsMm : [singleBlockMm];
}

type LevelingFeelFields = Pick<
  LevelSettings,
  'toleranceMm' | 'stabilityMm' | 'dwellRestMs' | 'dwellMotionMs'
>;

function parseLevelingFeel(raw: StoredSettings): LevelingFeelFields {
  const dwellRestMs = positiveNumber(raw.dwellRestMs, DEFAULT_SETTINGS.dwellRestMs);
  return {
    // A legacy toleranceDeg (degrees) has no unambiguous mm equivalent —
    // it falls back to the default.
    toleranceMm: numberWithin(
      raw.toleranceMm,
      LENGTH_RANGES_MM.tolerance,
      DEFAULT_SETTINGS.toleranceMm,
    ),
    stabilityMm: numberWithin(
      raw.stabilityMm,
      LENGTH_RANGES_MM.stability,
      DEFAULT_SETTINGS.stabilityMm,
    ),
    dwellRestMs,
    // Clamped against the (already-validated) rest dwell, not its own
    // default, so a corrupt/legacy value can never end up slower than rest.
    dwellMotionMs: Math.min(
      positiveNumber(raw.dwellMotionMs, DEFAULT_SETTINGS.dwellMotionMs),
      dwellRestMs,
    ),
  };
}

type PreferenceFields = Pick<
  LevelSettings,
  'displayUnit' | 'soundOnLevel' | 'soundGuidance' | 'soundSpeech' | 'theme' | 'appearance'
>;

/** `defaultUnit` is for a first run, from the phone's region (#627). */
function parsePreferences(raw: StoredSettings, defaultUnit: LengthUnit): PreferenceFields {
  return {
    displayUnit: isLengthUnit(raw.displayUnit) ? raw.displayUnit : defaultUnit,
    // Presence check, not truthiness: "never saved" falls back to the
    // default, while an explicit prior choice, true or false, is never
    // overridden.
    soundOnLevel:
      typeof raw.soundOnLevel === 'boolean' ? raw.soundOnLevel : DEFAULT_SETTINGS.soundOnLevel,
    soundGuidance: raw.soundGuidance === true,
    soundSpeech: raw.soundSpeech === true,
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
    appearance: isAppearance(raw.appearance) ? raw.appearance : DEFAULT_SETTINGS.appearance,
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
