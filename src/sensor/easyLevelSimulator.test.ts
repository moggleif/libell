import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSimulatedEasyLevelTransport,
  easyLevelSimulationMode,
  isRememberedEasyLevelDeviceUsable,
  SIMULATED_ACCEL_INTERVAL_MS,
  SIMULATED_DROP_AFTER_MS,
  SIMULATED_EASYLEVEL_DEVICE_ID,
  SIMULATED_OUTAGE_MS,
  SIMULATED_STATUS_DELAY_MS,
} from './easyLevelSimulator';
import { parseAccelPacket, parseEasyLevelStatus } from './easyLevelProtocol';
import { createEasyLevelSensor } from './easyLevelSensor';

afterEach(() => {
  vi.useRealTimers();
});

describe('easyLevelSimulationMode (#220)', () => {
  it('is off without the flag — including for plain ?demo', () => {
    expect(easyLevelSimulationMode('')).toBe('off');
    expect(easyLevelSimulationMode('?demo')).toBe('off');
  });

  it('is steady for a bare ?easylevel-sim', () => {
    expect(easyLevelSimulationMode('?easylevel-sim')).toBe('steady');
    expect(easyLevelSimulationMode('?demo&easylevel-sim')).toBe('steady');
  });

  it('is drop for ?easylevel-sim=drop, and steady for any other value', () => {
    expect(easyLevelSimulationMode('?easylevel-sim=drop')).toBe('drop');
    expect(easyLevelSimulationMode('?easylevel-sim=whatever')).toBe('steady');
  });
});

describe('createSimulatedEasyLevelTransport (#220) — wire format', () => {
  it('emits a status payload the real parser reads as a tier-3 box with battery, temperature and a non-zero calibration block', async () => {
    vi.useFakeTimers();
    const transport = createSimulatedEasyLevelTransport();
    const connection = await transport.connect(vi.fn());
    const received: DataView[] = [];
    await connection.subscribeStatus((view) => received.push(view));

    await vi.advanceTimersByTimeAsync(SIMULATED_STATUS_DELAY_MS);
    expect(received).toHaveLength(1);

    const status = parseEasyLevelStatus(received[0]!);
    expect(status).not.toBeNull();
    expect(status!.firmwareTier).toBe(3);
    expect(status!.batteryPercent).toBeGreaterThan(20); // never the low-battery warning by default
    expect(status!.batteryPercent).toBeLessThanOrEqual(100);
    expect(status!.temperatureCelsius).toBeGreaterThan(-40);
    expect(status!.temperatureCelsius).toBeLessThan(80);
    // The whole point of simulating tier 3: the #215 bias subtraction runs.
    expect(status!.calibration).not.toBeNull();
    const { accelX, accelY, accelZ } = status!.calibration!;
    expect([accelX, accelY, accelZ]).not.toEqual([0, 0, 0]);
  });

  it('emits 12-byte accel payloads — the tier-≥-3 shape, never the ≥18-byte legacy format that would trigger the embedded-bias path', async () => {
    vi.useFakeTimers();
    const transport = createSimulatedEasyLevelTransport();
    const connection = await transport.connect(vi.fn());
    const received: DataView[] = [];
    await connection.subscribeAccel((view) => received.push(view));

    await vi.advanceTimersByTimeAsync(SIMULATED_ACCEL_INTERVAL_MS * 3);
    expect(received.length).toBe(3);
    for (const view of received) expect(view.byteLength).toBe(12);
  });

  it("bias-corrected accel resolves to the sim's small fixed tilt: raw counts minus the advertised calibration ≈ (-1.2°, -0.35°) at 16384 counts/g", async () => {
    vi.useFakeTimers();
    const transport = createSimulatedEasyLevelTransport();
    const connection = await transport.connect(vi.fn());
    let statusView: DataView | null = null;
    const accelViews: DataView[] = [];
    await connection.subscribeStatus((view) => (statusView = view));
    await connection.subscribeAccel((view) => accelViews.push(view));
    await vi.advanceTimersByTimeAsync(1000);

    const calibration = parseEasyLevelStatus(statusView!)!.calibration;
    for (const view of accelViews) {
      const gravity = parseAccelPacket(view, calibration)!;
      const rollDeg = (Math.atan2(gravity.x, gravity.z) * 180) / Math.PI;
      const pitchDeg = (Math.atan2(gravity.y, gravity.z) * 180) / Math.PI;
      // ±4 raw counts of deterministic wobble ≈ ±0.014° — well within 0.1.
      expect(rollDeg).toBeCloseTo(-1.2, 1);
      expect(pitchDeg).toBeCloseTo(-0.35, 1);
    }
  });
});

