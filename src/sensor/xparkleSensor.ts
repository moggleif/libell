/**
 * Xparkle RVS01 (SkyRC) — Web Bluetooth transport and `OrientationSensor`
 * built on `xparkleProtocol.ts`'s codec. Same shape as `easyLevelSensor.ts`
 * (injectable transport seam, readings turned into a `GravityVector`,
 * ADR 0014), with two real differences:
 *
 * **1. The live reading is polled, not notified.** `fff2` must be read (the
 * official app does so every 500–1000 ms); `fff4`'s notifications carry only
 * command replies. Polling stops the moment the link goes — a GATT read
 * every half second is not free on the box's AA batteries.
 *
 * **2. It expects to be written to.** The app's connect sequence: enable
 * notifications on `fff4`, read the serial number, send the password
 * (command `4`, default `"0000"`), query the stored parameters (command
 * `2`), then poll.
 *
 * **Mounting orientation: the box's own, never Libell's.** Unlike EasyLevel's
 * raw axes, the box applies its stored installation orientation
 * (front/rear/left/right) before reporting angles. Libell's rotation on top
 * would double-correct and name the wrong wheel while looking plausible, so
 * the descriptor declares `mounting: false` and `getOrientation()` is
 * display-only. Which way the box faces is learned in Libell instead; the
 * box must stand upright whichever way it faces (`domain/uprightMount.ts`).
 *
 * **The password does not gate readings.** A physical box serves `fff2`
 * without the password. The adapter sends it and polls regardless: if a box
 * did gate reads, they would fail into the ordinary `'disconnected'` path.
 * `isPasswordRejected()` lets the UI say "wrong password" rather than
 * "the box is broken".
 *
 * **No command that changes the box's stored state is sent automatically** —
 * silently rewriting a user's setup is worse than not supporting it. The one
 * exception is `resetZero`, only behind an explicit tap (`zeroBox()`).
 * `setParameters` is never sent.
 */
import { applyAxisMapping, type AxisMapping } from '../domain/axisMapping';
import { BLE_ADVERTISEMENT_WAIT_MS } from './bleAdvertisement';
import { createWebBluetoothLink } from './webBluetoothLink';
import type { GravityVector } from '../domain/leveling';
import type { SensorSource } from '../domain/settings';
import type { ExternalSensor } from './externalSensorController';
import type { SensorState } from './orientation';
import type { ExternalSensorDescriptor } from './externalSensors';
import { createSimulatedXparkleTransport, xparkleSimulationMode } from './xparkleSimulator';
import {
  buildPasswordFrame,
  buildQueryParameters,
  buildResetZero,
  createXparkleFrameReassembler,
  gravityFromAngles,
  gravityFromReading,
  parseLivePayload,
  parseParameterReply,
  XPARKLE_DEFAULT_PASSWORD,
  XPARKLE_DEVICE_NAME_FRAGMENTS,
  XPARKLE_LIVE_CHARACTERISTIC_UUID,
  XPARKLE_NOTIFY_CHARACTERISTIC_UUID,
  XPARKLE_PASSWORD_MODE,
  XPARKLE_SERVICE_UUID,
  XPARKLE_WRITE_CHARACTERISTIC_UUID,
  orientationFromByte,
  type XparkleOrientation,
  type XparkleReading,
} from './xparkleProtocol';

/**
 * Live-read poll interval. Matches the official app's leveling screen
 * (500 ms; its device list uses 1000 ms) — evidence the box tolerates the
 * rate.
 */
export const XPARKLE_POLL_INTERVAL_MS = 500;

/**
 * A read that never settles would stall the poll loop behind its in-flight
 * guard. Longer than any BLE round trip, shorter than the descriptor's
 * staleness timeout, so a wedged link surfaces as 'disconnected' rather than
 * as silently frozen guidance.
 */
export const XPARKLE_READ_TIMEOUT_MS = 2000;

/** How long "try again" waits for the box's password verdict. */
export const XPARKLE_PASSWORD_REPLY_TIMEOUT_MS = XPARKLE_READ_TIMEOUT_MS;

export const XPARKLE_ADVERTISEMENT_WAIT_MS = BLE_ADVERTISEMENT_WAIT_MS;

export interface XparkleConnection {
  /** Web Bluetooth's device id, remembered for a silent reconnect through
   * `getDevices()`. */
  readonly deviceId: string;
  /** Subscribe to `fff4` (command replies — never live readings). */
  subscribeNotify(onData: (view: DataView) => void): Promise<void>;
  /** One read of `fff2`. Rejects or resolves null when it cannot be read. */
  readLive(): Promise<DataView | null>;
  /** Write one framed command to `fff3`. */
  write(frame: Uint8Array): Promise<void>;
  disconnect(): void;
}

