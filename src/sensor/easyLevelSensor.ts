/**
 * EasyLevel BLE box (issue #116) — a second `OrientationSensor`
 * implementation (ADR 0014) alongside the phone sensor and `?demo`.
 * Always opt-in, connected from a menu action (`src/ui/sensorSourceSection.ts`);
 * never replaces the phone sensor automatically.
 *
 * Web Bluetooth transport (GATT connect/subscribe/disconnect) lives in
 * `createWebBluetoothTransport()` below, kept separate from the byte
 * parsing in `easyLevelProtocol.ts` — the same transport/protocol split
 * #119's iOS bridge issue calls for. `createEasyLevelSensor()` accepts an
 * injected `EasyLevelTransport`, so the connect/disconnect/state-machine
 * logic is unit-testable with a fake transport: there is no physical box
 * to test against, and `navigator.bluetooth` does not exist in Vitest/jsdom.
 *
 * Protocol notes (from #116's reverse-engineering — see that issue for
 * the full writeup):
 * - GATT service `faf52c20-...`, discovered only after connecting —
 *   `EASYLEVEL_ADVERTISED_SERVICE_UUID`'s doc comment below explains why
 *   the *scan* filter uses a different UUID. `faf52c21-...` (NOTIFY)
 *   carries the raw accel/gyro payload parsed by `easyLevelProtocol.ts`.
 * - `faf52c22-...` (NOTIFY/READ) carries firmware version, battery,
 *   temperature and calibration bytes — fully decoded as of #123/#215 (see
 *   `easyLevelProtocol.ts`'s `parseEasyLevelStatus`). Still subscribed
 *   best-effort: a firmware without this characteristic, or one that
 *   rejects the subscription, must never prevent leveling from working,
 *   since only `faf52c21-...` is actually required for that — accel
 *   readings simply go uncalibrated (#215) until/unless a status
 *   notification arrives, exactly like today's firmware-without-tier-3
 *   case.
 * - No encryption, no WRITE characteristic (confirmed by decompiling the
 *   official apps — see #116).
 *
 * **Startup ordering (#217):** `wireConnection()` below subscribes
 * `faf52c22-...` (status) *before* `faf52c21-...` (accel) — re-decompiling
 * the official app's own post-connect setup (`N0/a;->m()`, run once the
 * device reaches its "READY" state) found it enables notifications on
 * `faf52c22-...` before `faf52c21-...` too (no explicit characteristic
 * *read* — just that ordering of the two notify-enable requests, executed
 * serially by its own generic BLE-request queue). Matching that ordering
 * increases the odds a box that proactively notifies its current status on
 * subscribe is calibrated before its first accel sample is processed, but
 * cannot guarantee it: enabling notifications is not the same as a value
 * having arrived, and whether a given box proactively notifies on
 * subscribe at all is real device firmware behavior, invisible in the
 * app's own code. `getGravity()` therefore stays `null` (accel samples are
 * accepted but not exposed) until either a status notification has been
 * observed, `subscribeStatus()` itself fails or the characteristic doesn't
 * exist (nothing to wait for), or
 * `sensorFallback.ts`'s `EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS` elapses —
 * see that constant's doc comment for why this bound exists and is
 * Libell's own choice, not evidence from the official app.
 *
 * Remember-and-auto-reconnect (#130): once a box has been paired via
 * `connect()`'s `requestDevice()` picker, the browser remembers the grant
 * for that origin. `reconnect()` uses Web Bluetooth's persistent-
 * permissions API — `navigator.bluetooth.getDevices()` (no picker, no user
 * gesture) plus `device.gatt.connect()` — to reattach to that same
 * previously-authorized device on a later app open. This is a real,
 * currently-shipping (Chrome/Android) piece of Web Bluetooth, distinct from
 * `requestDevice()`, which always needs both a live gesture and (bar a
 * matching `filters`-based auto-accept, not used here) a picker. Where
 * `getDevices()` does not exist, or the remembered device is not in its
 * list, or `gatt.connect()` fails, `reconnect()` fails cleanly — never a
 * new picker, never a loop — leaving the caller to fall back to the
 * ordinary gesture-triggered `start()`/`connect()` path.
 */
