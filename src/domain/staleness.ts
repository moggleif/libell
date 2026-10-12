/**
 * Sensor staleness.
 *
 * R25's stillness detector needs new samples to compute anything, so it cannot
 * notice the sensor going fully silent: a BLE connection whose notifications
 * quietly stop while the GATT link stays "connected", or a backgrounded tab
 * whose `devicemotion` events are throttled away. Without this, the last
 * good reading would stay on screen looking as live as a fresh one.
 *
 * A distinct safety state — neither R17's wrong-pose overlay nor R25's
 * "Measuring…":
 * there is no trustworthy data at all, so wheel/ramp guidance is hidden
 * rather than left frozen.
 *
 * Only the phone's timeout lives here; every external source declares its
 * own (ADR 0016), since how long a silence is suspicious depends on the
 * adapter's cadence — a notify stream and a poll loop differ.
 */

/**
 * `devicemotion`/`deviceorientation` fire tens of times a second once
 * granted. Long enough that a dropped frame or GC pause never trips it; short
 * enough that a stalled sensor is caught before stale data could pass for
 * live guidance.
 */
export const STALE_TIMEOUT_PHONE_MS = 2000;

/** Also true when no sample has ever arrived (`null`). */
export function isSensorStale(
  lastSampleAtMs: number | null,
  nowMs: number,
  timeoutMs: number,
): boolean {
  return lastSampleAtMs === null || nowMs - lastSampleAtMs > timeoutMs;
}
