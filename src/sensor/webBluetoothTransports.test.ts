import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createWebBluetoothTransport,
  EASYLEVEL_ACCEL_CHARACTERISTIC_UUID,
  EASYLEVEL_SERVICE_UUID,
  EASYLEVEL_STATUS_CHARACTERISTIC_UUID,
} from './easyLevelTransport';
import { createXparkleWebBluetoothTransport } from './xparkleTransport';
import {
  XPARKLE_DEVICE_NAME_FRAGMENTS,
  XPARKLE_LIVE_CHARACTERISTIC_UUID,
  XPARKLE_NOTIFY_CHARACTERISTIC_UUID,
  XPARKLE_SERVICE_UUID,
  XPARKLE_WRITE_CHARACTERISTIC_UUID,
} from './xparkleProtocol';

/**
 * Regression tests for #418: the connect, teardown, retry and reconnect
 * behaviour both real Web Bluetooth transports share, pinned once and run
 * against each, so moving them onto one helper cannot change either.
 */

interface FakeCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications: ReturnType<typeof vi.fn>;
  readValue: ReturnType<typeof vi.fn>;
  writeValue: ReturnType<typeof vi.fn>;
}

function fakeCharacteristic(): FakeCharacteristic {
  return Object.assign(new EventTarget(), {
    value: undefined as DataView | undefined,
    startNotifications: vi.fn().mockResolvedValue(undefined),
    readValue: vi.fn().mockResolvedValue(new DataView(new ArrayBuffer(7))),
    writeValue: vi.fn().mockResolvedValue(undefined),
  });
}

/** A box as the picker or `getDevices()` hands it over. Every GATT step
 * is recorded in `calls`, so a test can assert the order of events. */
function fakeDevice(id: string, options: { serviceFails?: boolean } = {}) {
  const calls: string[] = [];
  const characteristics = new Map<string, FakeCharacteristic>();
  const service = {
    getCharacteristic: vi.fn((uuid: string) => {
      if (!characteristics.has(uuid)) characteristics.set(uuid, fakeCharacteristic());
      return Promise.resolve(characteristics.get(uuid)!);
    }),
  };
  const server = {
    connect: vi.fn(() => {
      calls.push('connect');
      return Promise.resolve(server);
    }),
    disconnect: vi.fn(() => {
      calls.push('gatt.disconnect');
    }),
    getPrimaryService: vi.fn((uuid: string) => {
      calls.push(`service ${uuid}`);
      return options.serviceFails
        ? Promise.reject(new Error('service discovery failed'))
        : Promise.resolve(service);
    }),
  };
  const device = Object.assign(new EventTarget(), { id, gatt: server }) as unknown as EventTarget &
    BluetoothDevice;
  const add = device.addEventListener.bind(device);
  const remove = device.removeEventListener.bind(device);
  device.addEventListener = (type: string, listener: EventListenerOrEventListenerObject | null) => {
    calls.push(`listen ${type}`);
    add(type, listener);
  };
  device.removeEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
  ) => {
    calls.push(`unlisten ${type}`);
    remove(type, listener);
  };
  return { device, server, calls, characteristics };
}

function bluetooth(value: Partial<Bluetooth>): void {
  Object.defineProperty(globalThis, 'navigator', {
    value: { bluetooth: value },
    configurable: true,
  });
}

const TRANSPORTS = [
  { name: 'Xparkle', create: () => createXparkleWebBluetoothTransport() },
  { name: 'EasyLevel', create: () => createWebBluetoothTransport() },
] as const;

