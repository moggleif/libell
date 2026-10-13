/**
 * The registry of external sensor sources (ADR 0016): one descriptor per
 * source, carrying everything the shell needs to route and render it
 * without branching on a string literal.
 *
 * Deliberately **data, not behavior**: connecting, retrying and
 * calibrating belong to the controller, building packets to each protocol
 * module. That is what stops this from drifting into a plugin system.
 * `domain/` still owns `SensorSource` as the persisted enum and never
 * learns which sources exist (ADR 0002).
 */
import type { SensorSource } from '../domain/settings';
import { EASYLEVEL_DESCRIPTOR } from './easyLevelSensor';
import { XPARKLE_DESCRIPTOR } from './xparkleSensor';

/**
 * What a source can tell the user about itself, so its page draws only the
 * rows it can fill rather than rows that permanently read "not available".
 * Every flag is a row or control on the device page — a closed, concrete
 * list rather than an open capability bag.
 */
export interface BoxCapabilities {
  /** Reports a battery level, and can therefore warn when it is low. */
  battery: boolean;
  /** Reports its own temperature. */
  temperature: boolean;
  /** Reports a firmware version or tier worth showing. */
  firmwareVersion: boolean;
  /** Has a mounting orientation the user picks in Libell (R43). */
  mounting: boolean;
  /** Supports an installation offset captured in Libell (R34). */
  installCalibration: boolean;
  /** Has raw protocol bytes worth exposing behind the debug disclosure. */
  debugBytes: boolean;
  /** Reports the mounting orientation it stores itself, shown read-only
   * (R49) — as opposed to `mounting`, which the user picks here. */
  reportedOrientation: boolean;
  /** Its mounting can be learned in Libell by lifting the vehicle. */
  learnMounting: boolean;
  /** Must be mounted standing upright, not lying flat — what the pose
   * overlay tells the user when it reads far off level. */
  upright: boolean;
  /** Zeroes itself on command and keeps that zero, so Libell has no zero
   * of its own to forget. */
  zeroesItself: boolean;
}

/** A mounting orientation a box stores and reports itself (R49). */
export type ReportedOrientation = 'front' | 'rear' | 'left' | 'right';

/**
 * One external sensor source, as everything above the seam sees it.
 *
 * `id` doubles as the storage key segment and the per-device settings key,
 * so a source cannot be filed under one name and rendered under another.
 */
export interface BoxDescriptor {
  id: SensorSource;
  /**
   * The product name. Deliberately **not** translated: a brand is
   * identical in every language; the surrounding sentence is translated.
   */
  displayName: string;
  /**
   * Whether this source can work in this browser right now — a real
   * transport, or a simulator flag standing in for one. False on
   * Safari/iOS with no flag, keeping a permanently broken option off the
   * screen. A function because the environment and query flags are read
   * at call time.
   */
  isAvailable(): boolean;
  capabilities: BoxCapabilities;
  /**
   * How long a silence from this source means its readings can no longer
   * be trusted (R35) — `isSensorStale`'s `timeoutMs`. Lives here because it
   * follows the adapter's own cadence (a notify stream and a poll loop have
   * very different natural gaps): far enough above it that jitter never
   * false-triggers, tight enough that stale data never passes as live.
   */
  staleTimeoutMs: number;
}

/**
 * Every external source this build knows about, in the order they should
 * be offered. The phone's own sensor is not here: it is not external, is
 * always the fallback, and has no page of its own.
 */
export const EXTERNAL_SENSORS: readonly BoxDescriptor[] = [
  EASYLEVEL_DESCRIPTOR,
  XPARKLE_DESCRIPTOR,
];

/** Those that could actually work in this browser right now. */
export function availableBoxes(): BoxDescriptor[] {
  return EXTERNAL_SENSORS.filter((sensor) => sensor.isAvailable());
}

/**
 * True when at least one external source is usable here — the one gate
 * for whether the external-sensor UI exists at all.
 */
export function hasAvailableBox(): boolean {
  return EXTERNAL_SENSORS.some((sensor) => sensor.isAvailable());
}

/**
 * Look a source up by its stored id. Returns null for `'phone'` and for an
 * id this build does not know (a setting written by a newer build), which
 * must not crash.
 */
export function boxById(id: SensorSource): BoxDescriptor | null {
  return EXTERNAL_SENSORS.find((sensor) => sensor.id === id) ?? null;
}

/**
 * What a source can report about its own health, in a shape no protocol
 * owns, so the UI never imports a device's protocol module. A null field
 * is "nothing has arrived yet"; a capability left false in the descriptor
 * means the row is never drawn.
 */
export interface BoxHealth {
  /** Whole percent, or null before anything has been reported. */
  batteryPercent: number | null;
  temperatureCelsius: number | null;
  /** Whatever this device calls its firmware — a tier, a version string. */
  firmwareLabel: string | null;
  /** The orientation the box reports it is mounted in, or null before it
   * has said. Omitted by a box that has none to report. */
  reportedOrientation?: ReportedOrientation | null;
}

/**
 * Low-battery threshold plus a hysteresis band, so the single indicator
 * does not flicker at the threshold. Enters "low" below
 * `LOW_BATTERY_PERCENT` and leaves it only once back above
 * `LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT`.
 */
export const LOW_BATTERY_PERCENT = 20;
export const LOW_BATTERY_HYSTERESIS_PERCENT = 3;

export function isLowBattery(batteryPercent: number, wasLow: boolean): boolean {
  return wasLow
    ? batteryPercent < LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT
    : batteryPercent < LOW_BATTERY_PERCENT;
}
