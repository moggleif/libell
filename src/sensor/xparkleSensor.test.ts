import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createXparkleSensor,
  createXparkleWebBluetoothTransport,
  XPARKLE_ADVERTISEMENT_WAIT_MS,
  XPARKLE_DESCRIPTOR,
  XPARKLE_POLL_INTERVAL_MS,
  XPARKLE_READ_TIMEOUT_MS,
  type XparkleConnection,
  type XparkleTransport,
} from './xparkleSensor';
import { buildCommandFrame, buildResetZero, XPARKLE_COMMAND } from './xparkleProtocol';

/** A live payload: flags, two big-endian 1/100° magnitudes, battery. */
function livePayload(pitchHundredths: number, rollHundredths: number, battery = 80): DataView {
  const bytes = Uint8Array.from([
    1,
    (pitchHundredths >> 8) & 0xff,
    pitchHundredths & 0xff,
    1,
    (rollHundredths >> 8) & 0xff,
    rollHundredths & 0xff,
    battery,
  ]);
  return new DataView(bytes.buffer);
}

/**
 * A fake box. Timers are injected so the poll loop runs exactly as many
 * times as a test says, with no real waiting anywhere.
 */
function fakeBox(overrides: Partial<XparkleConnection> = {}) {
  const writes: Uint8Array[] = [];
  let notify: ((view: DataView) => void) | null = null;
  let reads = 0;
  const connection: XparkleConnection = {
    deviceId: 'xparkle-1',
    subscribeNotify: (onData) => {
      notify = onData;
      return Promise.resolve();
    },
    readLive: () => {
      reads += 1;
      return Promise.resolve(livePayload(325, 150));
    },
    write: (frame) => {
      writes.push(frame);
      return Promise.resolve();
    },
    disconnect: () => {},
    ...overrides,
  };
  return {
    connection,
    writes,
    reads: () => reads,
    /** Deliver a command reply, as the box would on `fff4`. */
    reply: (frame: Uint8Array) => notify?.(new DataView(frame.buffer.slice(0))),
  };
}

/** A timer queue the test drives by hand. */
function fakeTimers() {
  const pending = new Map<number, () => void>();
  let nextId = 1;
  return {
    setTimer: (handler: () => void, _ms: number) => {
      const id = nextId++;
      pending.set(id, handler);
      return id;
    },
    clearTimer: (id: number) => void pending.delete(id),
    /** Run every currently-pending timer once. */
    async flush() {
      for (const [id, handler] of [...pending]) {
        pending.delete(id);
        handler();
      }
      await Promise.resolve();
      await Promise.resolve();
    },
    count: () => pending.size,
  };
}

function makeTransport(box = fakeBox()): { transport: XparkleTransport; box: typeof box } {
  return {
    box,
    transport: {
      connect: () => Promise.resolve(box.connection),
      reconnect: () => Promise.resolve(box.connection),
    },
  };
}

