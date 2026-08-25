import { describe, expect, it } from 'vitest';
import { isSensorStale, STALE_TIMEOUT_EASYLEVEL_MS, STALE_TIMEOUT_PHONE_MS } from './staleness';

describe('isSensorStale (#132)', () => {
  it('is stale when no sample has ever arrived, regardless of the timeout', () => {
    expect(isSensorStale(null, 0, STALE_TIMEOUT_PHONE_MS)).toBe(true);
    expect(isSensorStale(null, 100000, STALE_TIMEOUT_EASYLEVEL_MS)).toBe(true);
  });

  it('is not stale right after a sample, nor while comfortably within the timeout', () => {
    expect(isSensorStale(1000, 1000, STALE_TIMEOUT_PHONE_MS)).toBe(false);
    expect(isSensorStale(1000, 1000 + STALE_TIMEOUT_PHONE_MS - 1, STALE_TIMEOUT_PHONE_MS)).toBe(
      false,
    );
  });

  it('is not stale exactly at the timeout boundary — only once it is clearly exceeded', () => {
    expect(isSensorStale(1000, 1000 + STALE_TIMEOUT_PHONE_MS, STALE_TIMEOUT_PHONE_MS)).toBe(false);
    expect(isSensorStale(1000, 1000 + STALE_TIMEOUT_PHONE_MS + 1, STALE_TIMEOUT_PHONE_MS)).toBe(
      true,
    );
  });

  it('a single dropped sample never false-triggers the phone timeout', () => {
    // ~60Hz sensor: a dropped frame is ~16ms, nowhere near the 2s timeout.
    expect(isSensorStale(1000, 1000 + 16, STALE_TIMEOUT_PHONE_MS)).toBe(false);
  });

  it('a single slow BLE notification gap never false-triggers the EasyLevel timeout', () => {
    expect(isSensorStale(1000, 1000 + 500, STALE_TIMEOUT_EASYLEVEL_MS)).toBe(false);
  });

  it('recovers automatically the instant a fresh sample updates the timestamp — no separate reset needed', () => {
    const timeoutMs = STALE_TIMEOUT_PHONE_MS;
    let lastSampleAtMs: number | null = 0;
    expect(isSensorStale(lastSampleAtMs, timeoutMs + 5000, timeoutMs)).toBe(true);
    // A fresh sample arrives...
    lastSampleAtMs = timeoutMs + 5000;
    // ...and the very next check, at the same instant, is trustworthy again.
    expect(isSensorStale(lastSampleAtMs, timeoutMs + 5000, timeoutMs)).toBe(false);
  });

  it('the EasyLevel timeout is more generous than the phone timeout, per their different natural gap sizes', () => {
    expect(STALE_TIMEOUT_EASYLEVEL_MS).toBeGreaterThan(STALE_TIMEOUT_PHONE_MS);
  });
});
