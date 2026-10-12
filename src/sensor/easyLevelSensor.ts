/**
 * EasyLevel BLE box — an `OrientationSensor` (ADR 0014) alongside the phone
 * sensor and `?demo`. Always opt-in from the menu; never replaces the phone
 * sensor automatically. Byte parsing lives in `easyLevelProtocol.ts`; the
 * transport is injected so the state machine is testable without a box or
 * `navigator.bluetooth`.
 *
 * Protocol (reverse-engineered from the official app):
 * - GATT service `faf52c20-...` is discovered only after connecting; the scan
 *   filter uses `EASYLEVEL_ADVERTISED_SERVICE_UUID`. `faf52c21-...` (NOTIFY)
 *   carries the raw accel/gyro payload.
 * - `faf52c22-...` (NOTIFY/READ) carries firmware version, battery,
 *   temperature and calibration bytes. Subscribed best-effort: only
 *   `faf52c21-...` is required for leveling; without status, readings simply
 *   go uncalibrated.
 * - No encryption, no WRITE characteristic.
 *
 * **Startup ordering:** status is subscribed *before* accel, matching the
 * official app's post-connect setup, so a box that notifies its status on
 * subscribe is likely calibrated before its first accel sample. That is not
 * guaranteed (enabling notifications is not a value arriving), so
 * `getGravity()` stays `null` until a status notification arrives, status
 * subscription fails, or `EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS` elapses.
 *
 * Reconnect: `reconnect()` uses `navigator.bluetooth.getDevices()` plus
 * `gatt.connect()` to reattach to a previously paired box without a picker or
 * user gesture (Chrome/Android). When that is unavailable or fails it fails
 * cleanly — never a new picker, never a loop — leaving the caller to fall back
 * to the gesture-triggered `start()`.
 */
import type { GravityVector } from '../domain/leveling';
import type { EasyLevelMounting } from '../domain/sensorDeviceSettings';
import type { OrientationSensor, SensorState } from './orientation';
import {
  applyEasyLevelMounting,
  parseAccelPacket,
  parseEasyLevelStatus,
  type EasyLevelStatus,
} from './easyLevelProtocol';
import { easyLevelSimulationMode } from './easyLevelSimulator';
import type { ExternalSensorDescriptor } from './externalSensors';
import { createWebBluetoothLink } from './webBluetoothLink';

export const EASYLEVEL_SERVICE_UUID = 'faf52c20-5078-11e9-b475-0800200c9a66';
export const EASYLEVEL_ACCEL_CHARACTERISTIC_UUID = 'faf52c21-5078-11e9-b475-0800200c9a66';
export const EASYLEVEL_STATUS_CHARACTERISTIC_UUID = 'faf52c22-5078-11e9-b475-0800200c9a66';
/**
 * The service UUID modern boxes put in their BLE advertisement —
 * `EASYLEVEL_SERVICE_UUID` is never advertised. Taken from the official
 * app's own scan filter.
 */
export const EASYLEVEL_ADVERTISED_SERVICE_UUID = '669a0c20-0008-a7ba-e311-0685c0f7978a';
/**
 * Name prefix of legacy boxes that advertise no service UUID — the official
 * app's own fallback filter.
 */
export const EASYLEVEL_DEVICE_NAME_PREFIX = 'CARATI';

/**
 * How long `getGravity()` is withheld after connecting while waiting for the
 * first status notification, which carries the bias bytes `parseAccelPacket`
 * needs. Libell's own defensive choice — the official app has no such wait:
 * long enough for a normal BLE notify round-trip, short enough not to stall
 * firmware that never sends status.
 */
export const EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS = 2000;

/** Time passed in as a parameter so this is testable without real timers. */
export function isEasyLevelInitialCalibrationWaitExpired(
  connectedAtMs: number,
  nowMs: number,
): boolean {
  return nowMs - connectedAtMs >= EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS;
}