describe('connecting (#270)', () => {
  it('reaches granted and starts reporting gravity from the first poll', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, { ...timers, now: () => 1000 });

    expect(await sensor.start()).toBe('granted');
    await timers.flush();

    expect(box.reads()).toBeGreaterThanOrEqual(1);
    const gravity = sensor.getGravity();
    expect(gravity).not.toBeNull();
    // 3.25° nose-up and 1.5° left-low, per the payload above.
    expect(sensor.getReading()).toEqual({ pitchDeg: 3.25, rollDeg: 1.5, batteryPercent: 80 });
    expect(sensor.getLastSampleAt()).toBe(1000);
  });

  it('runs the vendor app’s own handshake: password, then parameter query', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, { ...timers, getPassword: () => '1234' });

    await sensor.start();

    expect(box.writes).toHaveLength(2);
    expect(box.writes[0]![2]).toBe(XPARKLE_COMMAND.password);
    // The four digits of the password being offered, one per byte.
    expect([...box.writes[0]!.slice(5, 9)]).toEqual([1, 2, 3, 4]);
    expect(box.writes[1]![2]).toBe(XPARKLE_COMMAND.queryParameters);
  });

  it('reports denied when the picker is cancelled or the connect fails', async () => {
    const timers = fakeTimers();
    const sensor = createXparkleSensor(
      {
        connect: () => Promise.reject(new Error('cancelled')),
        reconnect: () => Promise.resolve(null),
      },
      timers,
    );

    expect(await sensor.start()).toBe('denied');
    expect(sensor.getGravity()).toBeNull();
  });

  it('stays disconnected when a Retry picker is cancelled after the box was lost (#307)', async () => {
    const timers = fakeTimers();
    const sensor = createXparkleSensor(
      {
        connect: () => Promise.reject(new Error('cancelled')),
        reconnect: () => Promise.resolve(null),
      },
      timers,
    );
    await sensor.reconnect('xparkle-1');
    expect(sensor.getState()).toBe('disconnected');

    // Still 'disconnected', so the prompt and its background retry stay.
    expect(await sensor.start()).toBe('disconnected');
  });

  it('still delivers readings when the box answers nothing but the live read', async () => {
    // A firmware that rejects the subscription or the writes must not stop
    // leveling from working: only the live read is actually required.
    const timers = fakeTimers();
    const box = fakeBox({
      subscribeNotify: () => Promise.reject(new Error('no notify')),
      write: () => Promise.reject(new Error('no write')),
    });
    const sensor = createXparkleSensor(makeTransport(box).transport, timers);

    expect(await sensor.start()).toBe('granted');
    await timers.flush();
    expect(sensor.getGravity()).not.toBeNull();
  });
});

describe('the password (#270, open against hardware in #273)', () => {
  it('does not gate readings on the password verdict', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, timers);
    await sensor.start();
    // Byte 4 non-zero: rejected, per the app's own `setPwd(bArr[4] == 0)`.
    box.reply(buildCommandFrame(XPARKLE_COMMAND.password, [1]));
    await timers.flush();

    expect(sensor.isPasswordRejected()).toBe(true);
    // Whether the box then refuses the read is the box's business; if it
    // serves it, Libell shows it rather than withholding guidance.
    expect(sensor.getGravity()).not.toBeNull();
  });

  it('records an accepted password as not rejected', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, timers);
    await sensor.start();
    box.reply(buildCommandFrame(XPARKLE_COMMAND.password, [0]));
    await timers.flush();

    expect(sensor.isPasswordRejected()).toBe(false);
  });

  it('does not send a malformed password frame', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, { ...timers, getPassword: () => 'abc' });

    await sensor.start();

    // Only the parameter query goes out; the codec refused the rest.
    expect(box.writes).toHaveLength(1);
    expect(box.writes[0]![2]).toBe(XPARKLE_COMMAND.queryParameters);
  });
});

describe('the box’s stored orientation (#270)', () => {
  it('reads it for display, and never applies a rotation of its own', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, timers);
    await sensor.start();

    box.reply(
      buildCommandFrame(XPARKLE_COMMAND.queryParameters, [0, 1, 0, 230, 0, 200, 2, 1]).slice(
        0,
      ) as Uint8Array,
    );
    await timers.flush();

    expect(sensor.getOrientation()).toBe('left');
    // The box has already applied that orientation to the angles it
    // reports; rotating again here would name the wrong wheel.
    expect(XPARKLE_DESCRIPTOR.capabilities.mounting).toBe(false);
  });
});

