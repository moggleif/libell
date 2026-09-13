/**
 * Xparkle RVS01 (SkyRC) — Web Bluetooth transport and `OrientationSensor`
 * implementation (#270), built on `xparkleProtocol.ts`'s codec (#269).
 *
 * Same shape as `easyLevelSensor.ts`: a thin injectable transport seam so
 * the whole connect state machine is unit-testable with a fake, plus the
 * adapter that turns readings into the `GravityVector` the seam requires
 * (ADR 0014). Two things differ, and neither is cosmetic:
 *
 * **1. The live reading is polled, not notified.** The official app reads
 * `fff2` every 500–1000 ms; `fff4`'s notifications carry only command
 * replies. So this adapter owns a poll loop, which `easyLevelSensor.ts`
 * has no equivalent of, and stops it the moment the connection goes — a
 * GATT read every half second is not free on the box's AA batteries.
 *
 * **2. It expects to be written to.** The app's own connect sequence is:
 * enable notifications on `fff4`, read the serial number, send the
 * password (command `4`, default `"0000"`), query the stored parameters
 * (command `2`), and only then start polling. `easyLevelSensor.ts` never
 * writes anything at all.
 *
 * ## The two decisions #270 asked to be made here
 *
 * **Mounting orientation: the box's own, never Libell's.** The box stores
 * an installation orientation (front/rear/left/right) and — unlike
 * EasyLevel, which streams raw accelerometer axes — it applies that
 * orientation itself before reporting finished angles. Applying Libell's
 * own rotation on top would double-correct: a box configured "left" would
 * be rotated twice and name the wrong wheel while looking plausible. So
 * the descriptor declares `mounting: false`, no picker is offered, and
 * `getOrientation()` below exposes what the box reports for display only.
 * The vendor app remains the place to change it, which is also where the
 * user set it up in the first place.
 *
 * **The password does not gate readings here.** Whether the box refuses to
 * serve `fff2` before command `4` is unknown and unknowable from the app,
 * which always logs in first (#273). This adapter sends the password and
 * then polls regardless of what the reply says: if the box does not gate
 * reads, everything works; if it does, the reads fail and the ordinary
 * `'disconnected'` path takes over. `isPasswordRejected()` records the
 * rejection separately so the UI can say "wrong password" rather than
 * "the box is broken" (#272 renders it).
 *
 * **No box command that changes stored state is ever issued
 * automatically.** `resetZero` and `setParameters` exist in the codec, and
 * this adapter deliberately calls neither: the box remembers its own
 * configuration, and silently rewriting a user's setup is worse than not
 * supporting it at all.
 */