/**
 * How long the box may stay silent, link still open, before it is treated as
 * lost: the link is closed and `'disconnected'` reported, exactly as for an
 * outright drop. The Xparkle adapter gets the same outcome from its read
 * timeout.
 *
 * Longer than `staleTimeoutMs`, so R35's "no new sensor data" overlay always
 * covers the gap first and an ordinary BLE hiccup only shows that overlay.
 * Counted only once connected; the connect itself is left to the browser.
 */
export const EASYLEVEL_SILENCE_LIMIT_MS = 10000;

const SILENCE_CHECK_INTERVAL_MS = 1000;

/** Web Bluetooth is Chrome/Android only — never Safari/iOS. */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * EasyLevel can work in this browser: real Web Bluetooth, or the simulated
 * box. The one gate for "does EasyLevel exist here at all";
 * `isWebBluetoothSupported()` stays the real transport's narrower contract.
 */
export function isEasyLevelAvailable(): boolean {
  return isWebBluetoothSupported() || easyLevelSimulationMode() !== 'off';
}

/**
 * This box as the registry (ADR 0016) sees it. Battery, temperature and
 * firmware tier come from `faf52c22-...`; mounting is R43, the installation
 * offset R34. Signal strength is absent because no browser can report it.
 */
export const EASYLEVEL_DESCRIPTOR: ExternalSensorDescriptor = {
  id: 'easylevel',
  displayName: 'EasyLevel',
  isAvailable: isEasyLevelAvailable,
  capabilities: {
    battery: true,
    temperature: true,
    firmwareVersion: true,
    mounting: true,
    installCalibration: true,
    debugBytes: true,
    reportedOrientation: false,
    // Limited to the manual's two placements.
    learnMounting: true,
    upright: false,
    zeroesItself: false,
  },
  // Notifications are event-driven, so BLE connection-interval jitter can
  // create larger gaps than the phone's 2s allows for.
  staleTimeoutMs: 4000,
};

export interface EasyLevelConnection {
  /** Remembered so a later session can find this device via `getDevices()`. */
  readonly deviceId: string;
  subscribeAccel(onData: (view: DataView) => void): Promise<void>;
  /** Best-effort — the box's firmware may not have it. */
  subscribeStatus(onData: (view: DataView) => void): Promise<void>;
  disconnect(): void;
}

/** Thin seam over Web Bluetooth so the state machine can use a fake transport. */
export interface EasyLevelTransport {
  /**
   * Shows the OS device picker and connects GATT. Must run inside a real user
   * gesture — `requestDevice` throws otherwise. `onDisconnect` fires if GATT
   * drops later.
   */
  connect(onDisconnect: () => void): Promise<EasyLevelConnection>;
  /**
   * Silent reconnect via `getDevices()` — no picker, no gesture. Resolves
   * `null` (never rejects) whenever it cannot be done silently.
   */
  reconnect(deviceId: string, onDisconnect: () => void): Promise<EasyLevelConnection | null>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The real Web Bluetooth transport. The picker matches ANY filter: the
 * advertised UUID for modern boxes, the `CARATI` name prefix for legacy ones.
 * `EASYLEVEL_SERVICE_UUID` must be in `optionalServices` — Web Bluetooth
 * blocks any GATT service in neither `filters` nor `optionalServices`.
 *
 * `getConnectDelayMs` is a debug compatibility workaround: an optional pause
 * after GATT connect and before service discovery, for a box that needs time
 * to settle (the official app applies one). Read fresh on every connect.
 */
export function createWebBluetoothTransport(
  getConnectDelayMs: () => number = () => 0,
): EasyLevelTransport {
  return createWebBluetoothLink({
    name: 'EasyLevel',
    requestOptions: {
      filters: [
        { services: [EASYLEVEL_ADVERTISED_SERVICE_UUID] },
        { namePrefix: EASYLEVEL_DEVICE_NAME_PREFIX },
      ],
      optionalServices: [EASYLEVEL_SERVICE_UUID],
    },
    wire: (server) => wireEasyLevel(server, getConnectDelayMs()),
  });
}

/** Each characteristic opens only when the sensor subscribes to it. */
async function wireEasyLevel(
  server: BluetoothRemoteGATTServer,
  connectDelayMs: number,
): Promise<Omit<EasyLevelConnection, 'deviceId' | 'disconnect'>> {
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
    subscribeAccel: (onData) => subscribe(EASYLEVEL_ACCEL_CHARACTERISTIC_UUID, onData),
    subscribeStatus: (onData) => subscribe(EASYLEVEL_STATUS_CHARACTERISTIC_UUID, onData),
  };
}

