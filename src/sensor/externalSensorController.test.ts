import { describe, expect, it, vi } from 'vitest';
import {
  createExternalSensorController,
  type ExternalSensor,
  type ExternalSensorControllerOptions,
} from './externalSensorController';
import { EXTERNAL_SENSOR_AUTO_RETRY_INTERVAL_MS } from './sensorFallback';
import type { SensorSource } from '../domain/settings';
import type { OrientationSensor, SensorState } from './orientation';

/** A fake external adapter — no Web Bluetooth, no timers, no DOM. */
function fakeExternal(source: SensorSource, overrides: Partial<ExternalSensor> = {}) {
  const calls = { start: 0, reconnect: [] as string[], disconnect: 0 };
  let state: SensorState = 'idle';
  const sensor: ExternalSensor = {
    start: () => {
      calls.start += 1;
      state = 'granted';
      return Promise.resolve(state);
    },
    reconnect: (deviceId) => {
      calls.reconnect.push(deviceId);
      state = 'granted';
      return Promise.resolve(state);
    },
    disconnect: () => {
      calls.disconnect += 1;
      state = 'disconnected';
    },
    getDeviceId: () => 'device-1',
    getState: () => state,
    getGravity: () => null,
    getSource: () => source,
    getLastSampleAt: () => null,
    ...overrides,
  };
  return { sensor, calls };
}

const phoneSensor: OrientationSensor = {
  start: () => Promise.resolve('granted'),
  getState: () => 'granted',
  getGravity: () => null,
  getSource: () => 'phone',
  getLastSampleAt: () => null,
};

function makeController(
  overrides: Partial<ExternalSensorControllerOptions<ExternalSensor>> = {},
  sensorsBySource: Record<string, ExternalSensor> = {},
) {
  const remembered: Record<string, string> = {};
  const calls = {
    rememberedSources: [] as SensorSource[],
    levelScreen: 0,
    indicators: 0,
    status: 0,
  };
  const options: ExternalSensorControllerOptions<ExternalSensor> = {
    phoneSensor,
    createSensor: (source) => sensorsBySource[source] ?? null,
    loadDeviceId: (source) => remembered[source] ?? null,
    saveDeviceId: (source, deviceId) => void (remembered[source] = deviceId),
    isRememberedDeviceUsable: () => true,
    getPreferredSource: () => 'phone',
    rememberSource: (source) => void calls.rememberedSources.push(source),
    onLevelScreenNeeded: () => void (calls.levelScreen += 1),
    onIndicatorsChanged: () => void (calls.indicators += 1),
    onStatusChanged: () => void (calls.status += 1),
    ...overrides,
  };
  return { controller: createExternalSensorController(options), calls, remembered };
}

describe('connecting (#265)', () => {
  it('starts on the phone sensor', () => {
    const { controller } = makeController();
    expect(controller.getActiveSensor()).toBe(phoneSensor);
  });

  it('adopts a source that connects, persists it, and remembers the device', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller, calls, remembered } = makeController({}, { easylevel: easylevel.sensor });

    expect(await controller.connect('easylevel')).toBe('granted');

    expect(controller.getActiveSensor()).toBe(easylevel.sensor);
    expect(calls.rememberedSources).toEqual(['easylevel']);
    expect(remembered.easylevel).toBe('device-1');
    // The level screen may never have been built (a desktop with no phone
    // sensors), and the calibration lamp follows the active source (#131).
    expect(calls.levelScreen).toBe(1);
    expect(calls.indicators).toBe(1);
  });

  it('changes nothing when the connection is refused', async () => {
    const easylevel = fakeExternal('easylevel', {
      start: () => Promise.resolve('denied'),
    });
    const { controller, calls, remembered } = makeController({}, { easylevel: easylevel.sensor });

    expect(await controller.connect('easylevel')).toBe('denied');

    expect(controller.getActiveSensor()).toBe(phoneSensor);
    expect(calls.rememberedSources).toEqual([]);
    expect(remembered.easylevel).toBeUndefined();
    expect(calls.levelScreen).toBe(0);
  });

  it('reports unsupported for a source this build has no adapter for', async () => {
    const { controller } = makeController();
    expect(await controller.connect('easylevel')).toBe('unsupported');
    expect(controller.getActiveSensor()).toBe(phoneSensor);
  });

  it('builds an adapter once and reuses it, so a reconnect keeps its state machine', async () => {
    const easylevel = fakeExternal('easylevel');
    const createSensor = vi.fn(() => easylevel.sensor);
    const { controller } = makeController({ createSensor });

    await controller.connect('easylevel');
    controller.disconnect();
    await controller.connect('easylevel');

    expect(createSensor).toHaveBeenCalledTimes(1);
    expect(controller.getSensor('easylevel')).toBe(easylevel.sensor);
  });
});

