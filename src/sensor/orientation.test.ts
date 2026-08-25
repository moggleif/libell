import { describe, expect, it } from 'vitest';
import { computeLeveling } from '../domain/leveling';
import { DEFAULT_SETTINGS, type SensorSource } from '../domain/settings';
import { createOrientationSensor, type OrientationSensor } from './orientation';

/**
 * A minimal stand-in for a not-yet-built second `OrientationSensor`
 * implementation (#116, #119) — enough to prove the seam #128 formalizes:
 * the domain leveling output only depends on the `GravityVector` shape,
 * never on which adapter (or which `getSource()`) produced it.
 */
function fixedAdapter(
  source: SensorSource,
  gravity: { x: number; y: number; z: number },
): OrientationSensor {
  return {
    start: () => Promise.resolve('granted'),
    getState: () => 'granted',
    getGravity: () => gravity,
    getSource: () => source,
  };
}

describe('OrientationSensor as a multi-source seam (#128)', () => {
  it('produces the same domain leveling output for equivalent gravity vectors regardless of adapter/source', () => {
    const gravity = { x: 1.2, y: -0.4, z: 9.7 };
    const phoneLike = fixedAdapter('phone', gravity);
    // Stands in for a hypothetical second source (#116/#119) — same
    // GravityVector, different reported source.
    const otherLike = fixedAdapter('phone', { ...gravity });

    const a = computeLeveling(phoneLike.getGravity()!, DEFAULT_SETTINGS, null);
    const b = computeLeveling(otherLike.getGravity()!, DEFAULT_SETTINGS, null);

    expect(a).toEqual(b);
    expect(phoneLike.getSource()).toBe(otherLike.getSource());
  });

  it('the real phone sensor implements the full OrientationSensor contract, including getSource()', () => {
    const sensor = createOrientationSensor();
    expect(sensor.getSource()).toBe('phone');
    expect(sensor.getState()).toBe('idle');
    expect(sensor.getGravity()).toBeNull();
  });
});
