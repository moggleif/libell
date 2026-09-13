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
 * instead of a bespoke timer each: given the timestamp of the last real
 * sample and the current time, has too long passed with nothing new? Time
 * is always a parameter, never read from the wall clock in here, so this
 * is fully unit-testable without real timers — the same discipline
 * `stability.ts`'s dwell windows and `stillness.ts`'s calm window already
 * follow.
 *
 * The phone's own timeout lives here because the phone sensor is not an
 * external source and has no descriptor. Every external source declares
 * its own instead (#266, ADR 0016): how long a silence is suspicious is a
 * property of that adapter's cadence — a notify stream and a poll loop
 * are not the same thing — and enumerating devices in the pure domain
 * layer was the wrong place to keep that knowledge.
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