describe('never two sources connected at once (#265)', () => {
  it('disconnects the previous source when another one connects', async () => {
    const first = fakeExternal('easylevel');
    const second = fakeExternal('phone');
    const { controller } = makeController(
      {},
      { easylevel: first.sensor, 'other-box': second.sensor },
    );

    await controller.connect('easylevel');
    await controller.connect('other-box' as SensorSource);

    // Otherwise the first keeps delivering samples and its own retry loop
    // keeps firing — invisible, and impossible before a second source.
    expect(first.calls.disconnect).toBe(1);
    expect(controller.getActiveSensor()).toBe(second.sensor);
  });

  it('does not disconnect a source that is reconnecting to itself', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller } = makeController({}, { easylevel: easylevel.sensor });

    await controller.connect('easylevel');
    await controller.connect('easylevel');

    expect(easylevel.calls.disconnect).toBe(0);
  });
});

describe('falling back to the phone (#265)', () => {
  it('disconnects, switches back and persists the choice', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller, calls } = makeController({}, { easylevel: easylevel.sensor });

    await controller.connect('easylevel');
    controller.disconnect();

    expect(easylevel.calls.disconnect).toBe(1);
    expect(controller.getActiveSensor()).toBe(phoneSensor);
    expect(calls.rememberedSources).toEqual(['easylevel', 'phone']);
  });

  it('keeps the remembered device, since disconnect is "not right now" (#130)', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller, remembered } = makeController({}, { easylevel: easylevel.sensor });

    await controller.connect('easylevel');
    controller.disconnect();

    expect(remembered.easylevel).toBe('device-1');
  });

  it('"use phone sensor" is the same switch plus a start, since the tap is the gesture (#134)', async () => {
    const start = vi.fn(() => Promise.resolve<SensorState>('granted'));
    const easylevel = fakeExternal('easylevel');
    const { controller, calls } = makeController(
      { phoneSensor: { ...phoneSensor, start } },
      { easylevel: easylevel.sensor },
    );

    await controller.connect('easylevel');
    controller.usePhoneSensor();

    expect(easylevel.calls.disconnect).toBe(1);
    expect(calls.rememberedSources).toEqual(['easylevel', 'phone']);
    // An external source can take over the whole startup flow, so the
    // phone may never have been started at all.
    expect(start).toHaveBeenCalledOnce();
  });
});

describe('retrying (#134, #211)', () => {
  it('reconnects the active source with its own device id', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller, calls } = makeController({}, { easylevel: easylevel.sensor });

    await controller.connect('easylevel');
    await controller.retry();

    expect(easylevel.calls.reconnect).toEqual(['device-1']);
    expect(calls.status).toBe(1);
  });

  it('falls back to the remembered id when the adapter has none', async () => {
    const easylevel = fakeExternal('easylevel', { getDeviceId: () => null });
    const { controller } = makeController(
      { loadDeviceId: () => 'remembered-1', getPreferredSource: () => 'easylevel' },
      { easylevel: easylevel.sensor },
    );

    await controller.attemptAutoReconnect();
    easylevel.calls.reconnect.length = 0;
    await controller.retry();

    expect(easylevel.calls.reconnect).toEqual(['remembered-1']);
  });

  it('does nothing while the phone is the active source', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller, calls } = makeController({}, { easylevel: easylevel.sensor });

    await controller.retry();

    expect(easylevel.calls.reconnect).toEqual([]);
    expect(calls.status).toBe(0);
  });

  it('auto-retries on its own cadence, and not before it is due', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller } = makeController({}, { easylevel: easylevel.sensor });
    await controller.connect('easylevel');
    easylevel.calls.reconnect.length = 0;

    controller.maybeAutoRetry(1000);
    await Promise.resolve();
    controller.maybeAutoRetry(1000 + EXTERNAL_SENSOR_AUTO_RETRY_INTERVAL_MS - 1);
    await Promise.resolve();
    expect(easylevel.calls.reconnect).toHaveLength(1);

    controller.maybeAutoRetry(1000 + EXTERNAL_SENSOR_AUTO_RETRY_INTERVAL_MS);
    await Promise.resolve();
    expect(easylevel.calls.reconnect).toHaveLength(2);
  });

  it('never stacks attempts while one is still in flight', async () => {
    // `frame()` calls this every animation frame, so without the guard a
    // slow reconnect would pile up behind itself.
    let resolveReconnect: ((state: SensorState) => void) | null = null;
    const easylevel = fakeExternal('easylevel', {
      reconnect: () =>
        new Promise<SensorState>((resolve) => {
          resolveReconnect = resolve;
        }),
    });
    const { controller } = makeController({}, { easylevel: easylevel.sensor });
    await controller.connect('easylevel');

    controller.maybeAutoRetry(1000);
    controller.maybeAutoRetry(1000 + EXTERNAL_SENSOR_AUTO_RETRY_INTERVAL_MS * 5);
    controller.maybeAutoRetry(1000 + EXTERNAL_SENSOR_AUTO_RETRY_INTERVAL_MS * 10);

    expect(resolveReconnect).not.toBeNull();
    resolveReconnect!('granted');
    await Promise.resolve();
  });
});

