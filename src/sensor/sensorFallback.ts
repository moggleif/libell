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