describe('createSimulatedEasyLevelTransport (#220) — through the real sensor', () => {
  /** No `navigator.bluetooth` at all, plus the `?easylevel-sim` flag in a
   * stubbed `location` — the exact environment the simulator exists for
   * (a browser with no Web Bluetooth), so these tests pin the sensor
   * working through `isEasyLevelAvailable()`'s simulation arm, never the
   * real-Bluetooth one. */
  function simulationEnvironment(search = '?easylevel-sim'): void {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    Object.defineProperty(globalThis, 'location', { value: { search }, configurable: true });
  }
  const originalNavigator = globalThis.navigator;
  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
    delete (globalThis as { location?: unknown }).location;
  });

  it('start() succeeds with no navigator.bluetooth while ?easylevel-sim is in the URL, and gravity flows calibrated', async () => {
    vi.useFakeTimers();
    simulationEnvironment();
    const sensor = createEasyLevelSensor(createSimulatedEasyLevelTransport());

    expect(await sensor.start()).toBe('granted');
    expect(sensor.getDeviceId()).toBe(SIMULATED_EASYLEVEL_DEVICE_ID);

    // Status (with calibration) arrives before the grace window, then accel.
    await vi.advanceTimersByTimeAsync(1000);
    const gravity = sensor.getGravity();
    expect(gravity).not.toBeNull();
    const rollDeg = (Math.atan2(gravity!.x, gravity!.z) * 180) / Math.PI;
    expect(rollDeg).toBeCloseTo(-1.2, 1);
    expect(sensor.getStatus()?.firmwareTier).toBe(3);
    expect(sensor.getStatusBytes()?.byteLength).toBe(20);
  });

  it('reconnect() succeeds for the remembered simulated id and resolves null-equivalent (disconnected) for any other id', async () => {
    vi.useFakeTimers();
    simulationEnvironment();
    const transport = createSimulatedEasyLevelTransport();

    const sensor = createEasyLevelSensor(transport);
    expect(await sensor.reconnect(SIMULATED_EASYLEVEL_DEVICE_ID)).toBe('granted');

    const other = createEasyLevelSensor(createSimulatedEasyLevelTransport());
    expect(await other.reconnect('some-real-box-id')).toBe('disconnected');
  });

  it('disconnect() stops the packet stream', async () => {
    vi.useFakeTimers();
    simulationEnvironment();
    const sensor = createEasyLevelSensor(createSimulatedEasyLevelTransport());
    await sensor.start();
    await vi.advanceTimersByTimeAsync(500);
    expect(sensor.getGravity()).not.toBeNull();

    sensor.disconnect();
    const stoppedAt = sensor.getLastSampleAt();
    await vi.advanceTimersByTimeAsync(2000);
    expect(sensor.getLastSampleAt()).toBe(stoppedAt); // no further samples
  });

  it("drop mode disconnects after SIMULATED_DROP_AFTER_MS — surfacing the real 'disconnected' state — and reconnect() then works again", async () => {
    vi.useFakeTimers();
    simulationEnvironment('?easylevel-sim=drop');
    const sensor = createEasyLevelSensor(createSimulatedEasyLevelTransport('drop'));
    await sensor.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(sensor.getGravity()).not.toBeNull();

    await vi.advanceTimersByTimeAsync(SIMULATED_DROP_AFTER_MS);
    expect(sensor.getState()).toBe('disconnected');
    expect(sensor.getGravity()).toBeNull();

    // The same silent-reconnect call the #211 background auto-retry makes —
    // failing while the outage window runs (a box still out of range), so
    // the R37 prompt is actually visible for a while, then succeeding.
    expect(await sensor.reconnect(SIMULATED_EASYLEVEL_DEVICE_ID)).toBe('disconnected');
    await vi.advanceTimersByTimeAsync(SIMULATED_OUTAGE_MS);
    expect(await sensor.reconnect(SIMULATED_EASYLEVEL_DEVICE_ID)).toBe('granted');
    await vi.advanceTimersByTimeAsync(1000);
    expect(sensor.getGravity()).not.toBeNull();
  });
});

describe('isRememberedEasyLevelDeviceUsable (#223)', () => {
  it('lets a simulated id auto-reconnect only while the simulation flag is on', () => {
    expect(isRememberedEasyLevelDeviceUsable(SIMULATED_EASYLEVEL_DEVICE_ID, 'steady')).toBe(true);
    expect(isRememberedEasyLevelDeviceUsable(SIMULATED_EASYLEVEL_DEVICE_ID, 'drop')).toBe(true);
    // The bug this exists for: without the flag, the REAL transport would
    // hunt for a device that cannot exist, stranding the app on the R37
    // prompt with a background retry that can never succeed.
    expect(isRememberedEasyLevelDeviceUsable(SIMULATED_EASYLEVEL_DEVICE_ID, 'off')).toBe(false);
  });

  it('lets a real device id auto-reconnect only while the simulation flag is off', () => {
    const realId = 'aBc123-real-web-bluetooth-id';
    expect(isRememberedEasyLevelDeviceUsable(realId, 'off')).toBe(true);
    // The mirror case: the simulated transport rejects every id but its own.
    expect(isRememberedEasyLevelDeviceUsable(realId, 'steady')).toBe(false);
    expect(isRememberedEasyLevelDeviceUsable(realId, 'drop')).toBe(false);
  });
});
