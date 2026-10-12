import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSimulatedEasyLevelTransport,
  SIMULATED_DROP_AFTER_MS,
  SIMULATED_EASYLEVEL_DEVICE_ID,
  SIMULATED_OUTAGE_MS,
} from './easyLevelSimulator';
import {
  createSimulatedXparkleTransport,
  SIMULATED_XPARKLE_DEVICE_ID,
  SIMULATED_XPARKLE_DROP_AFTER_MS,
  SIMULATED_XPARKLE_OUTAGE_MS,
} from './xparkleSimulator';

/**
 * Regression tests for #418: the link behaviour both simulated boxes share
 * (connect, drop, outage, reconnect), pinned once and run against each.
 */

const SIMULATORS = [
  {
    name: 'Xparkle',
    create: (mode: 'steady' | 'drop') => createSimulatedXparkleTransport(mode),
    deviceId: SIMULATED_XPARKLE_DEVICE_ID,
    dropAfterMs: SIMULATED_XPARKLE_DROP_AFTER_MS,
    outageMs: SIMULATED_XPARKLE_OUTAGE_MS,
  },
  {
    name: 'EasyLevel',
    create: (mode: 'steady' | 'drop') => createSimulatedEasyLevelTransport(mode),
    deviceId: SIMULATED_EASYLEVEL_DEVICE_ID,
    dropAfterMs: SIMULATED_DROP_AFTER_MS,
    outageMs: SIMULATED_OUTAGE_MS,
  },
] as const;

describe.each(SIMULATORS)(
  'the simulated $name link (#418 regression)',
  ({ create, deviceId, dropAfterMs, outageMs }) => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('connects to its own simulated box', async () => {
      const connection = await create('steady').connect(vi.fn());
      expect(connection.deviceId).toBe(deviceId);
    });

    it('reconnects only to its own simulated box', async () => {
      const transport = create('steady');
      expect(await transport.reconnect('some-real-box', vi.fn())).toBeNull();
      expect((await transport.reconnect(deviceId, vi.fn()))?.deviceId).toBe(deviceId);
    });

    it('never drops a steady link', async () => {
      const onDisconnect = vi.fn();
      await create('steady').connect(onDisconnect);
      await vi.advanceTimersByTimeAsync(dropAfterMs * 3);
      expect(onDisconnect).not.toHaveBeenCalled();
    });

    it('drops a link in drop mode once, after the set time', async () => {
      const onDisconnect = vi.fn();
      await create('drop').connect(onDisconnect);

      await vi.advanceTimersByTimeAsync(dropAfterMs - 1);
      expect(onDisconnect).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(onDisconnect).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(dropAfterMs * 3);
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('never reports a deliberate disconnect as a drop', async () => {
      const onDisconnect = vi.fn();
      const connection = await create('drop').connect(onDisconnect);

      connection.disconnect();
      await vi.advanceTimersByTimeAsync(dropAfterMs * 2);

      expect(onDisconnect).not.toHaveBeenCalled();
    });

    it('stays out of reach for the outage after a drop, then reconnects', async () => {
      const transport = create('drop');
      await transport.connect(vi.fn());
      await vi.advanceTimersByTimeAsync(dropAfterMs);

      await vi.advanceTimersByTimeAsync(outageMs - 1);
      expect(await transport.reconnect(deviceId, vi.fn())).toBeNull();
      await vi.advanceTimersByTimeAsync(1);
      expect((await transport.reconnect(deviceId, vi.fn()))?.deviceId).toBe(deviceId);
    });

    it('can reconnect at once after a deliberate disconnect in drop mode', async () => {
      const transport = create('drop');
      const connection = await transport.connect(vi.fn());
      connection.disconnect();

      expect(await transport.reconnect(deviceId, vi.fn())).not.toBeNull();
    });

    it('drops a reconnected link again in drop mode', async () => {
      const transport = create('drop');
      await transport.connect(vi.fn());
      await vi.advanceTimersByTimeAsync(dropAfterMs + outageMs);
      const onDisconnect = vi.fn();
      await transport.reconnect(deviceId, onDisconnect);

      await vi.advanceTimersByTimeAsync(dropAfterMs);

      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  },
);
