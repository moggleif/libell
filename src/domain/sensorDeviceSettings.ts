/**
 * The typed view of each external sensor's entry in
 * `LevelSettings.sensorDevices` (ADR 0016): validated on every read, so a
 * missing or corrupt entry yields defaults per field.
 */
import { parseAxisMapping, type AxisMapping } from './axisMapping';
import {
  DEFAULT_EASYLEVEL_SETTINGS,
  DEFAULT_XPARKLE_SETTINGS,
  type LevelSettings,
} from './settings';
import { isRecord, nonNegativeNumber } from './untrustedValues';

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

/** Long enough for any plausible settle-time experiment, short enough that a
 * mistyped value can't effectively hang every connect attempt. */
export const MAX_EASYLEVEL_CONNECT_DELAY_MS = 5000;

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

function isXparklePassword(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}$/.test(value);
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
