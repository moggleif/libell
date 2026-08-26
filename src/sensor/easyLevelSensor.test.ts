import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createEasyLevelSensor,
  createWebBluetoothTransport,
  isWebBluetoothSupported,
  EASYLEVEL_ADVERTISED_SERVICE_UUID,
  EASYLEVEL_DEVICE_NAME_PREFIX,
  EASYLEVEL_SERVICE_UUID,
  type EasyLevelConnection,
  type EasyLevelTransport,
} from './easyLevelSensor';

/** Little-endian int16 triplet, matching the real faf52c21 payload shape. */
function accelBytes(x: number, y: number, z: number): Uint8Array {
  const view = new DataView(new ArrayBuffer(6));
  view.setInt16(0, x, true);
  view.setInt16(2, y, true);
  view.setInt16(4, z, true);
  return new Uint8Array(view.buffer);
}

/** An `faf52c22` status payload (#123): tier-2+ temperature bytes, battery
 * rawMv, and the firmware-tier byte — matching `easyLevelProtocol.test.ts`'s
 * layout. */
function statusBytes(rawMv: number, firmwareByte: number): Uint8Array {
  const view = new DataView(new ArrayBuffer(8));
  view.setUint16(2, rawMv, true);
  view.setUint8(7, firmwareByte);
  return new Uint8Array(view.buffer);
}

/** `statusBytes()` plus bytes 8–19: the six int16 LE calibration values
 * (#215) — `firmwareByte` must be ≥ 48 (tier ≥ 3) for these to actually be
 * decoded, matching the official app's own gate. */
function statusBytesWithCalibration(
  rawMv: number,
  firmwareByte: number,
  accelX: number,
  accelY: number,
  accelZ: number,
): Uint8Array {
  const view = new DataView(new ArrayBuffer(20));
  new Uint8Array(view.buffer).set(statusBytes(rawMv, firmwareByte));
  view.setInt16(8, accelX, true);
  view.setInt16(10, accelY, true);
  view.setInt16(12, accelZ, true);
  return new Uint8Array(view.buffer);
}

/** A controllable stand-in for `createWebBluetoothTransport()` (#116) — no
 * real `navigator.bluetooth` involved, so the state machine is fully
 * testable without hardware or a browser. `reconnect` defaults to
 * succeeding the same way `connect` does (#130) — tests that want a failed
 * silent reconnect override it. `subscribeStatusFails` (#217) simulates a
 * box whose firmware never exposes `faf52c22-...` at all — the real
 * transport's `subscribe()` rejects when `getCharacteristic()` can't find
 * it. `callOrder` (#217) records `'status'`/`'accel'` as each is
 * subscribed, for the tests asserting the official app's own ordering. */
function fakeTransport(options?: {
  reconnect?: EasyLevelTransport['reconnect'];
  subscribeStatusFails?: boolean;
  callOrder?: string[];
}): {
  transport: EasyLevelTransport;
  emitAccel(bytes: Uint8Array): void;
  emitStatus(bytes: Uint8Array): void;
  emitDisconnect(): void;
  connection: EasyLevelConnection;
} {
  let accelHandler: ((view: DataView) => void) | null = null;
  let statusHandler: ((view: DataView) => void) | null = null;
  let disconnectHandler: (() => void) | null = null;
  const connection: EasyLevelConnection = {
    deviceId: 'fake-device-id',
    subscribeAccel: async (onData) => {
      options?.callOrder?.push('accel');
      accelHandler = onData;
    },
    subscribeStatus: async (onData) => {
      options?.callOrder?.push('status');
      if (options?.subscribeStatusFails) throw new Error('no faf52c22 on this box');
      statusHandler = onData;
    },
    disconnect: vi.fn(),
  };
  return {
    transport: {
      connect: async (onDisconnect) => {
        disconnectHandler = onDisconnect;
        return connection;
      },
      reconnect:
        options?.reconnect ??
        (async (_deviceId, onDisconnect) => {
          disconnectHandler = onDisconnect;
          return connection;
        }),
    },
    emitAccel: (bytes) => accelHandler?.(new DataView(bytes.buffer)),
    emitStatus: (bytes) => statusHandler?.(new DataView(bytes.buffer)),
    emitDisconnect: () => disconnectHandler?.(),
    connection,
  };
}

