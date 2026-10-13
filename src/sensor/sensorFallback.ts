/**
 * External-sensor fallback and retry policy. Per ADR 0014, never silently
 * switch source: phone and box have independent calibration references, so
 * an automatic switch could show a plausible-looking but wrong reading.
 * Reconnecting the *same* known box carries no such ambiguity, so that is
 * retried automatically (`main.ts` drives the loop through the same
 * `Box.reconnect()` the manual Retry button uses); this module
 * owns only the pure "is it time yet" check.
 */
import type { SensorState } from './orientation';

/**
 * True only for an external connection that cannot be reached right now.
 * Never true for the phone sensor, which has no lost-connection state, nor
 * merely for "no reading yet" while still connecting.
 */
export function isSensorUnavailable(state: SensorState): boolean {
  return state === 'disconnected';
}

/**
 * How often the background loop retries a lost external source. Cheap: an
 * adapter's `reconnect()` is a lookup plus a connect, never a fresh scan.
 * Shared rather than per-source; what is genuinely per-source — how long a
 * silence means trouble — is the descriptor's `staleTimeoutMs`.
 */
export const EXTERNAL_SENSOR_AUTO_RETRY_INTERVAL_MS = 5000;

/**
 * True when an automatic retry is due: immediately if none has been
 * attempted yet (`null`), else once the interval has passed. Time is a
 * parameter so this is testable without real timers.
 */
export function isBoxAutoRetryDue(lastAttemptAtMs: number | null, nowMs: number): boolean {
  return (
    lastAttemptAtMs === null || nowMs - lastAttemptAtMs >= EXTERNAL_SENSOR_AUTO_RETRY_INTERVAL_MS
  );
}
