import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createEasyLevelSensor,
  createWebBluetoothTransport,
  isWebBluetoothSupported,
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

/** A controllable stand-in for `createWebBluetoothTransport()` (#116) — no
 * real `navigator.bluetooth` involved, so the state machine is fully
 * testable without hardware or a browser. `reconnect` defaults to
 * succeeding the same way `connect` does (#130) — tests that want a failed
 * silent reconnect override it. */
function fakeTransport(options?: { reconnect?: EasyLevelTransport['reconnect'] }): {
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
      accelHandler = onData;
    },
    subscribeStatus: async (onData) => {
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
    const { transport, emitAccel } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);

    expect(await sensor.start()).toBe('granted');
    expect(sensor.getGravity()).toBeNull(); // nothing received yet

    emitAccel(accelBytes(12, -34, 9800));
    expect(sensor.getGravity()).toEqual({ x: 12, y: -34, z: 9800 });

    // A later notification replaces the previous reading.
    emitAccel(accelBytes(0, 0, 9810));
    expect(sensor.getGravity()).toEqual({ x: 0, y: 0, z: 9810 });
  });

  it('surfaces an unexpected GATT disconnect as "disconnected" and clears gravity, instead of freezing on the last value', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
    const { transport, emitAccel, emitDisconnect } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    await sensor.start();
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
    const { transport, emitAccel, emitDisconnect } = fakeTransport();
    const sensor = createEasyLevelSensor(transport);
    expect(sensor.getLastSampleAt()).toBeNull();

    await sensor.start();
    // Connected, but no notification has arrived yet — still no timestamp.
    expect(sensor.getLastSampleAt()).toBeNull();

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
    });

    // A later notification replaces the previous status, same as gravity.
    emitStatus(statusBytes(3000, 0));
    expect(sensor.getStatus()).toEqual({
      firmwareTier: 1,
      batteryPercent: 100,
      temperatureCelsius: 25,
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
    const { transport, emitAccel } = fakeTransport();
    const connectSpy = vi.spyOn(transport, 'connect');
    const sensor = createEasyLevelSensor(transport);

    expect(await sensor.reconnect('fake-device-id')).toBe('granted');
    expect(connectSpy).not.toHaveBeenCalled();
    expect(sensor.getDeviceId()).toBe('fake-device-id');

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