describe.each(TRANSPORTS)('the $name Web Bluetooth transport (#418 regression)', ({ create }) => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('connect', () => {
    it('listens for a dropped link before it connects, and reports the picked box’s id', async () => {
      const { device, calls } = fakeDevice('box-1');
      bluetooth({ requestDevice: vi.fn().mockResolvedValue(device) });

      const connection = await create().connect(vi.fn());

      expect(connection.deviceId).toBe('box-1');
      expect(calls.slice(0, 2)).toEqual(['listen gattserverdisconnected', 'connect']);
    });

    it('reports a dropped link to the caller', async () => {
      const { device } = fakeDevice('box-1');
      bluetooth({ requestDevice: vi.fn().mockResolvedValue(device) });
      const onDisconnect = vi.fn();
      await create().connect(onDisconnect);

      device.dispatchEvent(new Event('gattserverdisconnected'));

      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('never reports a deliberate disconnect as a drop (#219)', async () => {
      const { device, server, calls } = fakeDevice('box-1');
      server.disconnect.mockImplementation(() => {
        calls.push('gatt.disconnect');
        device.dispatchEvent(new Event('gattserverdisconnected'));
      });
      bluetooth({ requestDevice: vi.fn().mockResolvedValue(device) });
      const onDisconnect = vi.fn();
      const connection = await create().connect(onDisconnect);

      connection.disconnect();

      expect(onDisconnect).not.toHaveBeenCalled();
      expect(calls.slice(-2)).toEqual(['unlisten gattserverdisconnected', 'gatt.disconnect']);
    });

    it('closes the link, listener first, when setup fails after the connect (#219)', async () => {
      const { device, calls } = fakeDevice('box-1', { serviceFails: true });
      bluetooth({ requestDevice: vi.fn().mockResolvedValue(device) });
      const onDisconnect = vi.fn();

      await expect(create().connect(onDisconnect)).rejects.toThrow();

      expect(calls.filter((call) => call === 'gatt.disconnect')).toHaveLength(2);
      expect(calls.indexOf('unlisten gattserverdisconnected')).toBeLessThan(
        calls.indexOf('gatt.disconnect'),
      );
      expect(onDisconnect).not.toHaveBeenCalled();
    });

    it('rejects when the browser hands back a device with no GATT server', async () => {
      const device = Object.assign(new EventTarget(), { id: 'box-1' }) as EventTarget &
        BluetoothDevice;
      bluetooth({ requestDevice: vi.fn().mockResolvedValue(device) });

      await expect(create().connect(vi.fn())).rejects.toThrow();
    });

    it('does not open the picker a second time when the user cancels it', async () => {
      const requestDevice = vi.fn().mockRejectedValue(new Error('User cancelled'));
      bluetooth({ requestDevice });

      await expect(create().connect(vi.fn())).rejects.toThrow();
      expect(requestDevice).toHaveBeenCalledTimes(1);
    });

    it('tries once more on the same box, without a second picker, when the first connect fails', async () => {
      const { device, server, calls } = fakeDevice('box-1');
      server.connect.mockImplementationOnce(() => {
        calls.push('connect');
        return Promise.reject(new Error('GATT Server is disconnected.'));
      });
      const requestDevice = vi.fn().mockResolvedValue(device);
      bluetooth({ requestDevice });

      const connection = await create().connect(vi.fn());

      expect(connection.deviceId).toBe('box-1');
      expect(requestDevice).toHaveBeenCalledTimes(1);
      expect(server.connect).toHaveBeenCalledTimes(2);
    });
  });

  describe('reconnect', () => {
    it('resolves null when navigator.bluetooth is missing', async () => {
      Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
      expect(await create().reconnect('box-1', vi.fn())).toBeNull();
    });

    it('finds the remembered box among several in getDevices()', async () => {
      const wanted = fakeDevice('box-1');
      const other = fakeDevice('box-2');
      bluetooth({ getDevices: vi.fn().mockResolvedValue([other.device, wanted.device]) });

      const connection = await create().reconnect('box-1', vi.fn());

      expect(connection?.deviceId).toBe('box-1');
      expect(other.server.connect).not.toHaveBeenCalled();
    });

    it('resolves null, never rejects, when getDevices() itself fails', async () => {
      bluetooth({ getDevices: vi.fn().mockRejectedValue(new Error('not allowed')) });
      await expect(create().reconnect('box-1', vi.fn())).resolves.toBeNull();
    });

    it('prefers the box picked this session over asking getDevices()', async () => {
      const { device } = fakeDevice('box-1');
      const getDevices = vi.fn().mockResolvedValue([]);
      bluetooth({ requestDevice: vi.fn().mockResolvedValue(device), getDevices });
      const transport = create();
      await transport.connect(vi.fn());

      const connection = await transport.reconnect('box-1', vi.fn());

      expect(connection?.deviceId).toBe('box-1');
      expect(getDevices).not.toHaveBeenCalled();
    });

    it('asks getDevices() for a different box than the one picked this session', async () => {
      const picked = fakeDevice('box-1');
      const remembered = fakeDevice('box-2');
      bluetooth({
        requestDevice: vi.fn().mockResolvedValue(picked.device),
        getDevices: vi.fn().mockResolvedValue([remembered.device]),
      });
      const transport = create();
      await transport.connect(vi.fn());

      const connection = await transport.reconnect('box-2', vi.fn());

      expect(connection?.deviceId).toBe('box-2');
    });

    it('reports a later drop of the reconnected link, and not a deliberate disconnect', async () => {
      const { device, server } = fakeDevice('box-1');
      server.disconnect.mockImplementation(() =>
        device.dispatchEvent(new Event('gattserverdisconnected')),
      );
      bluetooth({ getDevices: vi.fn().mockResolvedValue([device]) });
      const onDisconnect = vi.fn();
      const connection = await create().reconnect('box-1', onDisconnect);

      device.dispatchEvent(new Event('gattserverdisconnected'));
      expect(onDisconnect).toHaveBeenCalledTimes(1);

      connection!.disconnect();
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});

describe('the Xparkle transport’s own GATT wiring (#418 regression)', () => {
  async function connectXparkle() {
    const box = fakeDevice('xparkle-1');
    const requestDevice = vi.fn().mockResolvedValue(box.device);
    bluetooth({ requestDevice });
    const connection = await createXparkleWebBluetoothTransport().connect(vi.fn());
    return { ...box, requestDevice, connection };
  }

  it('lists the box by its name prefixes and by its service', async () => {
    const { requestDevice } = await connectXparkle();
    expect(requestDevice).toHaveBeenCalledWith({
      filters: [
        ...XPARKLE_DEVICE_NAME_FRAGMENTS.map((namePrefix) => ({ namePrefix })),
        { services: [XPARKLE_SERVICE_UUID] },
      ],
      optionalServices: [XPARKLE_SERVICE_UUID],
    });
  });

  it('opens the box’s service and its live and write characteristics before handing over', async () => {
    const { server, characteristics } = await connectXparkle();
    expect(server.getPrimaryService).toHaveBeenCalledWith(XPARKLE_SERVICE_UUID);
    expect([...characteristics.keys()]).toEqual([
      XPARKLE_LIVE_CHARACTERISTIC_UUID,
      XPARKLE_WRITE_CHARACTERISTIC_UUID,
    ]);
  });

  it('reads the live characteristic and writes frames to the write characteristic', async () => {
    const { connection, characteristics } = await connectXparkle();
    const reading = new DataView(new ArrayBuffer(7));
    characteristics.get(XPARKLE_LIVE_CHARACTERISTIC_UUID)!.readValue.mockResolvedValue(reading);
    const frame = Uint8Array.from([0xa5, 1, 2]);

    expect(await connection.readLive()).toBe(reading);
    await connection.write(frame);

    expect(characteristics.get(XPARKLE_WRITE_CHARACTERISTIC_UUID)!.writeValue).toHaveBeenCalledWith(
      frame,
    );
  });

  it('subscribes to the notify characteristic and passes on every value it carries', async () => {
    const { connection, characteristics } = await connectXparkle();
    const onData = vi.fn();
    await connection.subscribeNotify(onData);
    const notify = characteristics.get(XPARKLE_NOTIFY_CHARACTERISTIC_UUID)!;
    expect(notify.startNotifications).toHaveBeenCalled();

    const reply = new DataView(new ArrayBuffer(4));
    notify.value = reply;
    notify.dispatchEvent(new Event('characteristicvaluechanged'));
    notify.value = undefined;
    notify.dispatchEvent(new Event('characteristicvaluechanged'));

    expect(onData).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledWith(reply);
  });
});

describe('the EasyLevel transport’s own GATT wiring (#418 regression)', () => {
  async function connectEasyLevel() {
    const box = fakeDevice('easylevel-1');
    bluetooth({ requestDevice: vi.fn().mockResolvedValue(box.device) });
    const connection = await createWebBluetoothTransport().connect(vi.fn());
    return { ...box, connection };
  }

  it('opens no characteristic until the sensor subscribes', async () => {
    const { server, characteristics } = await connectEasyLevel();
    expect(server.getPrimaryService).toHaveBeenCalledWith(EASYLEVEL_SERVICE_UUID);
    expect(characteristics.size).toBe(0);
  });

  it.each([
    ['subscribeAccel', EASYLEVEL_ACCEL_CHARACTERISTIC_UUID],
    ['subscribeStatus', EASYLEVEL_STATUS_CHARACTERISTIC_UUID],
  ] as const)(
    '%s starts notifications on its own characteristic and passes on every value',
    async (method, uuid) => {
      const { connection, characteristics } = await connectEasyLevel();
      const onData = vi.fn();
      await connection[method](onData);
      const characteristic = characteristics.get(uuid)!;
      expect([...characteristics.keys()]).toEqual([uuid]);
      expect(characteristic.startNotifications).toHaveBeenCalled();

      const packet = new DataView(new ArrayBuffer(12));
      characteristic.value = packet;
      characteristic.dispatchEvent(new Event('characteristicvaluechanged'));
      characteristic.value = undefined;
      characteristic.dispatchEvent(new Event('characteristicvaluechanged'));

      expect(onData).toHaveBeenCalledTimes(1);
      expect(onData).toHaveBeenCalledWith(packet);
    },
  );
});