const originalNavigator = globalThis.navigator;

afterEach(() => {
  Object.defineProperty(globalThis, 'navigator', {
    value: originalNavigator,
    configurable: true,
  });
});

describe('createEasyLevelSensor (#116)', () => {
  it('reports getSource() as easylevel and starts idle with no gravity', () => {
    const { transport } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    expect(sensor.getSource()).toBe('easylevel');
    expect(sensor.getState()).toBe('idle');
    expect(sensor.getGravity()).toBeNull();
  });

  it('reports unsupported when navigator.bluetooth does not exist, without calling the transport', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    const { transport } = fakeTransport();
    const connectSpy = vi.spyOn(transport, 'connect');
    const sensor = createEasyLevelSensor(transport);
    expect(await sensor.start()).toBe('unsupported');
    expect(sensor.getState()).toBe('unsupported');
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it('connects, subscribes, and turns the first notification into a GravityVector', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, emitStatus } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);

    expect(await sensor.start()).toBe('granted');
    expect(sensor.getGravity()).toBeNull(); // nothing received yet

    // A status notification (#217) — even one with no calibration block —
    // is what unlocks getGravity(); see the dedicated "startup ordering"
    // describe block below for the withheld-until-then behavior itself.
    emitStatus(statusBytes(2500, 0));

    emitAccel(accelBytes(12, -34, 9800));
    expect(sensor.getGravity()).toEqual({ x: 12, y: -34, z: 9800 });

    // A later notification replaces the previous reading.
    emitAccel(accelBytes(0, 0, 9810));
    expect(sensor.getGravity()).toEqual({ x: 0, y: 0, z: 9810 });
  });

  it("applies a status notification's bias to every accel reading from then on (#215) — the fix for the bug where these bytes were decoded nowhere", async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, emitStatus } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();

    // No status yet (#217): withheld entirely, not exposed as an
    // uncalibrated reading — see the "startup ordering" describe block.
    emitAccel(accelBytes(1000, -500, 9800));
    expect(sensor.getGravity()).toBeNull();

    // Tier-3 status arrives with a calibration block.
    emitStatus(statusBytesWithCalibration(2500, 48, 200, -50, 100));

    // The *next* accel sample is bias-corrected, without needing a new
    // connection or any other trigger.
    emitAccel(accelBytes(1000, -500, 9800));
    expect(sensor.getGravity()).toEqual({ x: 800, y: -450, z: 9700 });
  });

  it('surfaces an unexpected GATT disconnect as "disconnected" and clears gravity, instead of freezing on the last value', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, emitStatus, emitDisconnect } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();
    emitStatus(statusBytes(2500, 0));
    emitAccel(accelBytes(1, 2, 3));
    expect(sensor.getGravity()).not.toBeNull();

    emitDisconnect();

    expect(sensor.getState()).toBe('disconnected');
    expect(sensor.getGravity()).toBeNull();
  });

  it('surfaces a failed connect (e.g. a cancelled device picker) as denied', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const transport: EasyLevelTransport = {
      connect: () => Promise.reject(new Error('User cancelled the requestDevice() chooser.')),
      reconnect: async () => null,
    };
    const sensor = createEasyLevelSensor(transport);
    expect(await sensor.start()).toBe('denied');
    expect(sensor.getState()).toBe('denied');
  });

  it('never fails to connect just because the status characteristic subscription throws (best-effort, #116)', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const connection: EasyLevelConnection = {
      deviceId: 'fake-device-id',
      subscribeAccel: async () => {},
      subscribeStatus: () => Promise.reject(new Error('no such characteristic')),
      disconnect: vi.fn(),
    };
    const transport: EasyLevelTransport = {
      connect: async () => connection,
      reconnect: async () => connection,
    };
    const sensor = createEasyLevelSensor(transport);
    expect(await sensor.start()).toBe('granted');
  });

  it('explicit disconnect() tears down the connection and resets to idle', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, connection } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();
    emitAccel(accelBytes(1, 1, 1));

    sensor.disconnect();

    expect(connection.disconnect).toHaveBeenCalledOnce();
    expect(sensor.getState()).toBe('idle');
    expect(sensor.getGravity()).toBeNull();
    expect(sensor.getLastSampleAt()).toBeNull();
  });

  it('a fresh start() after a lost connection reconnects via the transport again', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitDisconnect } = fakeTransport();
    const connectSpy = vi.spyOn(transport, 'connect');
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();
    emitDisconnect();
    expect(sensor.getState()).toBe('disconnected');

    expect(await sensor.start()).toBe('granted');
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  it('tracks getLastSampleAt() from real notifications, not merely "connected" (#132)', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, emitStatus, emitDisconnect } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    expect(sensor.getLastSampleAt()).toBeNull();

    await sensor.start();
    // Connected, but no notification has arrived yet — still no timestamp.
    expect(sensor.getLastSampleAt()).toBeNull();
    emitStatus(statusBytes(2500, 0));

    const before = performance.now();
    emitAccel(accelBytes(1, 2, 3));
    const after = performance.now();
    const sampledAt = sensor.getLastSampleAt();
    expect(sampledAt).not.toBeNull();
    expect(sampledAt).toBeGreaterThanOrEqual(before);
    expect(sampledAt).toBeLessThanOrEqual(after);

    // A GATT disconnect clears the timestamp along with the gravity —
    // never leaves a stale timestamp claiming the last reading is fresh.
    emitDisconnect();
    expect(sensor.getLastSampleAt()).toBeNull();
  });

  it('getDeviceId() is null before connecting and the connected device id afterward', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    expect(sensor.getDeviceId()).toBeNull();

    await sensor.start();
    expect(sensor.getDeviceId()).toBe('fake-device-id');
  });

  it('getStatus() is null until the first faf52c22 notification, then parses battery/temperature/firmware tier (#123)', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitStatus } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();
    expect(sensor.getStatus()).toBeNull();

    emitStatus(statusBytes(2500, 32));
    expect(sensor.getStatus()).toEqual({
      firmwareTier: 2,
      batteryPercent: 50,
      temperatureCelsius: 0,
      calibration: null,
    });

    // A later notification replaces the previous status, same as gravity.
    emitStatus(statusBytes(3000, 0));
    expect(sensor.getStatus()).toEqual({
      firmwareTier: 1,
      batteryPercent: 100,
      temperatureCelsius: 25,
      calibration: null,
    });
  });

  it('clears getStatus() on an unexpected GATT disconnect, same as getGravity() (#123/#132)', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitStatus, emitDisconnect } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();
    emitStatus(statusBytes(2500, 32));
    expect(sensor.getStatus()).not.toBeNull();

    emitDisconnect();

    expect(sensor.getStatus()).toBeNull();
  });

  it('clears getStatus() on an explicit disconnect()', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitStatus } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();
    emitStatus(statusBytes(2500, 32));

    sensor.disconnect();

    expect(sensor.getStatus()).toBeNull();
  });
});