import type { GravityVector } from '../domain/leveling';
import type { EasyLevelMounting, SensorSource } from '../domain/settings';
import type { OrientationSensor, SensorState } from './orientation';
import {
  applyEasyLevelMounting,
  parseAccelPacket,
  parseEasyLevelStatus,
  type EasyLevelStatus,
} from './easyLevelProtocol';
import { isEasyLevelInitialCalibrationWaitExpired } from './sensorFallback';

export const EASYLEVEL_SERVICE_UUID = 'faf52c20-5078-11e9-b475-0800200c9a66';
export const EASYLEVEL_ACCEL_CHARACTERISTIC_UUID = 'faf52c21-5078-11e9-b475-0800200c9a66';
export const EASYLEVEL_STATUS_CHARACTERISTIC_UUID = 'faf52c22-5078-11e9-b475-0800200c9a66';
/**
 * The service UUID modern boxes actually put in their BLE advertisement —
 * `EASYLEVEL_SERVICE_UUID` above is only the GATT service discovered after
 * connecting, never advertised itself. Confirmed by decompiling the
 * official `EasyLevel 5.0.7` app's own scan filter
 * (`ScanFilter.Builder().setServiceUuid(...)` in its `MainActivity`/
 * `BleScanner`, `y0/C1213g.java`), not just #116's original protocol pass —
 * that pass never had a physical box to verify the *scanning* half against
 * (only the GATT/payload half), and #116 explicitly flagged this as the
 * one thing left to confirm before trusting the scan filter.
 */
export const EASYLEVEL_ADVERTISED_SERVICE_UUID = '669a0c20-0008-a7ba-e311-0685c0f7978a';
/**
 * Name prefix of boxes too old to advertise `EASYLEVEL_ADVERTISED_SERVICE_UUID`
 * — the official app's own fallback for "legacy sensor" boxes (same source
 * as above: scans with no service filter at all, then accepts only devices
 * whose advertised name starts with this).
 */
export const EASYLEVEL_DEVICE_NAME_PREFIX = 'CARATI';

/** Web Bluetooth is Chrome/Android only — never Safari/iOS. */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/** One connected box: subscribe to its notify characteristics, disconnect on request. */
export interface EasyLevelConnection {
  /** Web Bluetooth's own device id (#130) — remembered so a later session
   * can find this same device again via `getDevices()`. */
  readonly deviceId: string;
  subscribeAccel(onData: (view: DataView) => void): Promise<void>;
  /** Best-effort (#116: layout beyond byte 7 undecoded) — raw bytes only. */
  subscribeStatus(onData: (view: DataView) => void): Promise<void>;
  disconnect(): void;
}

/**
 * Thin seam over Web Bluetooth so the connection/state-machine logic can
 * be unit-tested with a fake transport implementing this same shape.
 */
export interface EasyLevelTransport {
  /**
   * Shows the OS device picker and connects GATT. Must run inside a real
   * user-gesture call stack (a click handler) — `requestDevice` throws
   * otherwise. `onDisconnect` is called if the GATT connection drops
   * later (box powered off, out of range, ...).
   */
  connect(onDisconnect: () => void): Promise<EasyLevelConnection>;
  /**
   * Silent reconnect (#130): finds `deviceId` among the devices already
   * authorized for this origin (`getDevices()`) and connects its GATT
   * server — no picker, no user gesture. Resolves `null` (never rejects)
   * when `getDevices()` doesn't exist, the id isn't in that list, or GATT
   * connect fails — every "can't do this silently" reason degrades the
   * same way, onto the caller's gesture-triggered fallback.
   */
  reconnect(deviceId: string, onDisconnect: () => void): Promise<EasyLevelConnection | null>;
}