describe('the poll loop (#270)', () => {
  it('keeps reading on its own cadence while connected', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, timers);
    await sensor.start();
    await timers.flush();
    const after = box.reads();

    await timers.flush();
    expect(box.reads()).toBeGreaterThan(after);
    expect(XPARKLE_POLL_INTERVAL_MS).toBe(500);
  });

  it('stops the moment the box is disconnected, rather than reading a dead link', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, timers);
    await sensor.start();
    await timers.flush();

    sensor.disconnect();
    const reads = box.reads();
    await timers.flush();
    await timers.flush();

    expect(box.reads()).toBe(reads);
    expect(sensor.getGravity()).toBeNull();
  });

  it('treats a failed read as a lost link, not a bad packet', async () => {
    const timers = fakeTimers();
    const box = fakeBox({ readLive: () => Promise.reject(new Error('gone')) });
    const sensor = createXparkleSensor(makeTransport(box).transport, timers);
    await sensor.start();
    await timers.flush();

    expect(sensor.getState()).toBe('disconnected');
    expect(sensor.getGravity()).toBeNull();
  });

  it('treats a read that never answers as a lost link too', async () => {
    // Without the timeout the in-flight guard would block the loop
    // forever, and the app would show a frozen reading as if it were live.
    const timers = fakeTimers();
    const box = fakeBox({ readLive: () => new Promise<DataView>(() => {}) });
    const sensor = createXparkleSensor(makeTransport(box).transport, timers);
    await sensor.start();
    await timers.flush();
    await timers.flush();

    expect(sensor.getState()).toBe('disconnected');
    expect(XPARKLE_READ_TIMEOUT_MS).toBeLessThan(XPARKLE_DESCRIPTOR.staleTimeoutMs);
  });

  it('closes the link itself when a read fails, so no half-open link hides the box (#288)', async () => {
    const timers = fakeTimers();
    const disconnect = vi.fn();
    const box = fakeBox({ readLive: () => Promise.reject(new Error('gone')), disconnect });
    const sensor = createXparkleSensor(makeTransport(box).transport, timers);
    await sensor.start();
    await timers.flush();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('closes the link itself when a read never answers (#288)', async () => {
    const timers = fakeTimers();
    const disconnect = vi.fn();
    const box = fakeBox({ readLive: () => new Promise<DataView>(() => {}), disconnect });
    const sensor = createXparkleSensor(makeTransport(box).transport, timers);
    await sensor.start();
    await timers.flush();
    await timers.flush();

    expect(sensor.getState()).toBe('disconnected');
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('leaves a newer link alone when a read on an older one fails late (#288)', async () => {
    const timers = fakeTimers();
    let failOldRead: ((error: Error) => void) | null = null;
    const oldDisconnect = vi.fn();
    const oldBox = fakeBox({
      readLive: () =>
        new Promise<DataView>((_, reject) => {
          failOldRead = reject;
        }),
      disconnect: oldDisconnect,
    });
    const newBox = fakeBox();
    const sensor = createXparkleSensor(
      {
        connect: () => Promise.resolve(oldBox.connection),
        reconnect: () => Promise.resolve(newBox.connection),
      },
      timers,
    );
    await sensor.start();
    expect(await sensor.reconnect('xparkle-1')).toBe('granted');

    failOldRead!(new Error('old link gone'));
    await timers.flush();

    expect(sensor.getState()).toBe('granted');
    expect(oldDisconnect).not.toHaveBeenCalled();
  });

  it('keeps the connection on a payload it cannot parse', async () => {
    // A short or corrupt packet is not a lost link; the staleness timeout
    // is what eventually hides guidance if they keep coming.
    const timers = fakeTimers();
    const box = fakeBox({
      readLive: () => Promise.resolve(new DataView(Uint8Array.from([1, 2]).buffer)),
    });
    const sensor = createXparkleSensor(makeTransport(box).transport, timers);
    await sensor.start();
    await timers.flush();

    expect(sensor.getState()).toBe('granted');
    expect(sensor.getGravity()).toBeNull();
  });

  it('reports a dropped GATT link as disconnected', async () => {
    const timers = fakeTimers();
    const box = fakeBox();
    let onDisconnect: (() => void) | null = null;
    const sensor = createXparkleSensor(
      {
        connect: (handler) => {
          onDisconnect = handler;
          return Promise.resolve(box.connection);
        },
        reconnect: () => Promise.resolve(box.connection),
      },
      timers,
    );
    await sensor.start();
    await timers.flush();

    onDisconnect!();
    expect(sensor.getState()).toBe('disconnected');
    expect(sensor.getGravity()).toBeNull();
  });
});

describe('reconnecting (#130, #270)', () => {
  it('adopts the same box again without a picker', async () => {
    const timers = fakeTimers();
    const reconnect = vi.fn(() => Promise.resolve(fakeBox().connection));
    const sensor = createXparkleSensor(
      { connect: () => Promise.reject(new Error('no gesture')), reconnect },
      timers,
    );

    expect(await sensor.reconnect('xparkle-1')).toBe('granted');
    expect(reconnect).toHaveBeenCalledWith('xparkle-1', expect.any(Function));
    expect(sensor.getDeviceId()).toBe('xparkle-1');
  });

  it('reports disconnected when the box cannot be reached silently', async () => {
    const timers = fakeTimers();
    const sensor = createXparkleSensor(
      {
        connect: () => Promise.reject(new Error('no gesture')),
        reconnect: () => Promise.resolve(null),
      },
      timers,
    );

    expect(await sensor.reconnect('xparkle-1')).toBe('disconnected');
  });
});

describe('a learned mounting (#293)', () => {
  it('turns the box’s axes into the vehicle’s before the leveling math sees them', async () => {
    const timers = fakeTimers();
    let mapping: { swap: boolean; pitchSign: 1 | -1; rollSign: 1 | -1 } | null = null;
    const sensor = createXparkleSensor(makeTransport().transport, {
      ...timers,
      getAxisMapping: () => mapping,
    });
    await sensor.start();
    await timers.flush();
    const raw = sensor.getGravity()!;
    expect(raw.x).toBeCloseTo(Math.tan((1.5 * Math.PI) / 180));
    expect(raw.y).toBeCloseTo(Math.tan((3.25 * Math.PI) / 180));

    // Takes effect on the next reading, with no reconnect.
    mapping = { swap: true, pitchSign: -1, rollSign: 1 };
    await timers.flush();
    const mapped = sensor.getGravity()!;
    expect(mapped.x).toBeCloseTo(Math.tan((3.25 * Math.PI) / 180));
    expect(mapped.y).toBeCloseTo(-Math.tan((1.5 * Math.PI) / 180));
    // The raw reading stays raw: learning a new mounting needs it.
    expect(sensor.getReading()?.pitchDeg).toBeCloseTo(3.25);
  });
});

describe('zeroing the box (#290)', () => {
  it('never zeroes the box on its own: connecting sends only the login handshake', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, timers);
    await sensor.start();
    await timers.flush();

    expect(box.writes.map((frame) => frame[2])).not.toContain(XPARKLE_COMMAND.resetZero);
  });

  it('sends the box its own resetZero command when asked', async () => {
    const timers = fakeTimers();
    const { transport, box } = makeTransport();
    const sensor = createXparkleSensor(transport, timers);
    await sensor.start();

    expect(await sensor.zeroBox()).toBe(true);
    expect([...box.writes.at(-1)!]).toEqual([...buildResetZero()]);
  });

  it('reports failure, rather than success, when nothing is connected or the write fails', async () => {
    const timers = fakeTimers();
    const idle = createXparkleSensor(makeTransport().transport, timers);
    expect(await idle.zeroBox()).toBe(false);

    const box = fakeBox({ write: () => Promise.reject(new Error('gone')) });
    const sensor = createXparkleSensor(makeTransport(box).transport, timers);
    await sensor.start();
    expect(await sensor.zeroBox()).toBe(false);
  });
});