describe('createEasyLevelSensor() startup ordering and initial-calibration gate (#217)', () => {
  it('subscribes faf52c22 (status) before faf52c21 (accel) — matching the official app’s own connect-setup ordering', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const callOrder: string[] = [];
    const { transport } = fakeTransport({ callOrder });
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();
    expect(callOrder).toEqual(['status', 'accel']);
  });

  it('withholds getGravity()/getLastSampleAt() for accel samples received before the first status notification', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();

    emitAccel(accelBytes(1, 2, 3));
    expect(sensor.getGravity()).toBeNull();
    expect(sensor.getLastSampleAt()).toBeNull();
  });

  it('starts exposing gravity from the very next accel sample once a status notification arrives, even one with no calibration block', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, emitStatus } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();

    emitAccel(accelBytes(1, 2, 3));
    expect(sensor.getGravity()).toBeNull();

    emitStatus(statusBytes(2500, 0)); // tier 1, no calibration bytes present
    emitAccel(accelBytes(4, 5, 6));
    expect(sensor.getGravity()).toEqual({ x: 4, y: 5, z: 6 });
  });

  it('never waits at all when subscribeStatus itself fails — no faf52c22 characteristic on this box', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel } = fakeTransport({ subscribeStatusFails: true });
    const sensor = createEasyLevelSensor(transport);
    expect(await sensor.start()).toBe('granted'); // best-effort subscribe failure never fails start()

    emitAccel(accelBytes(1, 2, 3));
    expect(sensor.getGravity()).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('gives up waiting once the initial-calibration grace window elapses, exposing best-effort (possibly uncalibrated) readings — never stuck forever', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel } = fakeTransport(); // subscribeStatus "succeeds" but never notifies
    let currentTimeMs = 1000;
    const sensor = createEasyLevelSensor(transport, undefined, () => currentTimeMs);
    await sensor.start();

    currentTimeMs += 1; // just after connecting: still within the grace window
    emitAccel(accelBytes(1, 2, 3));
    expect(sensor.getGravity()).toBeNull();

    currentTimeMs += 5000; // well past EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS
    emitAccel(accelBytes(1, 2, 3));
    expect(sensor.getGravity()).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('applies the same withholding rule to reconnect(), not just the initial start()', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    expect(await sensor.reconnect('fake-device-id')).toBe('granted');

    emitAccel(accelBytes(1, 2, 3));
    expect(sensor.getGravity()).toBeNull();
  });

  it("applies getMounting()'s transform to every accel reading, read fresh on each sample", async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, emitStatus } = fakeTransport();
    let mounting: 'standard' | 'rotated90' = 'standard';
    const sensor = createEasyLevelSensor(transport, () => mounting);
    await sensor.start();
    emitStatus(statusBytes(2500, 0));

    emitAccel(accelBytes(500, 0, 9800));
    expect(sensor.getGravity()).toEqual({ x: 500, y: 0, z: 9800 });

    // Flipping the setting takes effect on the very next sample, no
    // reconnect needed — matches `main.ts`'s live-settings-read pattern
    // for the connect-delay workaround (#212).
    mounting = 'rotated90';
    emitAccel(accelBytes(500, 0, 9800));
    // -y where y is 0 gives JS's -0, not 0 — checked field-by-field rather
    // than with toEqual's Object.is-based comparison.
    const rotated = sensor.getGravity();
    expect(rotated?.x).toBeCloseTo(0);
    expect(rotated?.y).toBe(500);
    expect(rotated?.z).toBe(9800);
  });
});