/** `new Promise(resolve => setTimeout(resolve, ms))`, named for what it's for
 * at the one call site below — real timers, since this only ever runs in a
 * real browser against real Web Bluetooth, never inside `domain/`. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The real Web Bluetooth transport. `requestDevice()`'s picker matches a
 * device against ANY of its filters: `EASYLEVEL_ADVERTISED_SERVICE_UUID`
 * for modern boxes (the common case — see that constant's doc comment for
 * why this is `669a0c20-...`, not `EASYLEVEL_SERVICE_UUID`), plus the
 * `CARATI...` name prefix for older boxes that don't advertise a service
 * UUID at all. `EASYLEVEL_SERVICE_UUID` itself is only ever discovered
 * post-connect (`getPrimaryService()` below), so it must be listed in
 * `optionalServices` — Web Bluetooth blocks fetching any GATT service that
 * is neither in `filters` nor `optionalServices`.
 *
 * `getConnectDelayMs` (#212) — read fresh on every connect, never cached —
 * is the debug hardware-compatibility workaround exposed on the EasyLevel
 * status page's debug disclosure: an optional fixed pause after GATT
 * connect succeeds and before service discovery, for a real box that might
 * need a moment to settle, the way the official app's own decompiled
 * connection handling applies a delay of its own that this transport
 * otherwise does not. Defaults to always-zero (no delay, today's exact
 * behavior) so every existing caller — including every test below — is
 * unaffected unless it explicitly opts in.
 */
export function createWebBluetoothTransport(
  getConnectDelayMs: () => number = () => 0,
): EasyLevelTransport {
  async function connectToDevice(
    device: BluetoothDevice,
    onDisconnect: () => void,
  ): Promise<EasyLevelConnection> {
    device.addEventListener('gattserverdisconnected', onDisconnect);
    const server = await device.gatt?.connect();
    if (!server) throw new Error('EasyLevel: GATT connect failed');
    const connectDelayMs = getConnectDelayMs();
    if (connectDelayMs > 0) await delay(connectDelayMs);
    const service = await server.getPrimaryService(EASYLEVEL_SERVICE_UUID);

    async function subscribe(uuid: string, onData: (view: DataView) => void): Promise<void> {
      const characteristic = await service.getCharacteristic(uuid);
      characteristic.addEventListener('characteristicvaluechanged', () => {
        if (characteristic.value) onData(characteristic.value);
      });
      await characteristic.startNotifications();
    }

    return {
      deviceId: device.id,
      subscribeAccel: (onData) => subscribe(EASYLEVEL_ACCEL_CHARACTERISTIC_UUID, onData),
      subscribeStatus: (onData) => subscribe(EASYLEVEL_STATUS_CHARACTERISTIC_UUID, onData),
      disconnect: () => device.gatt?.disconnect(),
    };
  }

  return {
    async connect(onDisconnect): Promise<EasyLevelConnection> {
      // Only ever called after `isWebBluetoothSupported()` has confirmed
      // `navigator.bluetooth` exists (`start()` below) — the assertion
      // reflects that contract rather than re-checking it here.
      const device = await navigator.bluetooth!.requestDevice({
        filters: [
          { services: [EASYLEVEL_ADVERTISED_SERVICE_UUID] },
          { namePrefix: EASYLEVEL_DEVICE_NAME_PREFIX },
        ],
        optionalServices: [EASYLEVEL_SERVICE_UUID],
      });
      return connectToDevice(device, onDisconnect);
    },
    async reconnect(deviceId, onDisconnect): Promise<EasyLevelConnection | null> {
      // Same "only called after isWebBluetoothSupported()" contract as
      // connect() above, but getDevices() itself is a second, narrower
      // feature (#130) that can be missing even where `bluetooth` exists.
      const getDevices = navigator.bluetooth?.getDevices;
      if (typeof getDevices !== 'function') return null;
      try {
        const devices = await getDevices.call(navigator.bluetooth);
        const device = devices.find((candidate) => candidate.id === deviceId);
        if (!device) return null;
        return await connectToDevice(device, onDisconnect);
      } catch {
        // A GATT connect failure (box out of range, powered off, ...) —
        // fails silently here by design; the caller decides what "no
        // silent reconnect available" means for its own UI.
        return null;
      }
    },
  };
}

