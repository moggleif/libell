/**
 * External-sensor fallback prompt state (#134) — the interactive
 * Retry / "Use phone sensor" recovery UX layered on top of #116/#130's
 * existing 'disconnected' `SensorState`, per ADR 0014's "never silently
 * switch source" rule (different sources have different calibration
 * references; an automatic switch could show a plausible-looking but
 * wrong reading).
 *
 * A pure, one-line derivation, not a second state machine of its own:
 * `easyLevelSensor.ts`'s own `SensorState` already reaches 'disconnected'
 * for every "can't reach it right now" case this issue cares about — a
 * live GATT drop, a failed silent reconnect at startup (#130), or a
 * failed manual Retry — so there is nothing new to track here beyond
 * naming that one state for the UI. Recovery is automatic the same way
 * `domain/staleness.ts`'s is (see that file's doc comment): the moment
 * `state` moves off 'disconnected' — a successful Retry reaching
 * 'granted', or the user's explicit "Use phone sensor" switch (which
 * moves the active source off EasyLevel entirely) — the very next call
 * reports false again; there is no separate flag for `main.ts` to clear
 * itself.
 *
 * `EASYLEVEL_AUTO_RETRY_INTERVAL_MS`/`isEasyLevelAutoRetryDue` (#211)
 * revise #134's original "one tap, one attempt, no retry loop" choice —
 * that rule was about never *switching source* automatically (ADR 0014:
 * phone vs. EasyLevel have independent calibration references, so an
 * unannounced switch could show a plausible-looking but wrong reading),
 * not about reconnecting the *same already-known box*, which has no such
 * ambiguity. Requiring a manual tap to recover from a routine BLE hiccup
 * assumes a user comfortable enough with app UI conventions to notice the
 * prompt and know what "Retry" means — not a safe assumption for this
 * app's actual users. `main.ts` drives the loop (calling the exact same
 * `EasyLevelSensor.reconnect()` the manual button already uses, never a
 * second implementation); this module only owns the pure "is it time to
 * try again yet" check, the same time-as-parameter discipline
 * `domain/staleness.ts`'s `isSensorStale` already follows. The manual
 * "Retry" button is unchanged by this — still one tap, one immediate
 * attempt — it is simply no longer the only way to retry.
 */
import type { SensorState } from './orientation';

/**
 * True only for an EasyLevel connection that cannot be reached right now.
 * Never true for the phone sensor — it has no equivalent lost-connection
 * state (see `orientation.ts`'s `SensorState` doc comment) — and never
 * true merely for "no reading yet" while still connecting or before the
 * first sample arrives.
 */
export function isSensorUnavailable(state: SensorState): boolean {
  return state === 'disconnected';
}

/**
 * How often the background loop retries a reachable-but-lost EasyLevel box
 * (#211). Cheap by construction: `reconnect()` is a `getDevices()` lookup
 * plus a GATT connect, never a fresh BLE scan, so a short interval costs
 * nothing worth guarding against — short enough that a box coming back
 * into range or being powered back on resolves within a few seconds, not
 * "whenever someone notices and taps Retry."
 */
export const EASYLEVEL_AUTO_RETRY_INTERVAL_MS = 5000;

/**
 * True the moment an automatic retry is due: immediately when none has
 * ever been attempted yet (`null`), or once
 * `EASYLEVEL_AUTO_RETRY_INTERVAL_MS` has passed since the last one. Time is
 * always a parameter, never read from the wall clock here — the same
 * discipline `domain/staleness.ts`'s `isSensorStale` follows — so this is
 * fully unit-testable without real timers.
 */
export function isEasyLevelAutoRetryDue(lastAttemptAtMs: number | null, nowMs: number): boolean {
  return lastAttemptAtMs === null || nowMs - lastAttemptAtMs >= EASYLEVEL_AUTO_RETRY_INTERVAL_MS;
}