describe('createEasyLevelSensor().reconnect() (#130)', () => {
  it('reports unsupported when navigator.bluetooth does not exist, without calling the transport', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    const { transport } = fakeTransport();
    const reconnectSpy = vi.spyOn(transport, 'reconnect');
    const sensor = createEasyLevelSensor(transport);
    expect(await sensor.reconnect('fake-device-id')).toBe('unsupported');
    expect(sensor.getState()).toBe('unsupported');
    expect(reconnectSpy).not.toHaveBeenCalled();
  });

  it('reconnects silently to a remembered device id and starts feeding gravity, with no picker involved', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, emitStatus } = fakeTransport();
    const connectSpy = vi.spyOn(transport, 'connect');
    const sensor = createEasyLevelSensor(transport);

    expect(await sensor.reconnect('fake-device-id')).toBe('granted');
    expect(connectSpy).not.toHaveBeenCalled();
    expect(sensor.getDeviceId()).toBe('fake-device-id');

    emitStatus(statusBytes(2500, 0));
    emitAccel(accelBytes(5, 6, 7));
    expect(sensor.getGravity()).toEqual({ x: 5, y: 6, z: 7 });
  });

  it('resolves "disconnected" — not a new picker — when the remembered device cannot be found (transport.reconnect() resolves null)', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, connection } = fakeTransport({ reconnect: async () => null });
    const connectSpy = vi.spyOn(transport, 'connect');
    const sensor = createEasyLevelSensor(transport);

    expect(await sensor.reconnect('some-other-device-id')).toBe('disconnected');
    expect(sensor.getState()).toBe('disconnected');
    expect(sensor.getGravity()).toBeNull();
    expect(sensor.getDeviceId()).toBeNull();
    expect(connectSpy).not.toHaveBeenCalled(); // never falls back to the gesture-triggered picker
    expect(connection.disconnect).not.toHaveBeenCalled();
  });

  it('resolves "disconnected" when transport.reconnect() rejects outright (e.g. a GATT error)', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const transport: EasyLevelTransport = {
      connect: async () => {
        throw new Error('should never be called');
      },
      reconnect: () => Promise.reject(new Error('GATT operation failed')),
    };
    const sensor = createEasyLevelSensor(transport);
    expect(await sensor.reconnect('fake-device-id')).toBe('disconnected');
  });

  it('a later unexpected GATT disconnect after a silent reconnect surfaces the same way as after a manual connect', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, emitDisconnect } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.reconnect('fake-device-id');
    emitAccel(accelBytes(1, 2, 3));

    emitDisconnect();

    expect(sensor.getState()).toBe('disconnected');
    expect(sensor.getGravity()).toBeNull();
  });
});

