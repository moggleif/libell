import { describe, expect, it } from 'vitest';
import type { SensorSource } from '../domain/settings';
import { STALE_TIMEOUT_PHONE_MS } from '../domain/staleness';
import { boxById } from '../sensor/boxes';
import { isActiveSensorStale } from './sensorStaleness';

function sensor(source: SensorSource, lastSampleAt: number | null) {
  return { getSource: () => source, getLastSampleAt: () => lastSampleAt };
}

describe('isActiveSensorStale (R35, #401)', () => {
  it("judges the phone by the phone's own timeout", () => {
    expect(isActiveSensorStale(sensor('phone', 0), STALE_TIMEOUT_PHONE_MS)).toBe(false);
    expect(isActiveSensorStale(sensor('phone', 0), STALE_TIMEOUT_PHONE_MS + 1)).toBe(true);
  });

  it("judges a box by its own descriptor's timeout", () => {
    const timeoutMs = boxById('xparkle')!.staleTimeoutMs;
    expect(isActiveSensorStale(sensor('xparkle', 0), timeoutMs)).toBe(false);
    expect(isActiveSensorStale(sensor('xparkle', 0), timeoutMs + 1)).toBe(true);
  });

  it('counts a source that has never sent a sample as stale', () => {
    expect(isActiveSensorStale(sensor('easylevel', null), 0)).toBe(true);
  });
});
