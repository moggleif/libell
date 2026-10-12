/**
 * Tilt sensing.
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
 *
 * `OrientationSensor` is the multi-source seam (ADR 0014): `main.ts`
 * picks an implementation at one injection point, and nothing downstream —
 * including all of `domain/` — needs to know which one is active.
 */
import type { GravityVector } from '../domain/leveling';
import type { SensorSource } from '../domain/settings';

/**
 * `'disconnected'` means "was granted, then the connection was lost" —
 * reachable by any external `OrientationSensor`, never by the phone sensor,
 * whose APIs have no lost-connection event.
 */
export type SensorState =
  'idle' | 'unsupported' | 'needs-permission' | 'granted' | 'denied' | 'disconnected';

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
  /**
   * Fixed per implementation, so a lost external source can be reported by
   * name instead of silently falling back to another one (ADR 0014).
   */
  getSource(): SensorSource;
  /**
   * `performance.now()` at the last real sample this adapter accepted, or
   * null before the first one — never a value that merely reflects "still
   * connected". Feeds `domain/staleness.ts`.
   */
  getLastSampleAt(): number | null;
}

/**
 * True when the platform (iOS 13+) requires a user tap before motion data.
 * Chromium 153+ offers `requestPermission()` too but still delivers events
 * without it (#410); `navigator.userAgentData` exists only in Chromium, never
 * in WebKit (Chrome on iOS included), so it tells the two apart.
 */
export function needsPermissionGesture(): boolean {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as unknown as PermissionRequester).requestPermission === 'function' &&
    !isChromium()
  );
}

function isChromium(): boolean {
  return typeof navigator !== 'undefined' && 'userAgentData' in navigator;
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

/** The phone sensor's mutable state; the functions below work on one. */
interface PhoneReadings {
  state: SensorState;
  smoothed: GravityVector | null;
  usingMotion: boolean;
  /** Stamped on every accepted reading, not on "listener attached" — the
   * only honest signal that the stream is still alive. */
  lastSampleAt: number | null;
  /** Made once, so a second start() racing the first adds no duplicate. */
  readonly onMotion: (event: DeviceMotionEvent) => void;
  readonly onOrientation: (event: DeviceOrientationEvent) => void;
}

export function createOrientationSensor(): OrientationSensor {
  const phone: PhoneReadings = {
    state: 'idle',
    smoothed: null,
    usingMotion: false,
    lastSampleAt: null,
    onMotion: (event) => onMotion(phone, event),
    onOrientation: (event) => onOrientation(phone, event),
  };
  return {
    start: () => startPhone(phone),
    getState: () => phone.state,
    getGravity: () => phone.smoothed,
    getSource: () => 'phone',
    getLastSampleAt: () => phone.lastSampleAt,
  };
}

async function startPhone(phone: PhoneReadings): Promise<SensorState> {
  if (phone.state === 'granted') return phone.state;
  if (!isSensorSupported()) {
    phone.state = 'unsupported';
    return phone.state;
  }
  if ((await requestPermissions()) === 'denied') {
    phone.state = 'denied';
    return phone.state;
  }
  listen(phone);
  phone.state = 'granted';
  return phone.state;
}

function listen(phone: PhoneReadings): void {
  if (typeof DeviceMotionEvent !== 'undefined') {
    window.addEventListener('devicemotion', phone.onMotion);
  }
  if (typeof DeviceOrientationEvent !== 'undefined') {
    // Attach the fallback after a grace period so a working devicemotion
    // stream is never mixed with orientation data.
    window.setTimeout(() => {
      if (!phone.usingMotion) {
        window.addEventListener('deviceorientation', phone.onOrientation);
      }
    }, MOTION_TIMEOUT_MS);
  }
}

function onMotion(phone: PhoneReadings, event: DeviceMotionEvent): void {
  const g = event.accelerationIncludingGravity;
  if (g && g.x !== null && g.y !== null && g.z !== null) {
    phone.usingMotion = true;
    accept(phone, normalizeGravity(g.x, g.y, g.z));
  }
}

function onOrientation(phone: PhoneReadings, event: DeviceOrientationEvent): void {
  // Motion data wins when both fire; orientation is only the fallback.
  if (!phone.usingMotion && event.beta !== null && event.gamma !== null) {
    accept(phone, gravityFromOrientation(event.beta, event.gamma));
  }
}

function accept(phone: PhoneReadings, reading: GravityVector): void {
  phone.smoothed = phone.smoothed === null ? reading : smooth(phone.smoothed, reading);
  phone.lastSampleAt = performance.now();
}

/** One step of the exponential moving average. */
function smooth(previous: GravityVector, reading: GravityVector): GravityVector {
  return {
    x: previous.x + SMOOTHING_ALPHA * (reading.x - previous.x),
    y: previous.y + SMOOTHING_ALPHA * (reading.y - previous.y),
    z: previous.z + SMOOTHING_ALPHA * (reading.z - previous.z),
  };
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