describe('silent auto-reconnect at app open (#130)', () => {
  it('does nothing when the last session used the phone', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller } = makeController(
      { getPreferredSource: () => 'phone', loadDeviceId: () => 'device-1' },
      { easylevel: easylevel.sensor },
    );

    expect(await controller.attemptAutoReconnect()).toBe(false);
    expect(easylevel.calls.reconnect).toEqual([]);
  });

  it('does nothing when no device is remembered', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller } = makeController(
      { getPreferredSource: () => 'easylevel', loadDeviceId: () => null },
      { easylevel: easylevel.sensor },
    );

    expect(await controller.attemptAutoReconnect()).toBe(false);
  });

  it('does nothing when the remembered device cannot be reached in this mode (#223)', async () => {
    // A box remembered under one simulation mode can never be found in
    // another; attempting it would strand the app on "unavailable" with an
    // auto-retry that can never succeed.
    const easylevel = fakeExternal('easylevel');
    const { controller } = makeController(
      {
        getPreferredSource: () => 'easylevel',
        loadDeviceId: () => 'device-1',
        isRememberedDeviceUsable: () => false,
      },
      { easylevel: easylevel.sensor },
    );

    expect(await controller.attemptAutoReconnect()).toBe(false);
    expect(easylevel.calls.reconnect).toEqual([]);
  });

  it('takes over the startup flow on success', async () => {
    const easylevel = fakeExternal('easylevel');
    const { controller, calls } = makeController(
      { getPreferredSource: () => 'easylevel', loadDeviceId: () => 'device-1' },
      { easylevel: easylevel.sensor },
    );

    expect(await controller.attemptAutoReconnect()).toBe(true);
    expect(controller.getActiveSensor()).toBe(easylevel.sensor);
    expect(calls.levelScreen).toBe(1);
    expect(calls.status).toBe(1);
    expect(calls.indicators).toBe(1);
  });

  it('still takes over when the box does not answer, so its state is shown honestly', async () => {
    // A failed attempt renders 'disconnected' through the ordinary
    // per-frame loop — the same "connection lost" hint a live BLE drop
    // shows — rather than silently pretending the phone was chosen.
    const easylevel = fakeExternal('easylevel', {
      reconnect: () => Promise.resolve('disconnected'),
    });
    const { controller } = makeController(
      { getPreferredSource: () => 'easylevel', loadDeviceId: () => 'device-1' },
      { easylevel: easylevel.sensor },
    );

    expect(await controller.attemptAutoReconnect()).toBe(true);
    expect(controller.getActiveSensor()).toBe(easylevel.sensor);
  });

  it('stands down when the platform cannot support the source at all', async () => {
    const easylevel = fakeExternal('easylevel', {
      reconnect: () => Promise.resolve('unsupported'),
    });
    const { controller } = makeController(
      { getPreferredSource: () => 'easylevel', loadDeviceId: () => 'device-1' },
      { easylevel: easylevel.sensor },
    );

    expect(await controller.attemptAutoReconnect()).toBe(false);
    expect(controller.getActiveSensor()).toBe(phoneSensor);
  });
});
