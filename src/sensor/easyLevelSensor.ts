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
import { easyLevelSimulationMode } from './easyLevelSimulator';
import type { ExternalSensorDescriptor } from './externalSensors';
import { createWebBluetoothLink } from './webBluetoothLink';

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

/**
 * How long this adapter withholds `getGravity()` after connecting,
 * waiting for the first `faf52c22-...` status notification, before giving
 * up and reporting best-effort (possibly uncalibrated) readings anyway
 * (#217). Unlike `sensorFallback.ts`'s shared auto-retry cadence, this is
 * NOT derived from the official app, and is not shared policy at all —
 * it exists only because `faf52c22-...` carries the bias bytes
 * `parseAccelPacket` needs, which is this protocol's business and no
 * other source's (#266 moved it here from `sensorFallback.ts` for exactly
 * that reason): #217's decompile of its own post-connect
 * setup (`N0/a;->m()`) found it enables status notifications before accel
 * notifications (see `easyLevelSensor.ts`'s module doc comment), but found
 * no equivalent explicit wait — the app has no analogous grace period, it
 * just relies on that ordering (and, per that same decompile, defaults to
 * *assuming legacy tier-<3 firmware* — `this.n = 16` — until a status
 * notification says otherwise, which is itself not obviously safe against
 * an accel notification arriving first on modern firmware). This constant
 * is Libell's own defensive choice, a bound generous enough to cover a
 * normal BLE notify round-trip without stalling a firmware that legitimately
 * never sends a status characteristic at all.
 */
export const EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS = 2000;

/**
 * True once `EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS` has passed since
 * connecting — see that constant's own doc comment. Same
 * time-as-parameter discipline as `sensorFallback.ts`'s retry check and
 * `domain/staleness.ts`'s `isSensorStale`, so this is fully unit-testable
 * without real timers.
 */
export function isEasyLevelInitialCalibrationWaitExpired(
  connectedAtMs: number,
  nowMs: number,
): boolean {
  return nowMs - connectedAtMs >= EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS;
}

/**
 * How long the box may stay silent, link still open, before Libell treats
 * it as lost contact (#358): it closes the link and reports
 * `'disconnected'`, so the card says "No contact", Reconnect is offered
 * and the background auto-retry (#211) starts, exactly as for an outright
 * drop. The Xparkle adapter gets the same outcome from its read timeout.
 *
 * Longer than the descriptor's `staleTimeoutMs`, so R35's "no new sensor
 * data" overlay always covers the gap first and an ordinary BLE hiccup
 * only ever shows that overlay. Counted only once connected: the manual's
 * "connecting can take up to 60 seconds" is the connect itself, which
 * Libell leaves to the browser with no limit of its own.
 */
export const EASYLEVEL_SILENCE_LIMIT_MS = 10000;

/** How often the silence above is checked while connected. */
const SILENCE_CHECK_INTERVAL_MS = 1000;

