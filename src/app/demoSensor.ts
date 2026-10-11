/**
 * The fixed synthetic tilt for `?demo` and the screenshots: a stand-in for
 * the phone sensor that works on any machine.
 */
import type { OrientationSensor } from '../sensor/orientation';

/** The demo's tilt, in degrees. */
export const DEMO_TILT_DEG = { roll: -1.2, pitch: -0.35 } as const;

const rad = (deg: number) => (deg * Math.PI) / 180;

export function createDemoSensor(): OrientationSensor {
  const gravity = {
    x: 9.81 * Math.tan(rad(DEMO_TILT_DEG.roll)),
    y: 9.81 * Math.tan(rad(DEMO_TILT_DEG.pitch)),
    z: 9.81,
  };
  return {
    start: () => Promise.resolve('granted' as const),
    getState: () => 'granted' as const,
    getGravity: () => gravity,
    // It speaks for the phone sensor it replaces (#128).
    getSource: () => 'phone' as const,
    // Always "just sampled" (#132): demo mode and the screenshots never
    // show the stale-data overlay.
    getLastSampleAt: () => performance.now(),
  };
}
