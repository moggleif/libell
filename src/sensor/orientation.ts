/**
 * Tilt sensing (issue #2 / R2).
 *
 * Prefers `DeviceMotionEvent.accelerationIncludingGravity` — the direct web
 * equivalent of Android's TYPE_GRAVITY — and falls back to
 * `DeviceOrientationEvent` (beta = front/back, gamma = side/side), converted
 * back into an equivalent gravity vector so downstream code has one input
 * shape. Readings are smoothed with an exponential moving average.
 *
 * iOS 13+ hands out motion data only after `requestPermission()` from a
 * user gesture; `start()` must therefore be called from a tap handler
 * where that API exists (`needsPermissionGesture()` tells the UI).
 */
import type { GravityVector } from '../domain/leveling';

export type SensorState = 'idle' | 'unsupported' | 'needs-permission' | 'granted' | 'denied';

type PermissionRequester = { requestPermission?: () => Promise<'granted' | 'denied'> };

/** Smoothing factor for the EMA: higher = snappier, lower = calmer. */
const SMOOTHING_ALPHA = 0.15;

/** If devicemotion delivers no usable gravity within this time, fall back. */
const MOTION_TIMEOUT_MS = 1500;

const DEG_TO_RAD = Math.PI / 180;

export interface OrientationSensor {
  /** Ask for access and start listening. Resolves to the resulting state. */
  start(): Promise<SensorState>;
  getState(): SensorState;
  /** Latest smoothed gravity vector, or null before the first reading. */
  getGravity(): GravityVector | null;
}

/** True when the platform (iOS 13+) requires a user tap before motion data. */
export function needsPermissionGesture(): boolean {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as unknown as PermissionRequester).requestPermission === 'function'
  );
}

export function isSensorSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    (typeof DeviceMotionEvent !== 'undefined' || typeof DeviceOrientationEvent !== 'undefined')
  );
}

/**
 * Normalize platform sign conventions: with the phone flat on its back the
 * spec says gz = +9.81, but iOS reports the vector negated. Flipping when
 * gz < 0 restores one convention for the face-up phone this app assumes.
 */
function normalizeGravity(x: number, y: number, z: number): GravityVector {
  return z < 0 ? { x: -x, y: -y, z: -z } : { x, y, z };
}

/** Convert DeviceOrientation angles into an equivalent gravity vector. */
function gravityFromOrientation(betaDeg: number, gammaDeg: number): GravityVector {
  const beta = betaDeg * DEG_TO_RAD;
  const gamma = gammaDeg * DEG_TO_RAD;
  const g = 9.81;
  return {
    x: -g * Math.sin(gamma) * Math.cos(beta),
    y: g * Math.sin(beta),
    z: g * Math.cos(gamma) * Math.cos(beta),
  };
}

export function createOrientationSensor(): OrientationSensor {
  let state: SensorState = 'idle';
  let smoothed: GravityVector | null = null;
  let usingMotion = false;

  function accept(reading: GravityVector): void {
    smoothed =
      smoothed === null
        ? reading
        : {
            x: smoothed.x + SMOOTHING_ALPHA * (reading.x - smoothed.x),
            y: smoothed.y + SMOOTHING_ALPHA * (reading.y - smoothed.y),
            z: smoothed.z + SMOOTHING_ALPHA * (reading.z - smoothed.z),
          };
  }

  function onMotion(event: DeviceMotionEvent): void {
    const g = event.accelerationIncludingGravity;
    if (g && g.x !== null && g.y !== null && g.z !== null) {
      usingMotion = true;
      accept(normalizeGravity(g.x, g.y, g.z));
    }
  }

  function onOrientation(event: DeviceOrientationEvent): void {
    // Motion data wins when both fire; orientation is only the fallback.
    if (!usingMotion && event.beta !== null && event.gamma !== null) {
      accept(gravityFromOrientation(event.beta, event.gamma));
    }
  }

  async function requestPermissions(): Promise<'granted' | 'denied'> {
    if (!needsPermissionGesture()) return 'granted';
    try {
      const motion = await (
        DeviceMotionEvent as unknown as Required<PermissionRequester>
      ).requestPermission();
      // DeviceOrientation has its own gate on iOS; best-effort so the
      // fallback path works too, but the motion verdict decides.
      const orientationApi = DeviceOrientationEvent as unknown as PermissionRequester;
      if (typeof orientationApi.requestPermission === 'function') {
        await orientationApi.requestPermission().catch(() => 'denied');
      }
      return motion;
    } catch {
      return 'denied';
    }
  }

  return {
    async start(): Promise<SensorState> {
      if (state === 'granted') return state;
      if (!isSensorSupported()) {
        state = 'unsupported';
        return state;
      }
      const permission = await requestPermissions();
      if (permission === 'denied') {
        state = 'denied';
        return state;
      }
      if (typeof DeviceMotionEvent !== 'undefined') {
        window.addEventListener('devicemotion', onMotion);
      }
      if (typeof DeviceOrientationEvent !== 'undefined') {
        // Attach the fallback after a grace period so a working
        // devicemotion stream is never mixed with orientation data.
        window.setTimeout(() => {
          if (!usingMotion) window.addEventListener('deviceorientation', onOrientation);
        }, MOTION_TIMEOUT_MS);
      }
      state = 'granted';
      return state;
    },
    getState: () => state,
    getGravity: () => smoothed,
  };
}