/** Seam over Web Bluetooth, so the connect state machine is testable with a
 * fake (`navigator.bluetooth` does not exist in Vitest). */
export interface XparkleTransport {
  /** Shows the OS device picker and connects. Needs a live user gesture. */
  connect(onDisconnect: () => void): Promise<XparkleConnection>;
  /** Silent reconnect to an already-authorized device — no picker, no
   * gesture. Resolves null (never rejects) for every "cannot do this
   * silently" reason, so they all degrade onto the gesture path. */
  reconnect(deviceId: string, onDisconnect: () => void): Promise<XparkleConnection | null>;
}

export interface XparkleSensor extends ExternalSensor {
  /** The latest reading (battery included), raw as the box reports it —
   * before any learned mounting, which is what learning a new one needs. */
  getReading(): XparkleReading | null;
  /** The mounting orientation the box reports; display only. */
  getOrientation(): XparkleOrientation | null;
  /** True once the box rejected the password — distinct from a failure so
   * the UI can say "wrong password" rather than blaming the hardware. */
  isPasswordRejected(): boolean;
  /**
   * Offer `getPassword()` again on the live link and resolve with the box's
   * verdict: true accepted, false rejected, null when no box is connected,
   * the code is not four digits, or no answer came in time. Never
   * reconnects, so readings keep flowing.
   */
  verifyPassword(): Promise<boolean | null>;
  /**
   * Zero the box where it sits with its own `resetZero`; it then reports
   * angles relative to this position. The box must stand upright: lying
   * down, turning it about its own axis changes both angles, so no zero
   * holds (found on hardware). Resolves true once written, false when no box
   * is connected or the write failed; never retried. The only command that
   * changes the box's stored state, and only from an explicit user action.
   */
  zeroBox(): Promise<boolean>;
}

/** The password reply (command `4`) carries its verdict in byte 4: zero is
 * "accepted", matching the official app's own `setPwd(bArr[4] == 0)`. */
function passwordAccepted(frame: Uint8Array): boolean {
  return frame.length > 4 && frame[4] === 0;
}

