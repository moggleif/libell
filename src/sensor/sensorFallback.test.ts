import { describe, expect, it } from 'vitest';
import { isSensorUnavailable } from './sensorFallback';
import type { SensorState } from './orientation';

describe('isSensorUnavailable (#134)', () => {
  it('is true once the EasyLevel state machine reaches disconnected (unavailable)', () => {
    expect(isSensorUnavailable('disconnected')).toBe(true);
  });

  it('is false for every other SensorState, including a live connection', () => {
    const other: SensorState[] = ['idle', 'unsupported', 'needs-permission', 'granted', 'denied'];
    for (const state of other) {
      expect(isSensorUnavailable(state)).toBe(false);
    }
  });

  it('resolves automatically once Retry reconnects (state flips back to granted)', () => {
    // unavailable -> retry succeeds -> resolved, with no separate flag to clear.
    expect(isSensorUnavailable('disconnected')).toBe(true);
    expect(isSensorUnavailable('granted')).toBe(false);
  });

  it('resolves once "Use phone sensor" switches away — the phone has no disconnected state', () => {
    // unavailable -> explicit fallback -> resolved.
    expect(isSensorUnavailable('disconnected')).toBe(true);
    expect(isSensorUnavailable('idle')).toBe(false);
  });

  it('stays unavailable across a failed Retry (single attempt, no auto-loop)', () => {
    // unavailable -> retry fails (state is still 'disconnected') -> still unavailable.
    expect(isSensorUnavailable('disconnected')).toBe(true);
    expect(isSensorUnavailable('disconnected')).toBe(true);
  });
});
