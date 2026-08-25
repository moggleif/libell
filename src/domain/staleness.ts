/**
 * Sensor staleness (#132) — pure TypeScript, no browser APIs.
 *
 * R25's stillness detector (`stillness.ts`) needs new samples to arrive
 * before it can compute anything — it has no way to notice the sensor
 * going fully silent (no new events at all). That gap is dangerous: a BLE
 * connection whose notifications quietly stop while the GATT link stays
 * "connected", a backgrounded tab whose `devicemotion` events are throttled
 * away, or any other stall would otherwise leave the last good reading on
 * screen looking exactly as live as a fresh one.
 *
 * This is the third, distinct safety state — never R17's "wrong phone
 * pose" overlay, never R25's "Measuring…" — there is no trustworthy data
 * at all, so the actionable wheel/ramp guidance must be hidden rather than
 * left frozen mid-display.
 *
 * One pure function, shared by every `OrientationSensor` implementation
 * (the phone sensor and the EasyLevel BLE box alike) instead of two
 * bespoke timers: given the timestamp of the last real sample and the
 * current time, has too long passed with nothing new? Time is always a
 * parameter, never read from the wall clock in here, so this is fully
 * unit-testable without real timers — the same discipline `stability.ts`'s
 * dwell windows and `stillness.ts`'s calm window already follow.
 */

/**
 * Phone sensor timeout: `devicemotion`/`deviceorientation` fire
 * continuously (tens of times a second) once granted, so a real stall is
 * visible almost immediately. Long enough that a single dropped frame, a
 * GC pause, or ordinary jitter can never falsely trip it; short enough
 * that a genuinely stalled sensor (backgrounded tab, OS-level throttling)
 * is caught well before stale data could be mistaken for live guidance.
 */
export const STALE_TIMEOUT_PHONE_MS = 2000;

/**
 * EasyLevel BLE box timeout: notifications are event-driven, not a fixed
 * clock — a connection-interval hiccup or a slow packet can legitimately
 * create a larger gap than a dropped animation frame ever would. Set
 * generously above the phone timeout so that natural BLE jitter never
 * false-triggers, while still catching a box whose notifications have
 * stopped (GATT technically still open) well within a few seconds.
 */
export const STALE_TIMEOUT_EASYLEVEL_MS = 4000;

/**
 * True once more than `timeoutMs` has passed since `lastSampleAtMs` —
 * or immediately when no sample has ever arrived (`null`). Recovery is
 * automatic: the moment a fresh sample updates `lastSampleAtMs`, the very
 * next call with that new timestamp reports "not stale" again — there is
 * no separate state to clear.
 */
export function isSensorStale(
  lastSampleAtMs: number | null,
  nowMs: number,
  timeoutMs: number,
): boolean {
  return lastSampleAtMs === null || nowMs - lastSampleAtMs > timeoutMs;
}