/** A minimal fake `BluetoothDevice`, enough to exercise
 * `createWebBluetoothTransport()`'s real GATT-wiring code (#130) — no
 * physical box or real `navigator.bluetooth` involved. */
function fakeBluetoothDevice(id: string, options?: { connectFails?: boolean }): BluetoothDevice {
  const characteristic = {
    value: undefined,
    addEventListener: vi.fn(),
    startNotifications: vi.fn().mockResolvedValue(undefined),
  };
  const service = {
    getCharacteristic: vi.fn().mockResolvedValue(characteristic),
  };
  const server = {
    connect: options?.connectFails
      ? vi.fn().mockRejectedValue(new Error('device out of range'))
      : vi.fn(),
    disconnect: vi.fn(),
    getPrimaryService: vi.fn().mockResolvedValue(service),
  };
  if (!options?.connectFails) server.connect.mockResolvedValue(server);
  return { id, gatt: server, addEventListener: vi.fn() } as unknown as BluetoothDevice;
}

describe('createWebBluetoothTransport().connect() (the real Web Bluetooth transport)', () => {
  it("requests devices by the advertised scan UUID and the CARATI name prefix, not the GATT service UUID — confirmed against the official app's own scan filter, not just faf52c20-...", async () => {
    const device = fakeBluetoothDevice('device-1');
    const requestDevice = vi.fn().mockResolvedValue(device);
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { requestDevice } },
      configurable: true,
    });
    const transport = createWebBluetoothTransport();
    await transport.connect(vi.fn());
    expect(requestDevice).toHaveBeenCalledWith({
      filters: [
        { services: [EASYLEVEL_ADVERTISED_SERVICE_UUID] },
        { namePrefix: EASYLEVEL_DEVICE_NAME_PREFIX },
      ],
      optionalServices: [EASYLEVEL_SERVICE_UUID],
    });
  });

  it('still looks up the faf52c20-... GATT service post-connect, listed in optionalServices so the lookup is allowed', async () => {
    const device = fakeBluetoothDevice('device-1');
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { requestDevice: vi.fn().mockResolvedValue(device) } },
      configurable: true,
    });
    const transport = createWebBluetoothTransport();
    await transport.connect(vi.fn());
    expect(device.gatt?.getPrimaryService).toHaveBeenCalledWith(EASYLEVEL_SERVICE_UUID);
  });
});

