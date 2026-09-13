/**
 * The registry of external sensor sources (#262, ADR 0016).
 *
 * ADR 0014 formalized `OrientationSensor` as the seam every gravity source
 * implements and added `SensorSource` so a lost external source could be
 * named rather than silently substituted. What it deliberately left open —
 * "no second source exists yet to design the concrete shape against" — was
 * what a source *is* to the code above the seam. #116/#130/#131, being the
 * only consumer, answered that the cheapest way available: `'easylevel'`
 * was a bare string that `main.ts`, the UI, the stores and the strings each
 * interpreted in their own way, and "is an external sensor available here"
 * was spelled `isEasyLevelAvailable()` at every call site.
 *
 * This module is that answer, generalized: one **descriptor** per source,
 * owned by `sensor/`, carrying everything the shell needs to route and
 * render a source without branching on a string literal.
 *
 * It is deliberately **data, not behavior**. Connecting, retrying,
 * reconnecting and calibrating belong to the controller (#265); building
 * packets belongs to each protocol module. A descriptor answers "what is
 * this thing, can it work here, and what can it tell me" — nothing else.
 * Keeping it that way is what stops it from drifting into a plugin system.
 *
 * `domain/` is untouched by all of this (ADR 0002): it still owns the
 * `SensorSource` union as the persisted enum, and still never learns which
 * sources exist or what they can do.
 */
import type { SensorSource } from '../domain/settings';
import { EASYLEVEL_DESCRIPTOR } from './easyLevelSensor';

/**
 * What a source can actually tell the user about itself, so its page can
 * render the rows it has rather than rows that permanently read "not
 * available yet" — the mistake #228 had to undo when the signal-strength
 * row turned out to be unfillable on every browser.
 *
 * Every flag is about a *row or control on the device page*, which is why
 * this is a closed, concrete list rather than an open capability bag: it
 * exists to decide what to draw.
 */
export interface ExternalSensorCapabilities {
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
}

/**
 * One external sensor source, as everything above the seam sees it.
 *
 * `id` doubles as the storage key segment (#263) and the per-device
 * settings key (#264) — one identifier, so a source cannot be filed under
 * one name and rendered under another.
 */
export interface ExternalSensorDescriptor {
  id: SensorSource;
  /**
   * The product name, shown to the user. Deliberately **not** translated:
   * it is a brand, identical in every language, and a translated brand is
   * a bug. The surrounding sentence is what gets translated, with this
   * substituted into it (#267).
   */
  displayName: string;
  /**
   * Whether this source can work in this browser at all, right now —
   * a real transport, or a simulator flag standing in for one. False on
   * Safari/iOS with no flag, which is what keeps a permanently broken
   * option off the screen (#116's own acceptance criterion).
   *
   * A function rather than a boolean because it depends on the runtime
   * environment and on query flags, both of which are read at call time.
   */
  isAvailable(): boolean;
  capabilities: ExternalSensorCapabilities;
  /**
   * How long a silence from this source means its readings can no longer
   * be trusted (#266, R35) — fed to `domain/staleness.ts`'s `isSensorStale`
   * as its `timeoutMs`.
   *
   * A property of this adapter's own cadence, which is why it lives here
   * rather than in the pure domain layer: a notify-driven stream and a
   * poll loop have completely different natural gaps, and only the adapter
   * knows which it is. Set generously enough above that cadence that
   * ordinary jitter never false-triggers, and tightly enough that stale
   * data is never mistaken for live guidance.
   */
  staleTimeoutMs: number;
}

/**
 * Every external source this build knows about, in the order they should
 * be offered. The phone's own sensor is not here: it is not external, is
 * always the fallback, and has no page of its own.
 */
export const EXTERNAL_SENSORS: readonly ExternalSensorDescriptor[] = [EASYLEVEL_DESCRIPTOR];

/** Those that could actually work in this browser right now. */
export function availableExternalSensors(): ExternalSensorDescriptor[] {
  return EXTERNAL_SENSORS.filter((sensor) => sensor.isAvailable());
}

/**
 * True when at least one external source is usable here — the one gate
 * every "should the external-sensor UI exist at all" decision goes
 * through, replacing the device-specific `isEasyLevelAvailable()` checks
 * that used to stand in for it.
 */
export function hasAvailableExternalSensor(): boolean {
  return EXTERNAL_SENSORS.some((sensor) => sensor.isAvailable());
}

/**
 * Look a source up by its stored id. Returns null for `'phone'` and for a
 * source id this build does not know — a stored settings value written by
 * a newer build, which `parseSettings` already tolerates and which must
 * not become a crash here either.
 */
export function externalSensorById(id: SensorSource): ExternalSensorDescriptor | null {
  return EXTERNAL_SENSORS.find((sensor) => sensor.id === id) ?? null;
}

/**
 * What a source can report about its own health, in a shape no protocol
 * owns (#268). Each adapter fills in what it has; a field left null is
 * "nothing has arrived yet", and a capability left false in the
 * descriptor means the row is never drawn at all.
 *
 * This exists so the UI never imports a device's protocol module: before
 * #268, `sensorSourceSection.ts` took EasyLevel's own
 * battery/temperature/firmware-tier struct, which a box shaped differently
 * could not fill.
 */
export interface ExternalSensorHealth {
  /** Whole percent, or null before anything has been reported. */
  batteryPercent: number | null;
  temperatureCelsius: number | null;
  /** Whatever this device calls its firmware — a tier, a version string. */
  firmwareLabel: string | null;
}

/**
 * Low-battery warning threshold + hysteresis band (#123; source-neutral
 * since #268 — any box with a battery gets the same treatment) — a plain
 * two-state flag, not a full dead-band/dwell stabilizer: this feeds a
 * single indicator on the device page, not a continuously-redrawn live
 * value like `domain/stability.ts`'s wheel readouts, so a simple sustain
 * band is enough to keep it from flickering right at the threshold.
 * Enters the "low" state below `LOW_BATTERY_PERCENT`, and only leaves it
 * once back above `LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT`.
 */
export const LOW_BATTERY_PERCENT = 20;
export const LOW_BATTERY_HYSTERESIS_PERCENT = 3;

export function isLowBattery(batteryPercent: number, wasLow: boolean): boolean {
  return wasLow
    ? batteryPercent < LOW_BATTERY_PERCENT + LOW_BATTERY_HYSTERESIS_PERCENT
    : batteryPercent < LOW_BATTERY_PERCENT;
}