/** `OrientationSensor` plus a couple of EasyLevel-specific extras not part of that shared interface. */
export interface EasyLevelSensor extends OrientationSensor {
  /** Raw `faf52c22-...` bytes — kept alongside the parsed `getStatus()`
   * below for diagnostics/debugging. */
  getStatusBytes(): Uint8Array | null;
  /** `faf52c22-...` parsed into battery/temperature/firmware-tier (#123),
   * or null before the first status notification arrives (or if none ever
   * does — best-effort, see the module doc comment). Cleared, like
   * `getGravity()`, when the connection is lost — never a stale reading
   * shown as live. */
  getStatus(): EasyLevelStatus | null;
  /** The connected device's Web Bluetooth id (#130), or null before a
   * successful `start()`/`reconnect()` — the caller remembers this to make
   * a later `reconnect()` possible. */
  getDeviceId(): string | null;
  /**
   * Silent reconnect (#130): tries `transport.reconnect(deviceId, ...)` —
   * no device picker, no user gesture required — and resolves `'granted'`
   * on success. Never falls back to `transport.connect()`'s gesture-
   * triggered picker itself (that would be pointless outside a real click
   * handler, and wrong inside one — see the module doc comment); on any
   * failure it resolves `'disconnected'`, the same state an active
   * connection reaches when it drops, so the UI's existing "lost
   * connection, tap to reconnect" handling covers this case too rather
   * than needing a parallel one. `'unsupported'` still means what it means
   * everywhere else: `navigator.bluetooth` itself does not exist.
   */
  reconnect(deviceId: string): Promise<SensorState>;
  /** Explicit user disconnect — distinct from an unexpected `gattserverdisconnected`. */
  disconnect(): void;
}