describe('createWebBluetoothTransport().reconnect() (#130 — the real Web Bluetooth transport)', () => {
  it('resolves null when getDevices() does not exist on navigator.bluetooth', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} }, // no getDevices — an older/unsupporting browser
      configurable: true,
    });
    const transport = createWebBluetoothTransport();
    expect(await transport.reconnect('device-1', vi.fn())).toBeNull();
  });

  it('resolves null when the remembered id is not among the previously-authorized devices', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        bluetooth: { getDevices: vi.fn().mockResolvedValue([fakeBluetoothDevice('device-other')]) },
      },
      configurable: true,
    });
    const transport = createWebBluetoothTransport();
    expect(await transport.reconnect('device-1', vi.fn())).toBeNull();
  });

  it('resolves null (never throws) when the device is found but GATT connect fails', async () => {
    const device = fakeBluetoothDevice('device-1', { connectFails: true });
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { getDevices: vi.fn().mockResolvedValue([device]) } },
      configurable: true,
    });
    const transport = createWebBluetoothTransport();
    await expect(transport.reconnect('device-1', vi.fn())).resolves.toBeNull();
  });

  it('connects GATT and wires the same service as connect() when the remembered device is found', async () => {
    const device = fakeBluetoothDevice('device-1');
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { getDevices: vi.fn().mockResolvedValue([device]) } },
      configurable: true,
    });
    const transport = createWebBluetoothTransport();
    const connection = await transport.reconnect('device-1', vi.fn());
    expect(connection?.deviceId).toBe('device-1');
    expect(device.gatt?.getPrimaryService).toHaveBeenCalledWith(EASYLEVEL_SERVICE_UUID);
  });
});

describe('createWebBluetoothTransport() connect delay (#212, debug hardware workaround)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds no delay at all by default — todays exact connect sequence, unaffected', async () => {
    const device = fakeBluetoothDevice('device-1');
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { requestDevice: vi.fn().mockResolvedValue(device) } },
      configurable: true,
    });
    const transport = createWebBluetoothTransport();
    await transport.connect(vi.fn());
    expect(device.gatt?.getPrimaryService).toHaveBeenCalledWith(EASYLEVEL_SERVICE_UUID);
  });

  it('waits the configured delay after GATT connect before discovering the service', async () => {
    vi.useFakeTimers();
    const device = fakeBluetoothDevice('device-1');
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { requestDevice: vi.fn().mockResolvedValue(device) } },
      configurable: true,
    });
    const transport = createWebBluetoothTransport(() => 300);
    const connectPromise = transport.connect(vi.fn());

    // GATT connect already resolved (a plain mock, no timer of its own),
    // but the service lookup must not have happened yet — it's gated on
    // the delay below.
    await vi.advanceTimersByTimeAsync(0);
    expect(device.gatt?.getPrimaryService).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(299);
    expect(device.gatt?.getPrimaryService).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(device.gatt?.getPrimaryService).toHaveBeenCalledWith(EASYLEVEL_SERVICE_UUID);
    await connectPromise;
  });

  it('re-reads the delay fresh on every connect, never caching the first value', async () => {
    const device1 = fakeBluetoothDevice('device-1');
    const device2 = fakeBluetoothDevice('device-2');
    let currentDelay = 0;
    const transport = createWebBluetoothTransport(() => currentDelay);

    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { requestDevice: vi.fn().mockResolvedValue(device1) } },
      configurable: true,
    });
    await transport.connect(vi.fn());
    expect(device1.gatt?.getPrimaryService).toHaveBeenCalled();

    // Toggled on for the *next* connect — the reconnect path (#130) must
    // see the new value too, not whatever was true when the transport was
    // first created.
    currentDelay = 50;
    vi.useFakeTimers();
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { getDevices: vi.fn().mockResolvedValue([device2]) } },
      configurable: true,
    });
    const reconnectPromise = transport.reconnect('device-2', vi.fn());
    await vi.advanceTimersByTimeAsync(0);
    expect(device2.gatt?.getPrimaryService).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(50);
    expect(device2.gatt?.getPrimaryService).toHaveBeenCalled();
    await reconnectPromise;
  });
});

describe('isWebBluetoothSupported', () => {
  it('is false without navigator.bluetooth', () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    expect(isWebBluetoothSupported()).toBe(false);
  });

  it('is true when navigator.bluetooth exists', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    expect(isWebBluetoothSupported()).toBe(true);
  });
});
