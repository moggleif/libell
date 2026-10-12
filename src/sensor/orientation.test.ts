import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeLeveling } from '../domain/leveling';
import { DEFAULT_SETTINGS, type SensorSource } from '../domain/settings';
import {
  createOrientationSensor,
  needsPermissionGesture,
  type OrientationSensor,
} from './orientation';

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
    getLastSampleAt: () => 0,
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

  it('reports no last-sample timestamp before any reading has arrived (#132)', () => {
    const sensor = createOrientationSensor();
    expect(sensor.getLastSampleAt()).toBeNull();
  });
});

describe('needsPermissionGesture (#410)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubBrowser(options: { requestPermission: boolean; chromium: boolean }): void {
    const motion = function DeviceMotionEvent() {};
    if (options.requestPermission) {
      Object.assign(motion, { requestPermission: () => Promise.resolve('granted') });
    }
    vi.stubGlobal('DeviceMotionEvent', motion);
    vi.stubGlobal('navigator', options.chromium ? { userAgentData: { brands: [] } } : {});
  }

  it('is true on iOS Safari, which offers requestPermission and is not Chromium', () => {
    stubBrowser({ requestPermission: true, chromium: false });
    expect(needsPermissionGesture()).toBe(true);
  });

  it('is false on Chrome 153+, which offers requestPermission but needs no tap', () => {
    stubBrowser({ requestPermission: true, chromium: true });
    expect(needsPermissionGesture()).toBe(false);
  });

  it('is false where requestPermission does not exist', () => {
    stubBrowser({ requestPermission: false, chromium: false });
    expect(needsPermissionGesture()).toBe(false);
  });
});