import type { GravityVector } from '../domain/leveling';
import type { SensorSource } from '../domain/settings';
import type { ExternalSensor } from './externalSensorController';
import type { SensorState } from './orientation';
import type { ExternalSensorDescriptor } from './externalSensors';
import {
  buildPasswordFrame,
  buildQueryParameters,
  createXparkleFrameReassembler,
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
 * How often the live characteristic is read while connected.
 *
 * The official app uses 500 ms on its own leveling screen and 1000 ms on
 * its device list; 500 ms is the one worth matching, since that is the
 * screen a user is actually watching while they drive onto ramps, and it
 * is evidence the box tolerates that rate. Libell polls at one rate rather
 * than two because it has one screen that consumes readings.
 *
 * Not a guess about battery life: what a box tolerates comfortably over a
 * long session is exactly the kind of thing #273's bench session should
 * confirm.
 */
export const XPARKLE_POLL_INTERVAL_MS = 500;

/**
 * A read that neither resolves nor rejects would stall the poll loop
 * forever behind its own in-flight guard, so one is given this long before
 * the connection is treated as lost. Comfortably longer than a BLE round
 * trip at any connection interval, comfortably shorter than the
 * descriptor's staleness timeout, so a genuinely wedged link surfaces as
 * 'disconnected' rather than as silently frozen guidance.
 */
export const XPARKLE_READ_TIMEOUT_MS = 2000;

/** One connected box. */
export interface XparkleConnection {
  /** Web Bluetooth's own device id (#130) — remembered for a later silent
   * reconnect through `getDevices()`. */
  readonly deviceId: string;
  /** Subscribe to `fff4` (command replies — never live readings). */
  subscribeNotify(onData: (view: DataView) => void): Promise<void>;
  /** One read of `fff2`. Rejects or resolves null when it cannot be read. */
  readLive(): Promise<DataView | null>;
  /** Write one framed command to `fff3`. */
  write(frame: Uint8Array): Promise<void>;
  disconnect(): void;
}

/**
 * Thin seam over Web Bluetooth, so everything below can be unit-tested
 * with a fake implementing this same shape — the same split
 * `easyLevelSensor.ts` uses, and for the same reason: there is no physical
 * box, and `navigator.bluetooth` does not exist in Vitest.
 */
export interface XparkleTransport {
  /** Shows the OS device picker and connects. Needs a live user gesture. */
  connect(onDisconnect: () => void): Promise<XparkleConnection>;
  /** Silent reconnect to an already-authorized device — no picker, no
   * gesture. Resolves null (never rejects) for every "cannot do this
   * silently" reason, so they all degrade onto the gesture path. */
  reconnect(deviceId: string, onDisconnect: () => void): Promise<XparkleConnection | null>;
}

export interface XparkleSensor extends ExternalSensor {
  /** The most recent parsed reading, or null — battery included, for the
   * device page's health row. */
  getReading(): XparkleReading | null;
  /** The mounting orientation the box itself reports (display only — see
   * the module doc comment for why Libell never applies its own). */
  getOrientation(): XparkleOrientation | null;
  /**
   * True once the box has answered the password command with a rejection.
   * Distinct from a plain failure so the UI can say "wrong password"
   * rather than blaming the hardware.
   */
  isPasswordRejected(): boolean;
}

/** The password reply (command `4`) carries its verdict in byte 4: zero is
 * "accepted", matching the official app's own `setPwd(bArr[4] == 0)`. */
function passwordAccepted(frame: Uint8Array): boolean {
  return frame.length > 4 && frame[4] === 0;
}

export interface XparkleSensorOptions {
  /** The box's four-digit password. Defaults to the factory `"0000"`. */
  getPassword?: () => string;
  /** Injectable for tests; real timers in the browser. */
  setTimer?: (handler: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
  now?: () => number;
}

export function createXparkleSensor(
  transport: XparkleTransport,
  options: XparkleSensorOptions = {},
): XparkleSensor {
  const getPassword = options.getPassword ?? (() => XPARKLE_DEFAULT_PASSWORD);
  const setTimer =
    options.setTimer ?? ((handler, ms) => setTimeout(handler, ms) as unknown as number);
  const clearTimer = options.clearTimer ?? ((id) => clearTimeout(id));
  const now = options.now ?? (() => performance.now());

  let connection: XparkleConnection | null = null;
  let state: SensorState = 'idle';
  let gravity: GravityVector | null = null;
  let reading: XparkleReading | null = null;
  let orientation: XparkleOrientation | null = null;
  let passwordRejected = false;
  let deviceId: string | null = null;
  let lastSampleAt: number | null = null;
  let pollTimer: number | null = null;
  let pollInFlight = false;
  const replies = createXparkleFrameReassembler();

  function stopPolling(): void {
    if (pollTimer !== null) clearTimer(pollTimer);
    pollTimer = null;
  }

  /** Everything a lost link must reset — including the last reading, so a
   * stale value can never be mistaken for a live one. */
  function markDisconnected(): void {
    stopPolling();
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
      return;
    }
    // The only other reply this adapter cares about is the password
    // verdict; command byte 4, per `XPARKLE_COMMAND.password`.
    if (frame.length > 2 && frame[2] === 0x04) passwordRejected = !passwordAccepted(frame);
  }

  async function pollOnce(): Promise<void> {
    const live = connection;
    if (!live || pollInFlight) return;
    pollInFlight = true;
    try {
      const view = await withTimeout(live.readLive());
      const parsed = view ? parseLivePayload(view) : null;
      if (parsed) {
        reading = parsed;
        gravity = gravityFromReading(parsed);
        lastSampleAt = now();
      }
      // A payload that parses to null is a bad packet, not a lost link:
      // the next poll is 500 ms away, and `staleTimeoutMs` is what
      // eventually hides the guidance if they keep coming.
    } catch {
      // A read that fails or times out is the link going, not a bad
      // packet — the ordinary 'disconnected' path (retry, fallback prompt)
      // takes it from here.
      markDisconnected();
    } finally {
      pollInFlight = false;
    }
  }

  function withTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimer(() => reject(new Error('read timed out')), XPARKLE_READ_TIMEOUT_MS);
      promise.then(
        (value) => {
          clearTimer(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimer(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }

  function startPolling(): void {
    stopPolling();
    const tick = () => {
      void pollOnce().finally(() => {
        // Rescheduled after each attempt rather than on a fixed interval,
        // so a slow read delays the next one instead of stacking behind it.
        if (connection) pollTimer = setTimer(tick, XPARKLE_POLL_INTERVAL_MS);
      });
    };
    tick();
  }

  /**
   * The official app's own post-connect sequence, minus the serial-number
   * read it uses only for its update check: subscribe, send the password,
   * ask for the stored parameters. Every step is best-effort — a box that
   * refuses any of them must not stop leveling from working, since only
   * the `fff2` read is actually required for that.
   */
  async function handshake(live: XparkleConnection): Promise<void> {
    replies.reset();
    passwordRejected = false;
    try {
      await live.subscribeNotify(handleReply);
    } catch {
      // No replies, so no orientation and no password verdict — the live
      // read below is unaffected.
    }
    const frame = buildPasswordFrame(
      XPARKLE_PASSWORD_MODE.verify,
      XPARKLE_DEFAULT_PASSWORD,
      getPassword(),
    );
    if (frame) {
      try {
        await live.write(frame);
      } catch {
        // Treated as "unknown", not "rejected": a failed write says
        // nothing about whether the password itself is right.
      }
    }
    try {
      await live.write(buildQueryParameters());
    } catch {
      // Orientation stays null; it is display-only.
    }
  }

  async function adopt(live: XparkleConnection): Promise<SensorState> {
    connection = live;
    deviceId = live.deviceId;
    state = 'granted';
    await handshake(live);
    startPolling();
    return state;
  }

  return {
    async start() {
      try {
        return await adopt(await transport.connect(markDisconnected));
      } catch {
        // A cancelled picker and a failed connect are the same to the
        // caller: nothing is connected, and a tap can try again.
        state = 'denied';
        return state;
      }
    },

    async reconnect(id) {
      try {
        const live = await transport.reconnect(id, markDisconnected);
        if (!live) {
          state = 'disconnected';
          return state;
        }
        return await adopt(live);
      } catch {
        state = 'disconnected';
        return state;
      }
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
  };
}

/**
 * The real Web Bluetooth transport.
 *
 * **The scan filter is the one thing here that is genuinely uncertain.**
 * The official app scans with no service filter at all and matches on the
 * advertised name (`RVLevel` / `RVbalance`), so nothing in the APK says
 * whether the box advertises `XPARKLE_SERVICE_UUID` — and #215 had to undo
 * exactly this mistake for EasyLevel, where filtering `requestDevice()` on
 * a service real boxes never advertise meant the OS picker listed nothing.
 * So the filter list carries both: the name prefixes the app is known to
 * match, and the service UUID in case the box does advertise it.
 * `requestDevice()` matches a device against ANY filter, so an extra
 * filter can only widen the picker, never narrow it. #273 settles which
 * one actually fires.
 */
export function createXparkleWebBluetoothTransport(): XparkleTransport {
  async function connectToDevice(
    device: BluetoothDevice,
    onDisconnect: () => void,
  ): Promise<XparkleConnection> {
    device.addEventListener('gattserverdisconnected', onDisconnect);
    // One teardown for the explicit disconnect AND every failure past this
    // point (#219's lesson, which applies to any BLE box): the listener
    // goes first, so a deliberate disconnect is never mis-reported as a
    // lost connection, and the GATT link is actively closed so a half-open
    // one cannot make the box invisible to later scans.
    const teardown = () => {
      device.removeEventListener('gattserverdisconnected', onDisconnect);
      device.gatt?.disconnect();
    };
    try {
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Xparkle: GATT connect failed');
      const service = await server.getPrimaryService(XPARKLE_SERVICE_UUID);
      const live = await service.getCharacteristic(XPARKLE_LIVE_CHARACTERISTIC_UUID);
      const write = await service.getCharacteristic(XPARKLE_WRITE_CHARACTERISTIC_UUID);

      return {
        deviceId: device.id,
        async subscribeNotify(onData) {
          const notify = await service.getCharacteristic(XPARKLE_NOTIFY_CHARACTERISTIC_UUID);
          notify.addEventListener('characteristicvaluechanged', () => {
            if (notify.value) onData(notify.value);
          });
          await notify.startNotifications();
        },
        readLive: () => live.readValue(),
        write: (frame) => write.writeValue(frame),
        disconnect: teardown,
      };
    } catch (error) {
      teardown();
      throw error;
    }
  }

  return {
    async connect(onDisconnect) {
      const device = await navigator.bluetooth!.requestDevice({
        filters: [
          ...XPARKLE_DEVICE_NAME_FRAGMENTS.map((namePrefix) => ({ namePrefix })),
          { services: [XPARKLE_SERVICE_UUID] },
        ],
        optionalServices: [XPARKLE_SERVICE_UUID],
      });
      return connectToDevice(device, onDisconnect);
    },
    async reconnect(deviceId, onDisconnect) {
      // Same "only called where navigator.bluetooth exists" contract as
      // connect(), but getDevices() is a second, narrower feature that can
      // be missing even where `bluetooth` itself is not.
      const getDevices = navigator.bluetooth?.getDevices;
      if (typeof getDevices !== 'function') return null;
      try {
        const devices = await getDevices.call(navigator.bluetooth);
        const device = devices.find((candidate) => candidate.id === deviceId);
        if (!device) return null;
        return await connectToDevice(device, onDisconnect);
      } catch {
        // Out of range, powered off, ... — silent by design; the caller
        // decides what "no silent reconnect available" means for its UI.
        return null;
      }
    },
  };
}

/** Web Bluetooth is Chrome/Android only — never Safari/iOS, exactly as for
 * EasyLevel, where iOS is pointed at Bluefy instead (R39). */
export function isXparkleAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * This box as the registry (#262, ADR 0016) sees it.
 *
 * `mounting: false` is the decision documented at the top of this file:
 * the box applies its own stored orientation before reporting angles, so
 * offering Libell's rotation picker as well would double-correct.
 * `temperature` and `debugBytes` are false because this protocol carries
 * neither — #268's capability rendering means those rows are simply not
 * drawn, rather than shown reading "not available yet" (#228).
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
  },
  // Polled every 500 ms, so a silence of several polls is a real fault
  // rather than jitter — but kept at EasyLevel's own 4s rather than
  // tightened, since a BLE read can legitimately be delayed by a busy
  // connection interval and R35's overlay hiding guidance is disruptive.
  staleTimeoutMs: 4000,
};