describe('the Xparkle descriptor (#270)', () => {
  it('declares only what this protocol actually reports', () => {
    expect(XPARKLE_DESCRIPTOR.capabilities).toEqual({
      battery: true,
      temperature: false,
      firmwareVersion: false,
      mounting: false,
      installCalibration: true,
      debugBytes: false,
      reportedOrientation: true,
      learnMounting: true,
    });
  });

  it('names the product without any catalogue involvement', () => {
    expect(XPARKLE_DESCRIPTOR.displayName).toBe('Xparkle RVS01');
    expect(XPARKLE_DESCRIPTOR.id).toBe('xparkle');
  });
});

/** A device as `getDevices()` returns it — a real EventTarget, so
 * `advertisementreceived` can be dispatched at it. */
function fakeRememberedDevice(options: { watch?: boolean; advertises?: boolean } = {}) {
  const calls: string[] = [];
  const characteristic = {
    addEventListener: vi.fn(),
    startNotifications: vi.fn().mockResolvedValue(undefined),
    readValue: vi.fn(),
    writeValue: vi.fn().mockResolvedValue(undefined),
  };
  const service = { getCharacteristic: vi.fn().mockResolvedValue(characteristic) };
  const server = {
    connect: vi.fn(() => {
      calls.push('connect');
      return Promise.resolve(server);
    }),
    disconnect: vi.fn(),
    getPrimaryService: vi.fn().mockResolvedValue(service),
  };
  const device = Object.assign(new EventTarget(), {
    id: 'xparkle-1',
    gatt: server,
  }) as EventTarget & BluetoothDevice & { signal?: AbortSignal };
  if (options.watch !== false) {
    device.watchAdvertisements = vi.fn((watchOptions?: { signal?: AbortSignal }) => {
      calls.push('watch');
      device.signal = watchOptions?.signal;
      if (options.advertises !== false) {
        queueMicrotask(() => device.dispatchEvent(new Event('advertisementreceived')));
      }
      return Promise.resolve();
    });
  }
  Object.defineProperty(globalThis, 'navigator', {
    value: { bluetooth: { getDevices: () => Promise.resolve([device]) } },
    configurable: true,
  });
  return { device, server, calls };
}