export function createEasyLevelSensor(
  transport: EasyLevelTransport = createWebBluetoothTransport(),
  /** Read live on every accel sample (#217), never cached — mirrors
   * `main.ts`'s `easyLevelTransport()`/`getConnectDelayMs` pattern, so
   * flipping the mounting setting on the External sensor page takes effect
   * on the very next notification with no reconnect needed. Defaults to
   * the official app's own default placement. */
  getMounting: () => EasyLevelMounting = () => 'standard',
  /** Clock seam (#217) purely for testability — real timers never run in
   * Vitest/jsdom the way they would in a browser, so every timing decision
   * here goes through this instead of calling `performance.now()` inline. */
  now: () => number = () => performance.now(),
): EasyLevelSensor {
  let state: SensorState = 'idle';
  let gravity: GravityVector | null = null;
  let statusBytes: Uint8Array | null = null;
  let status: EasyLevelStatus | null = null;
  let connection: EasyLevelConnection | null = null;
  // #132: stamped on every accepted accel notification — the only honest
  // signal that data is still actually arriving, as opposed to the GATT
  // link merely still being open (this issue's first example: notifications
  // silently stopping while the connection stays "connected").
  let lastSampleAt: number | null = null;

  function onGattDisconnected(): void {
    // Lost, not denied: surfaces distinctly (#116's AC) so the UI can
    // offer reconnection instead of silently freezing on the last value.
    state = 'disconnected';
    gravity = null;
    lastSampleAt = null;
    // Same "never show stale as live" rule R35 already applies to gravity
    // (#132) — a battery/temperature reading from before the drop is not
    // an honest "current" reading either.
    status = null;
  }

  /** Shared by start() and reconnect(): wire a fresh EasyLevelConnection's
   * notify characteristics into this sensor's readings. */
  async function wireConnection(next: EasyLevelConnection): Promise<void> {
    connection = next;
    const connectedAtMs = now();
    // #217: true until either a status notification has been observed, no
    // status is coming at all (subscribeStatus fails/absent below), or the
    // grace window expires — see the module doc comment and
    // `sensorFallback.ts`'s `EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS`. While
    // true, accel notifications are received but not exposed through
    // `getGravity()`/`getLastSampleAt()` — from the outside, as if they
    // had not arrived yet, never as a value known to be missing available
    // calibration.
    let awaitingInitialCalibration = true;

    // Subscribed before accel below — see the module doc comment's
    // "Startup ordering" section for why this order matters and what it
    // can and can't guarantee.
    try {
      // Best-effort only — see the module doc comment. A firmware without
      // this characteristic, or one that rejects the subscription, must
      // never prevent leveling from working.
      await connection.subscribeStatus((view) => {
        statusBytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
        status = parseEasyLevelStatus(view);
        // Any status notification — even a too-short/unparseable one —
        // means we've learned what this characteristic has to say; nothing
        // further to wait for.
        awaitingInitialCalibration = false;
      });
    } catch {
      // No status characteristic, or subscribe failed: nothing calibration
      // could ever come from, so don't wait for it.
      awaitingInitialCalibration = false;
    }
    await connection.subscribeAccel((view) => {
      if (awaitingInitialCalibration) {
        if (!isEasyLevelInitialCalibrationWaitExpired(connectedAtMs, now())) {
          return; // still within the grace window — drop this sample
        }
        awaitingInitialCalibration = false; // give up waiting; best-effort from here on
      }
      // The most recent status notification's bytes-8-19 bias, if any
      // (#215) — `status` is set by the subscribeStatus handler above, and
      // read fresh on every accel sample so a later calibration (or a
      // reconnect that loses it, clearing `status` back to null) takes
      // effect immediately rather than needing its own plumbing.
      const calibrated = parseAccelPacket(view, status?.calibration);
      gravity = calibrated ? applyEasyLevelMounting(calibrated, getMounting()) : null;
      lastSampleAt = now();
    });
  }

  return {
    async start(): Promise<SensorState> {
      if (state === 'granted') return state;
      if (!isWebBluetoothSupported()) {
        state = 'unsupported';
        return state;
      }
      try {
        await wireConnection(await transport.connect(onGattDisconnected));
        state = 'granted';
        return state;
      } catch {
        // Covers a cancelled device picker, a GATT connect failure, or a
        // missing service — all surfaced the same way the phone sensor
        // surfaces a denied permission.
        state = 'denied';
        return state;
      }
    },
    async reconnect(deviceId: string): Promise<SensorState> {
      if (state === 'granted') return state;
      if (!isWebBluetoothSupported()) {
        state = 'unsupported';
        return state;
      }
      try {
        const result = await transport.reconnect(deviceId, onGattDisconnected);
        if (!result) {
          state = 'disconnected';
          return state;
        }
        await wireConnection(result);
        state = 'granted';
        return state;
      } catch {
        // A subscribe failure after a successful GATT connect, say — same
        // honest "not actually connected" outcome as transport.reconnect()
        // itself resolving null.
        state = 'disconnected';
        return state;
      }
    },
    getState: () => state,
    getGravity: () => gravity,
    getDeviceId: () => connection?.deviceId ?? null,
    getSource: (): SensorSource => 'easylevel',
    getLastSampleAt: () => lastSampleAt,
    getStatusBytes: () => statusBytes,
    getStatus: () => status,
    disconnect(): void {
      connection?.disconnect();
      connection = null;
      state = 'idle';
      gravity = null;
      lastSampleAt = null;
      status = null;
    },
  };
}