export interface XparkleSensorOptions {
  /** The box's four-digit password. Defaults to the factory `"0000"`. */
  getPassword?: () => string;
  /**
   * How the box sits in the vehicle as learned on its page, or null for its
   * own axes. Read on every reading, so a new mounting applies at once.
   */
  getAxisMapping?: () => AxisMapping | null;
  /** Injectable for tests; real timers in the browser. */
  setTimer?: (handler: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
  now?: () => number;
}

interface Timers {
  setTimer: (handler: () => void, ms: number) => number;
  clearTimer: (id: number) => void;
}

function vehicleGravity(reading: XparkleReading, mapping: AxisMapping | null): GravityVector {
  if (!mapping) return gravityFromReading(reading);
  const mapped = applyAxisMapping(reading, mapping);
  return gravityFromAngles(mapped.rollDeg, mapped.pitchDeg);
}

function withTimeout<T>(promise: Promise<T>, ms: number, timers: Timers): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = timers.setTimer(() => reject(new Error('read timed out')), ms);
    promise.then(
      (value) => {
        timers.clearTimer(timer);
        resolve(value);
      },
      (error: unknown) => {
        timers.clearTimer(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/** Command byte 4 (`XPARKLE_COMMAND.password`) marks the password verdict. */
function isPasswordReply(frame: Uint8Array): boolean {
  return frame.length > 2 && frame[2] === 0x04;
}

/** Rescheduled after each attempt ends rather than on a fixed interval, so a
 * slow read delays the next one instead of stacking behind it. */
function createPollLoop(
  poll: () => Promise<void>,
  isConnected: () => boolean,
  intervalMs: number,
  timers: Timers,
) {
  let timer: number | null = null;
  function stop(): void {
    if (timer !== null) timers.clearTimer(timer);
    timer = null;
  }
  function tick(): void {
    void poll().finally(() => {
      if (isConnected()) timer = timers.setTimer(tick, intervalMs);
    });
  }
  return {
    start() {
      stop();
      tick();
    },
    stop,
  };
}

/**
 * The official app's post-connect sequence, minus its serial-number read
 * (used only for its update check). Every step is best-effort: only the
 * `fff2` read is required for leveling.
 */
async function sendHandshake(
  live: XparkleConnection,
  onReply: (view: DataView) => void,
  password: string,
): Promise<void> {
  try {
    await live.subscribeNotify(onReply);
  } catch {
    // No replies, so no orientation and no password verdict.
  }
  const frame = buildPasswordFrame(
    XPARKLE_PASSWORD_MODE.verify,
    XPARKLE_DEFAULT_PASSWORD,
    password,
  );
  if (frame) {
    try {
      await live.write(frame);
    } catch {
      // "Unknown", not "rejected": a failed write says nothing about the
      // password itself.
    }
  }
  try {
    await live.write(buildQueryParameters());
  } catch {
    // Orientation stays null; it is display-only.
  }
}

export function createXparkleSensor(
  transport: XparkleTransport,
  options: XparkleSensorOptions = {},
): XparkleSensor {
  const getPassword = options.getPassword ?? (() => XPARKLE_DEFAULT_PASSWORD);
  const getAxisMapping = options.getAxisMapping ?? (() => null);
  const timers: Timers = {
    setTimer: options.setTimer ?? ((handler, ms) => setTimeout(handler, ms) as unknown as number),
    clearTimer: options.clearTimer ?? ((id) => clearTimeout(id)),
  };
  const now = options.now ?? (() => performance.now());

  let connection: XparkleConnection | null = null;
  let state: SensorState = 'idle';
  let gravity: GravityVector | null = null;
  let reading: XparkleReading | null = null;
  let orientation: XparkleOrientation | null = null;
  let passwordRejected = false;
  let onPasswordVerdict: ((accepted: boolean | null) => void) | null = null;
  let deviceId: string | null = null;
  let lastSampleAt: number | null = null;
  let pollInFlight = false;
  const replies = createXparkleFrameReassembler();
  const polling = createPollLoop(
    pollOnce,
    () => connection !== null,
    XPARKLE_POLL_INTERVAL_MS,
    timers,
  );

  /** Clears the last reading too, so a stale value is never taken for a
   * live one. */
  function markDisconnected(): void {
    polling.stop();
    replies.reset();
    connection = null;
    gravity = null;
    reading = null;
    state = 'disconnected';
  }

  function handleReply(view: DataView): void {
    const frame = replies.push(view);
    if (!frame) return;
    const parameters = parseParameterReply(frame);
    if (parameters) {
      orientation = orientationFromByte(parameters.installationOrientation);
    } else if (isPasswordReply(frame)) {
      passwordRejected = !passwordAccepted(frame);
      onPasswordVerdict?.(!passwordRejected);
    }
  }

  function acceptReading(parsed: XparkleReading): void {
    reading = parsed;
    gravity = vehicleGravity(parsed, getAxisMapping());
    lastSampleAt = now();
  }

  async function pollOnce(): Promise<void> {
    const live = connection;
    if (!live || pollInFlight) return;
    pollInFlight = true;
    try {
      const view = await withTimeout(live.readLive(), XPARKLE_READ_TIMEOUT_MS, timers);
      const parsed = view ? parseLivePayload(view) : null;
      // An unparseable payload is a bad packet, not a lost link;
      // `staleTimeoutMs` hides the guidance if they keep coming.
      if (parsed) acceptReading(parsed);
    } catch {
      // A failed or timed-out read is the link going — but only this read's
      // link: a newer one adopted meanwhile has not failed.
      if (connection === live) dropFailedLink(live);
    } finally {
      pollInFlight = false;
    }
  }

  /**
   * The link is actively closed: a BLE peripheral does not advertise while
   * it still holds a GATT connection, so a half-open link left behind makes
   * every later Retry miss a box sitting right there. The transport's
   * teardown removes its disconnect listener first, so this is not reported
   * as a second lost connection.
   */
  function dropFailedLink(live: XparkleConnection): void {
    markDisconnected();
    live.disconnect();
  }

  async function adopt(live: XparkleConnection): Promise<SensorState> {
    connection = live;
    deviceId = live.deviceId;
    state = 'granted';
    replies.reset();
    passwordRejected = false;
    await sendHandshake(live, handleReply, getPassword());
    polling.start();
    return state;
  }

  /** The box's next password verdict, or null after the reply timeout. */
  function nextPasswordVerdict(): Promise<boolean | null> {
    return new Promise<boolean | null>((resolve) => {
      const timer = timers.setTimer(() => finish(null), XPARKLE_PASSWORD_REPLY_TIMEOUT_MS);
      function finish(result: boolean | null): void {
        timers.clearTimer(timer);
        onPasswordVerdict = null;
        resolve(result);
      }
      onPasswordVerdict = finish;
    });
  }

  return {
    async start() {
      try {
        return await adopt(await transport.connect(markDisconnected));
      } catch {
        // A cancelled picker and a failed connect are the same to the
        // caller. A box already lost stays lost, so Retry's cancelled picker
        // keeps the unavailable prompt and its background retry.
        if (state !== 'disconnected') state = 'denied';
        return state;
      }
    },

    async reconnect(id) {
      try {
        const live = await transport.reconnect(id, markDisconnected);
        if (live) return await adopt(live);
      } catch {
        // Silent by design, like a box that cannot be found.
      }
      state = 'disconnected';
      return state;
    },

    disconnect() {
      const live = connection;
      markDisconnected();
      state = 'idle';
      live?.disconnect();
    },

    getState: () => state,
    getGravity: () => gravity,
    getSource: (): SensorSource => 'xparkle',
    getLastSampleAt: () => lastSampleAt,
    getDeviceId: () => deviceId,
    getReading: () => reading,
    getOrientation: () => orientation,
    isPasswordRejected: () => passwordRejected,

    async verifyPassword() {
      const live = connection;
      const frame = buildPasswordFrame(
        XPARKLE_PASSWORD_MODE.verify,
        XPARKLE_DEFAULT_PASSWORD,
        getPassword(),
      );
      if (!live || !frame) return null;
      const verdict = nextPasswordVerdict();
      try {
        await live.write(frame);
      } catch {
        // A failed write says nothing about the code itself.
        onPasswordVerdict?.(null);
      }
      return verdict;
    },

    async zeroBox() {
      const live = connection;
      if (!live) return false;
      try {
        await live.write(buildResetZero());
        return true;
      } catch {
        return false;
      }
    },
  };
}

/**
 * The real Web Bluetooth transport.
 *
 * The official app scans unfiltered and matches the advertised name
 * (`RVLevel` / `RVbalance`), so whether the box advertises
 * `XPARKLE_SERVICE_UUID` is unknown — and filtering EasyLevel on a service
 * real boxes never advertise left the OS picker empty. So both kinds of
 * filter are listed: `requestDevice()` matches ANY filter, so an extra one
 * can only widen the picker, never narrow it.
 */
export function createXparkleWebBluetoothTransport(): XparkleTransport {
  return createWebBluetoothLink({
    name: 'Xparkle',
    requestOptions: {
      filters: [
        ...XPARKLE_DEVICE_NAME_FRAGMENTS.map((namePrefix) => ({ namePrefix })),
        { services: [XPARKLE_SERVICE_UUID] },
      ],
      optionalServices: [XPARKLE_SERVICE_UUID],
    },
    wire: wireXparkle,
  });
}

/** The notify characteristic opens only when the sensor subscribes. */
async function wireXparkle(
  server: BluetoothRemoteGATTServer,
): Promise<Omit<XparkleConnection, 'deviceId' | 'disconnect'>> {
  const service = await server.getPrimaryService(XPARKLE_SERVICE_UUID);
  const live = await service.getCharacteristic(XPARKLE_LIVE_CHARACTERISTIC_UUID);
  const write = await service.getCharacteristic(XPARKLE_WRITE_CHARACTERISTIC_UUID);
  return {
    async subscribeNotify(onData) {
      const notify = await service.getCharacteristic(XPARKLE_NOTIFY_CHARACTERISTIC_UUID);
      notify.addEventListener('characteristicvaluechanged', () => {
        if (notify.value) onData(notify.value);
      });
      await notify.startNotifications();
    },
    readLive: () => live.readValue(),
    write: (frame) => write.writeValue(frame),
  };
}

/** Real Web Bluetooth: Chrome/Android only, never Safari/iOS, where users
 * are pointed at Bluefy instead (R39). */
export function isXparkleWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/** Real Web Bluetooth or the simulated box: the one gate for "does this
 * source exist here at all". */
export function isXparkleAvailable(): boolean {
  return isXparkleWebBluetoothSupported() || xparkleSimulationMode() !== 'off';
}

/** The simulated box whenever its flag is on, real Web Bluetooth otherwise —
 * chosen at this one seam, so everything above it is the code a real box
 * runs through. */
export function createXparkleTransport(): XparkleTransport {
  const simulation = xparkleSimulationMode();
  return simulation !== 'off'
    ? createSimulatedXparkleTransport(simulation)
    : createXparkleWebBluetoothTransport();
}

/**
 * This box as the registry sees it (ADR 0016). `mounting: false`: the box
 * applies its own stored orientation, so Libell's picker would
 * double-correct (see the top of this file). The protocol carries no
 * temperature or debug bytes, so those rows are not drawn.
 */
export const XPARKLE_DESCRIPTOR: ExternalSensorDescriptor = {
  id: 'xparkle',
  displayName: 'Xparkle RVS01',
  isAvailable: isXparkleAvailable,
  capabilities: {
    battery: true,
    temperature: false,
    firmwareVersion: false,
    mounting: false,
    installCalibration: true,
    debugBytes: false,
    reportedOrientation: true,
    learnMounting: true,
    upright: true,
    zeroesItself: true,
  },
  // Not tightened below EasyLevel's 4 s despite 500 ms polling: a busy
  // connection interval can delay a BLE read, and R35's overlay hiding
  // guidance is disruptive.
  staleTimeoutMs: 4000,
};