export interface EasyLevelSensor extends OrientationSensor {
  /** Raw `faf52c22-...` bytes, for the debug disclosure. */
  getStatusBytes(): Uint8Array | null;
  /** Null until a status notification arrives; cleared on disconnect so a
   * stale reading is never shown as live. */
  getStatus(): EasyLevelStatus | null;
  /** The latest reading before the mounting rotation, for the lift guide. */
  getRawGravity(): GravityVector | null;
  getDeviceId(): string | null;
  /**
   * Silent reconnect: never falls back to the picker (useless outside a click
   * handler). Any failure resolves `'disconnected'`, so the UI's existing
   * "lost connection" handling covers it.
   */
  reconnect(deviceId: string): Promise<SensorState>;
  /** Explicit user disconnect — distinct from an unexpected `gattserverdisconnected`. */
  disconnect(): void;
}

function createSilenceWatch(now: () => number, isLive: () => boolean, onSilence: () => void) {
  let lastHeardAt = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  function stop(): void {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }
  return {
    start() {
      stop();
      lastHeardAt = now();
      timer = setInterval(() => {
        if (isLive() && now() - lastHeardAt > EASYLEVEL_SILENCE_LIMIT_MS) onSilence();
      }, SILENCE_CHECK_INTERVAL_MS);
    },
    stop,
    /** Any accel notification counts, even one the calibration gate holds back. */
    heard() {
      lastHeardAt = now();
    },
  };
}

/**
 * Holds back accel samples after a connect until calibration is known (see
 * the module doc comment). A held-back sample looks as if it had not arrived
 * yet, never like a reading missing available calibration.
 */
function createCalibrationGate(now: () => number) {
  const connectedAtMs = now();
  let waiting = true;
  return {
    /** A status notification arrived, or none ever will. */
    open() {
      waiting = false;
    },
    holdsBack(): boolean {
      if (!waiting) return false;
      if (!isEasyLevelInitialCalibrationWaitExpired(connectedAtMs, now())) return true;
      waiting = false; // give up waiting; best-effort from here on
      return false;
    },
  };
}

/** A copy, not a view: a transport may reuse its buffer for the next
 * notification, and the debug hex dump must show what actually arrived. */
function copyBytes(view: DataView): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice();
}

