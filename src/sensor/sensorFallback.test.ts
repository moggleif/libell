import { describe, expect, it } from 'vitest';
import {
  EASYLEVEL_AUTO_RETRY_INTERVAL_MS,
  isEasyLevelAutoRetryDue,
  isSensorUnavailable,
} from './sensorFallback';
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

  it("stays unavailable across a failed Retry — resolving that is #211's automatic loop's job, not this pure check's", () => {
    // unavailable -> retry fails (state is still 'disconnected') -> still unavailable.
    expect(isSensorUnavailable('disconnected')).toBe(true);
    expect(isSensorUnavailable('disconnected')).toBe(true);
  });
});

describe('isEasyLevelAutoRetryDue (#211)', () => {
  it('is due immediately when no attempt has ever been made', () => {
    expect(isEasyLevelAutoRetryDue(null, 0)).toBe(true);
  });

  it('is not due before the interval has passed since the last attempt', () => {
    expect(isEasyLevelAutoRetryDue(1000, 1000 + EASYLEVEL_AUTO_RETRY_INTERVAL_MS - 1)).toBe(false);
  });

  it('is due exactly at the interval boundary, and past it', () => {
    expect(isEasyLevelAutoRetryDue(1000, 1000 + EASYLEVEL_AUTO_RETRY_INTERVAL_MS)).toBe(true);
    expect(isEasyLevelAutoRetryDue(1000, 1000 + EASYLEVEL_AUTO_RETRY_INTERVAL_MS + 5000)).toBe(
      true,
    );
  });
});
