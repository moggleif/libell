import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSimulatedXparkleTransport,
  isRememberedXparkleDeviceUsable,
  simulatedXparkleParameters,
  SIMULATED_XPARKLE_DEVICE_ID,
  SIMULATED_XPARKLE_DROP_AFTER_MS,
  SIMULATED_XPARKLE_OUTAGE_MS,
  xparkleSimulationMode,
} from './xparkleSimulator';
import { createXparkleSensor } from './xparkleSensor';
import { parseLivePayload } from './xparkleProtocol';

describe('xparkleSimulationMode (#271)', () => {
  it('is off without the flag', () => {
    expect(xparkleSimulationMode('')).toBe('off');
    expect(xparkleSimulationMode('?demo')).toBe('off');
  });

  it('reads the three simulated behaviours off the flag', () => {
    expect(xparkleSimulationMode('?xparkle-sim')).toBe('steady');
    expect(xparkleSimulationMode('?xparkle-sim=1')).toBe('steady');
    expect(xparkleSimulationMode('?xparkle-sim=drop')).toBe('drop');
    expect(xparkleSimulationMode('?xparkle-sim=badpassword')).toBe('badpassword');
  });

  it('composes with ?demo without either implying the other', () => {
    expect(xparkleSimulationMode('?demo&xparkle-sim=drop')).toBe('drop');
  });
});

describe('a remembered device belongs to one mode (#223’s lesson, #271)', () => {
  it('never pairs a simulated id with the real transport, or the reverse', () => {
    // Attempting the mismatched pairing cannot succeed, and failing to
    // check strands the app on "unavailable" with an auto-retry that can
    // never win.
    expect(isRememberedXparkleDeviceUsable(SIMULATED_XPARKLE_DEVICE_ID, 'steady')).toBe(true);
    expect(isRememberedXparkleDeviceUsable(SIMULATED_XPARKLE_DEVICE_ID, 'off')).toBe(false);
    expect(isRememberedXparkleDeviceUsable('real-device-id', 'off')).toBe(true);
    expect(isRememberedXparkleDeviceUsable('real-device-id', 'drop')).toBe(false);
  });
});

describe('the simulated box (#271)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('answers reads with a real-format payload, on demand rather than on a timer', async () => {
    const transport = createSimulatedXparkleTransport('steady');
    const connection = await transport.connect(() => {});

    const first = await connection.readLive();
    expect(first).not.toBeNull();
    const reading = parseLivePayload(first!);
    // The same synthetic tilt `?demo` and the EasyLevel simulator use, so
    // the two boxes can be compared screen-for-screen.
    expect(reading?.rollDeg).toBeCloseTo(-1.2, 1);
    expect(reading?.pitchDeg).toBeCloseTo(-0.35, 1);
    expect(reading?.batteryPercent).toBe(62);
  });

  it('moves a little between reads, so a live screen visibly updates', async () => {
    const transport = createSimulatedXparkleTransport('steady');
    const connection = await transport.connect(() => {});
    const values = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const view = await connection.readLive();
      values.add(parseLivePayload(view!)!.rollDeg);
    }
    expect(values.size).toBeGreaterThan(1);
  });

  it('rejects a write that is not a command frame', async () => {
    const transport = createSimulatedXparkleTransport('steady');
    const connection = await transport.connect(() => {});
    await expect(connection.write(Uint8Array.from([1, 2, 3]))).rejects.toThrow();
  });
});

describe('driving the real adapter with the simulated box (#271)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('connects, polls, and reports a tilt through the untouched adapter', async () => {
    const sensor = createXparkleSensor(createSimulatedXparkleTransport('steady'));

    expect(await sensor.start()).toBe('granted');
    await vi.advanceTimersByTimeAsync(600);

    expect(sensor.getGravity()).not.toBeNull();
    expect(sensor.getReading()?.batteryPercent).toBe(62);
    expect(sensor.getLastSampleAt()).not.toBeNull();
  });

  it('completes the login handshake and reports the box’s stored orientation', async () => {
    const sensor = createXparkleSensor(createSimulatedXparkleTransport('steady'));
    await sensor.start();
    await vi.advanceTimersByTimeAsync(100);

    expect(sensor.isPasswordRejected()).toBe(false);
    expect(sensor.getOrientation()).toBe(
      ['front', 'rear', 'left', 'right'][simulatedXparkleParameters()!.installationOrientation],
    );
  });

  it('reaches the wrong-password state deliberately, without owning a box', async () => {
    // The case most likely to hit a real user first — a box whose password
    // was changed in the vendor app — and the least likely to be right on
    // the first try.
    const sensor = createXparkleSensor(createSimulatedXparkleTransport('badpassword'));
    await sensor.start();
    await vi.advanceTimersByTimeAsync(100);

    expect(sensor.isPasswordRejected()).toBe(true);
  });

  it('loses the link in drop mode, then recovers once the outage passes', async () => {
    const transport = createSimulatedXparkleTransport('drop');
    const sensor = createXparkleSensor(transport);
    await sensor.start();
    await vi.advanceTimersByTimeAsync(600);
    expect(sensor.getGravity()).not.toBeNull();

    await vi.advanceTimersByTimeAsync(SIMULATED_XPARKLE_DROP_AFTER_MS);
    expect(sensor.getState()).toBe('disconnected');
    expect(sensor.getGravity()).toBeNull();

    // Still out of range: a reconnect resolves null rather than rejecting,
    // exactly like the real transport's own catch.
    expect(await sensor.reconnect(SIMULATED_XPARKLE_DEVICE_ID)).toBe('disconnected');

    await vi.advanceTimersByTimeAsync(SIMULATED_XPARKLE_OUTAGE_MS);
    expect(await sensor.reconnect(SIMULATED_XPARKLE_DEVICE_ID)).toBe('granted');
    await vi.advanceTimersByTimeAsync(600);
    expect(sensor.getGravity()).not.toBeNull();
  });

  it('never reconnects to an id that is not the simulated box', async () => {
    const sensor = createXparkleSensor(createSimulatedXparkleTransport('steady'));
    expect(await sensor.reconnect('some-real-device')).toBe('disconnected');
  });
});