export function createEasyLevelSensor(
  transport: EasyLevelTransport = createWebBluetoothTransport(),
  /** Read on every sample, so a mounting change applies without reconnecting. */
  getMounting: () => EasyLevelMounting = () => 'standard',
  /** Clock seam for tests. */
  now: () => number = () => performance.now(),
): EasyLevelSensor {
  let state: SensorState = 'idle';
  let gravity: GravityVector | null = null;
  // Unrotated, so the lift guide's measurement is not skewed by a stored
  // mounting.
  let rawGravity: GravityVector | null = null;
  let statusBytes: Uint8Array | null = null;
  let status: EasyLevelStatus | null = null;
  let connection: EasyLevelConnection | null = null;
  // Stamped on every accepted sample — the honest signal that data is
  // arriving, as opposed to the GATT link merely being open.
  let lastSampleAt: number | null = null;
  const silenceWatch = createSilenceWatch(now, () => state === 'granted', closeSilentLink);

  /** Closed actively: a half-open link keeps the box from advertising, so no
   * reconnect could find it. The transport's teardown reports nothing through
   * `onDisconnect`, so the lost state is set here, keeping `connection` for
   * its device id. */
  function closeSilentLink(): void {
    connection?.disconnect();
    onGattDisconnected();
  }

  /** Never show stale as live (R35). */
  function clearReadings(): void {
    gravity = null;
    rawGravity = null;
    lastSampleAt = null;
    status = null;
  }

  function onGattDisconnected(): void {
    silenceWatch.stop();
    // Lost, not denied, so the UI offers reconnection.
    state = 'disconnected';
    clearReadings();
  }

  function handleStatus(view: DataView): void {
    statusBytes = copyBytes(view);
    status = parseEasyLevelStatus(view);
  }

  function handleAccel(view: DataView): void {
    // Bias read per sample, so a later calibration or a cleared one applies
    // at once.
    const calibrated = parseAccelPacket(view, status?.calibration);
    rawGravity = calibrated;
    gravity = calibrated ? applyEasyLevelMounting(calibrated, getMounting()) : null;
    lastSampleAt = now();
  }

  /** Best-effort: a missing or rejected status characteristic must never
   * prevent leveling. Any status notification, even an unparseable one, opens
   * the calibration gate. */
  async function subscribeStatus(
    live: EasyLevelConnection,
    gate: ReturnType<typeof createCalibrationGate>,
  ): Promise<void> {
    try {
      await live.subscribeStatus((view) => {
        handleStatus(view);
        gate.open();
      });
    } catch {
      gate.open();
    }
  }

  /** Status before accel — see the module doc comment's "Startup ordering". */
  async function wireConnection(next: EasyLevelConnection): Promise<void> {
    connection = next;
    const gate = createCalibrationGate(now);
    await subscribeStatus(next, gate);
    try {
      await next.subscribeAccel((view) => {
        silenceWatch.heard();
        if (!gate.holdsBack()) handleAccel(view);
      });
    } catch (error) {
      // Released rather than left half-open. disconnect() reports nothing
      // through `onDisconnect`, so the caller decides the surfaced state.
      next.disconnect();
      connection = null;
      throw error;
    }
  }

  async function adopt(next: EasyLevelConnection): Promise<SensorState> {
    await wireConnection(next);
    state = 'granted';
    silenceWatch.start();
    return state;
  }

  /** The state to report instead of connecting, or null to go ahead. */
  function refusalToConnect(): SensorState | null {
    if (state === 'granted') return state;
    if (!isEasyLevelAvailable()) {
      state = 'unsupported';
      return state;
    }
    return null;
  }

  return {
    async start(): Promise<SensorState> {
      const refusal = refusalToConnect();
      if (refusal) return refusal;
      try {
        return await adopt(await transport.connect(onGattDisconnected));
      } catch {
        // Cancelled picker, failed connect or missing service: like a denied
        // phone permission. A box already lost stays lost, so a cancelled
        // Retry picker does not hide the unavailable prompt or stop its
        // background retry.
        if (state !== 'disconnected') state = 'denied';
        return state;
      }
    },
    async reconnect(deviceId: string): Promise<SensorState> {
      const refusal = refusalToConnect();
      if (refusal) return refusal;
      try {
        const next = await transport.reconnect(deviceId, onGattDisconnected);
        if (next) return await adopt(next);
      } catch {
        // E.g. a subscribe failure after GATT connect: same as no box found.
      }
      state = 'disconnected';
      return state;
    },
    getState: () => state,
    getGravity: () => gravity,
    getRawGravity: () => rawGravity,
    getDeviceId: () => connection?.deviceId ?? null,
    getSource: () => 'easylevel',
    getLastSampleAt: () => lastSampleAt,
    getStatusBytes: () => statusBytes,
    getStatus: () => status,
    disconnect(): void {
      silenceWatch.stop();
      connection?.disconnect();
      connection = null;
      state = 'idle';
      clearReadings();
    },
  };
}
