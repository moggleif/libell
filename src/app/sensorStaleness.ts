/**
 * Whether the active source's data is too old to trust (R35): the phone
 * by its own timeout, a box by its descriptor's (ADR 0016). Shared by the
 * level screen's stale overlay and the top-bar icon (R32), so the two never
 * disagree.
 */
import { isSensorStale, STALE_TIMEOUT_PHONE_MS } from '../domain/staleness';
import { externalSensorById } from '../sensor/externalSensors';
import type { OrientationSensor } from '../sensor/orientation';

export function isActiveSensorStale(
  sensor: Pick<OrientationSensor, 'getSource' | 'getLastSampleAt'>,
  nowMs: number,
): boolean {
  const timeoutMs = externalSensorById(sensor.getSource())?.staleTimeoutMs;
  return isSensorStale(sensor.getLastSampleAt(), nowMs, timeoutMs ?? STALE_TIMEOUT_PHONE_MS);
}