/** Web Bluetooth is Chrome/Android only — never Safari/iOS. */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * EasyLevel can work in this browser: real Web Bluetooth, or the simulated
 * box (#220) standing in for it. This is the ONE gate every "does
 * EasyLevel exist here at all" decision goes through — `main.ts`'s
 * page/indicator construction, onboarding's sensor-source step, and
 * `start()`/`reconnect()` below. `isWebBluetoothSupported()` stays the
 * real transport's own narrower contract: `createWebBluetoothTransport()`
 * is only ever constructed when it is true (`main.ts` picks the simulated
 * transport instead whenever the flag is on), so its `navigator.bluetooth!`
 * assertion is unaffected by this wider gate.
 */
export function isEasyLevelAvailable(): boolean {
  return isWebBluetoothSupported() || easyLevelSimulationMode() !== 'off';
}

/**
 * This box as the registry (#262, ADR 0016) sees it: its id, its product
 * name, whether it can work in this browser, and which rows its own page
 * has something to put in. This is the one place any of those four facts
 * is stated — in particular the string "EasyLevel", which used to be
 * repeated inside the shipped sentences of five language catalogues
 * (#267).
 *
 * Capabilities are what this protocol actually reports: battery,
 * temperature and firmware tier all come from `faf52c22-...`
 * (`parseEasyLevelStatus`), the mounting picker is R43/#222, the
 * installation offset is R34/#131, and the debug disclosure shows the raw
 * status bytes. Signal strength is deliberately absent — #228 removed
 * that row precisely because no browser can fill it.
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
    // Its placement can be learned by lifting too (#360), limited to the
    // manual's two placements (#359).
    learnMounting: true,
    upright: false,
    zeroesItself: false,
  },
  // Notifications are event-driven, not a fixed clock — a connection-
  // interval hiccup or a slow packet can legitimately create a larger gap
  // than a dropped animation frame ever would. Set generously above the
  // phone's own 2s so natural BLE jitter never false-triggers, while still
  // catching a box whose notifications have stopped with the GATT link
  // technically still open. Unchanged from #132's own value, only moved.
  staleTimeoutMs: 4000,
};

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

/** Opens the box's service after the optional settle pause (#212); each
 * characteristic opens only when the sensor subscribes to it. */
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
  /** The latest reading before the mounting rotation is applied (#360),
   * or null whenever `getGravity()` is — for the lift guide only. */
  getRawGravity(): GravityVector | null;
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

/**
 * Watches a live link for a stream that has stopped (#358): `onSilence`
 * runs once nothing has been heard for `EASYLEVEL_SILENCE_LIMIT_MS` while
 * `isLive()` holds.
 */
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
 * Holds back accel samples after a connect until the box's calibration is
 * known (#217): until a status notification has arrived, no status is
 * coming at all, or the grace window has passed. A held-back sample looks
 * from the outside as if it had not arrived yet, never as a value known to
 * be missing available calibration.
 */
function createCalibrationGate(now: () => number) {
  const connectedAtMs = now();
  let waiting = true;
  return {
    /** A status notification arrived, or none ever will. */
    open() {
      waiting = false;
    },
    /** Whether this sample is still held back. */
    holdsBack(): boolean {
      if (!waiting) return false;
      if (!isEasyLevelInitialCalibrationWaitExpired(connectedAtMs, now())) return true;
      waiting = false; // give up waiting; best-effort from here on
      return false;
    },
  };
}

/** A copy, not a view over the notification's own buffer (#219): the
 * debug page's hex dump must stay what actually arrived even if a
 * transport reuses its buffer for the next notification. */
function copyBytes(view: DataView): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice();
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
  // The same reading before the mounting rotation (#360): what the lift
  // guide learns the placement from, so a rotation already stored never
  // skews what it measures.
  let rawGravity: GravityVector | null = null;
  let statusBytes: Uint8Array | null = null;
  let status: EasyLevelStatus | null = null;
  let connection: EasyLevelConnection | null = null;
  // #132: stamped on every accepted accel notification — the only honest
  // signal that data is still actually arriving, as opposed to the GATT
  // link merely still being open.
  let lastSampleAt: number | null = null;
  const silenceWatch = createSilenceWatch(now, () => state === 'granted', closeSilentLink);

  /** Closed actively (#219): a half-open link keeps the box from
   * advertising, so no reconnect could find it. The transport's teardown
   * reports nothing through `onDisconnect`, so the lost state is set here,
   * keeping `connection` for its device id. */
  function closeSilentLink(): void {
    connection?.disconnect();
    onGattDisconnected();
  }

  /** Never show stale as live (R35, #132): readings, battery and
   * temperature from before a drop are not current either. */
  function clearReadings(): void {
    gravity = null;
    rawGravity = null;
    lastSampleAt = null;
    status = null;
  }

  function onGattDisconnected(): void {
    silenceWatch.stop();
    // Lost, not denied: surfaces distinctly (#116's AC) so the UI can
    // offer reconnection instead of silently freezing on the last value.
    state = 'disconnected';
    clearReadings();
  }

  function handleStatus(view: DataView): void {
    statusBytes = copyBytes(view);
    status = parseEasyLevelStatus(view);
  }

  function handleAccel(view: DataView): void {
    // The latest status's bias, if any (#215), read fresh on every sample
    // so a later calibration, or a drop that clears it, applies at once.
    const calibrated = parseAccelPacket(view, status?.calibration);
    rawGravity = calibrated;
    gravity = calibrated ? applyEasyLevelMounting(calibrated, getMounting()) : null;
    lastSampleAt = now();
  }

  /** Best-effort only — see the module doc comment. A firmware without
   * this characteristic, or one that rejects the subscription, must never
   * prevent leveling from working. Any status notification, even an
   * unparseable one, opens the calibration gate. */
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

  /** Wire a fresh connection's notify characteristics into this sensor's
   * readings. Status is subscribed before accel; see the module doc
   * comment's "Startup ordering" section. */
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
      // #219: made but not wired, so released rather than left half-open.
      // The transport's disconnect() reports nothing through
      // `onDisconnect`, so the caller still decides the surfaced state.
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
        // A cancelled picker, a failed connect or a missing service, all
        // surfaced like a denied phone permission. A box that was already
        // lost stays lost (#307): Retry's picker being cancelled must not
        // hide the unavailable prompt or stop its background retry.
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
        // A subscribe failure after a successful GATT connect, say: the
        // same honest "not connected" as finding no box at all.
      }
      state = 'disconnected';
      return state;
    },
    getState: () => state,
    getGravity: () => gravity,
    getRawGravity: () => rawGravity,
    getDeviceId: () => connection?.deviceId ?? null,
    getSource: (): SensorSource => 'easylevel',
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