describe('the silent reconnect waits to hear the box first (#288)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('watches for an advertisement before connecting, and stops watching after', async () => {
    const { device, calls } = fakeRememberedDevice();
    const connection = await createXparkleWebBluetoothTransport().reconnect('xparkle-1', vi.fn());

    expect(connection).not.toBeNull();
    expect(calls).toEqual(['watch', 'connect']);
    expect(device.signal?.aborted).toBe(true);
  });

  it('still tries the connect when no advertisement arrives in time', async () => {
    vi.useFakeTimers();
    const { calls } = fakeRememberedDevice({ advertises: false });
    const pending = createXparkleWebBluetoothTransport().reconnect('xparkle-1', vi.fn());
    await vi.advanceTimersByTimeAsync(XPARKLE_ADVERTISEMENT_WAIT_MS);

    expect(await pending).not.toBeNull();
    expect(calls).toEqual(['watch', 'connect']);
  });

  it('connects directly where the browser cannot watch advertisements', async () => {
    const { calls } = fakeRememberedDevice({ watch: false });
    const connection = await createXparkleWebBluetoothTransport().reconnect('xparkle-1', vi.fn());

    expect(connection).not.toBeNull();
    expect(calls).toEqual(['connect']);
  });
});

describe('Retry without getDevices() (#288, Chrome on Android)', () => {
  it('reconnects to the box picked this session even where getDevices() is missing', async () => {
    const { device, calls } = fakeRememberedDevice({ watch: false });
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { requestDevice: vi.fn().mockResolvedValue(device) } },
      configurable: true,
    });
    const transport = createXparkleWebBluetoothTransport();
    await transport.connect(vi.fn());
    const connection = await transport.reconnect('xparkle-1', vi.fn());
    expect(connection).not.toBeNull();
    expect(calls).toEqual(['connect', 'connect']);
  });

  it('returns nothing, silently, when no box was picked and getDevices() is missing', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: { requestDevice: vi.fn() } },
      configurable: true,
    });
    expect(await createXparkleWebBluetoothTransport().reconnect('xparkle-1', vi.fn())).toBeNull();
  });
});
