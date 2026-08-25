import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createEasyLevelSensor,
  isWebBluetoothSupported,
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

/** A controllable stand-in for `createWebBluetoothTransport()` (#116) — no
 * real `navigator.bluetooth` involved, so the state machine is fully
 * testable without hardware or a browser. */
function fakeTransport(): {
  transport: EasyLevelTransport;
  emitAccel(bytes: Uint8Array): void;
  emitDisconnect(): void;
  connection: EasyLevelConnection;
} {
  let accelHandler: ((view: DataView) => void) | null = null;
  let disconnectHandler: (() => void) | null = null;
  const connection: EasyLevelConnection = {
    subscribeAccel: async (onData) => {
      accelHandler = onData;
    },
    subscribeStatus: async () => {
      // No status characteristic in this fake — exercises the
      // best-effort try/catch path when it throws in other tests.
    },
    disconnect: vi.fn(),
  };
  return {
    transport: {
      connect: async (onDisconnect) => {
        disconnectHandler = onDisconnect;
        return connection;
      },
    },
    emitAccel: (bytes) => accelHandler?.(new DataView(bytes.buffer)),
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
      subscribeAccel: async () => {},
      subscribeStatus: () => Promise.reject(new Error('no such characteristic')),
      disconnect: vi.fn(),
    };
    const transport: EasyLevelTransport = { connect: async () => connection };
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