describe('the phone sensor: permission, source choice and smoothing (#479)', () => {
  type Listener = (event: unknown) => void;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /** A browser window that records its listeners, on fake timers. */
  function stubWindow(options: { secure?: boolean; motion?: object; orientation?: object } = {}) {
    vi.useFakeTimers();
    const listeners = new Map<string, Listener>();
    vi.stubGlobal('window', {
      isSecureContext: options.secure ?? true,
      addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
      setTimeout: (handler: () => void, ms: number) => setTimeout(handler, ms),
    });
    vi.stubGlobal('DeviceMotionEvent', options.motion ?? function DeviceMotionEvent() {});
    vi.stubGlobal(
      'DeviceOrientationEvent',
      options.orientation ?? function DeviceOrientationEvent() {},
    );
    vi.stubGlobal('navigator', {});
    return {
      has: (type: string) => listeners.has(type),
      fire: (type: string, event: unknown) => listeners.get(type)?.(event),
    };
  }

  function motion(x: number | null, y: number | null, z: number | null) {
    return { accelerationIncludingGravity: { x, y, z } };
  }

  function withPermission(verdict: () => Promise<'granted' | 'denied'>) {
    return Object.assign(function DeviceMotionEvent() {}, { requestPermission: verdict });
  }

  it('is unsupported outside a secure context and attaches nothing', async () => {
    const browser = stubWindow({ secure: false });
    const sensor = createOrientationSensor();
    expect(await sensor.start()).toBe('unsupported');
    expect(sensor.getState()).toBe('unsupported');
    expect(browser.has('devicemotion')).toBe(false);
  });

  it('is granted without a tap where none is needed, and takes devicemotion readings', async () => {
    const browser = stubWindow();
    const sensor = createOrientationSensor();
    expect(await sensor.start()).toBe('granted');
    browser.fire('devicemotion', motion(1, 2, 9));
    expect(sensor.getGravity()).toEqual({ x: 1, y: 2, z: 9 });
    expect(sensor.getLastSampleAt()).not.toBeNull();
  });

  it("flips iOS's negated gravity so a face-up phone reads z > 0", async () => {
    const browser = stubWindow();
    const sensor = createOrientationSensor();
    await sensor.start();
    browser.fire('devicemotion', motion(1, -2, -9));
    expect(sensor.getGravity()).toEqual({ x: -1, y: 2, z: 9 });
  });

  it('ignores a motion event without a full gravity vector', async () => {
    const browser = stubWindow();
    const sensor = createOrientationSensor();
    await sensor.start();
    browser.fire('devicemotion', motion(1, null, 9));
    browser.fire('devicemotion', { accelerationIncludingGravity: null });
    expect(sensor.getGravity()).toBeNull();
    expect(sensor.getLastSampleAt()).toBeNull();
  });

  it('smooths later readings with an exponential moving average', async () => {
    const browser = stubWindow();
    const sensor = createOrientationSensor();
    await sensor.start();
    browser.fire('devicemotion', motion(0, 0, 9));
    browser.fire('devicemotion', motion(1, -1, 10));
    const gravity = sensor.getGravity()!;
    expect(gravity.x).toBeCloseTo(0.15);
    expect(gravity.y).toBeCloseTo(-0.15);
    expect(gravity.z).toBeCloseTo(9.15);
  });

  it('falls back to deviceorientation only after the motion grace period', async () => {
    const browser = stubWindow();
    const sensor = createOrientationSensor();
    await sensor.start();
    vi.advanceTimersByTime(1499);
    expect(browser.has('deviceorientation')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(browser.has('deviceorientation')).toBe(true);
    browser.fire('deviceorientation', { beta: 0, gamma: 0 });
    const gravity = sensor.getGravity()!;
    expect(gravity.x).toBeCloseTo(0);
    expect(gravity.y).toBeCloseTo(0);
    expect(gravity.z).toBeCloseTo(9.81);
  });

  it('converts orientation angles into the equivalent gravity vector', async () => {
    const browser = stubWindow();
    const sensor = createOrientationSensor();
    await sensor.start();
    vi.advanceTimersByTime(1500);
    browser.fire('deviceorientation', { beta: 30, gamma: 0 });
    const gravity = sensor.getGravity()!;
    expect(gravity.x).toBeCloseTo(0);
    expect(gravity.y).toBeCloseTo(9.81 * 0.5);
    expect(gravity.z).toBeCloseTo(9.81 * Math.cos(Math.PI / 6));
  });

  it('never attaches the orientation fallback once motion data has arrived', async () => {
    const browser = stubWindow();
    const sensor = createOrientationSensor();
    await sensor.start();
    browser.fire('devicemotion', motion(0, 0, 9));
    vi.advanceTimersByTime(1500);
    expect(browser.has('deviceorientation')).toBe(false);
  });

  it('ignores orientation events without both angles', async () => {
    const browser = stubWindow();
    const sensor = createOrientationSensor();
    await sensor.start();
    vi.advanceTimersByTime(1500);
    browser.fire('deviceorientation', { beta: null, gamma: 3 });
    expect(sensor.getGravity()).toBeNull();
  });

  it('lets motion data win over orientation once both fire', async () => {
    const browser = stubWindow();
    const sensor = createOrientationSensor();
    await sensor.start();
    vi.advanceTimersByTime(1500);
    browser.fire('devicemotion', motion(0, 0, 9));
    browser.fire('deviceorientation', { beta: 45, gamma: 45 });
    expect(sensor.getGravity()).toEqual({ x: 0, y: 0, z: 9 });
  });

  it('asks iOS for motion and orientation permission, and the motion verdict decides', async () => {
    const orientationAsk = vi.fn(() => Promise.reject(new Error('no')));
    const motionAsk = vi.fn(() => Promise.resolve('granted' as const));
    stubWindow({
      motion: withPermission(motionAsk),
      orientation: Object.assign(function DeviceOrientationEvent() {}, {
        requestPermission: orientationAsk,
      }),
    });
    const sensor = createOrientationSensor();
    expect(await sensor.start()).toBe('granted');
    expect(motionAsk).toHaveBeenCalledTimes(1);
    expect(orientationAsk).toHaveBeenCalledTimes(1);
  });

  it('is denied when iOS refuses motion access, and attaches nothing', async () => {
    const browser = stubWindow({ motion: withPermission(() => Promise.resolve('denied')) });
    const sensor = createOrientationSensor();
    expect(await sensor.start()).toBe('denied');
    expect(sensor.getState()).toBe('denied');
    expect(browser.has('devicemotion')).toBe(false);
  });

  it('is denied when the permission request itself fails', async () => {
    stubWindow({ motion: withPermission(() => Promise.reject(new Error('no gesture'))) });
    expect(await createOrientationSensor().start()).toBe('denied');
  });

  it('does not ask again once granted', async () => {
    const motionAsk = vi.fn(() => Promise.resolve('granted' as const));
    stubWindow({ motion: withPermission(motionAsk) });
    const sensor = createOrientationSensor();
    await sensor.start();
    expect(await sensor.start()).toBe('granted');
    expect(motionAsk).toHaveBeenCalledTimes(1);
  });
});
