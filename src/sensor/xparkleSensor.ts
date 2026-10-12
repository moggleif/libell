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
import type { AxisMapping } from '../domain/axisMapping';
import type { ExternalSensor } from './externalSensorController';
import type { ExternalSensorDescriptor } from './externalSensors';
import {
  connectWithPicker,
  createXparkleLink,
  disconnectByUser,
  reconnectSilently,
  type LinkOptions,
  type XparkleLink,
} from './xparkleLink';
import {
  buildPasswordFrame,
  buildResetZero,
  XPARKLE_DEFAULT_PASSWORD,
  XPARKLE_PASSWORD_MODE,
  type XparkleOrientation,
  type XparkleReading,
} from './xparkleProtocol';
import {
  isXparkleAvailable,
  type XparkleConnection,
  type XparkleTransport,
} from './xparkleTransport';

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

export function createXparkleSensor(
  transport: XparkleTransport,
  options: XparkleSensorOptions = {},
): XparkleSensor {
  const link = createXparkleLink(withDefaults(options));
  const { readings, replies } = link;
  return {
    start: () => connectWithPicker(link, transport),
    reconnect: (deviceId) => reconnectSilently(link, transport, deviceId),
    disconnect: () => disconnectByUser(link),
    getState: () => link.state,
    getGravity: readings.getGravity,
    getSource: () => 'xparkle',
    getLastSampleAt: readings.getLastSampleAt,
    getDeviceId: () => link.deviceId,
    getReading: readings.getReading,
    getOrientation: replies.getOrientation,
    isPasswordRejected: replies.isPasswordRejected,
    verifyPassword: () => verifyPassword(link),
    zeroBox: () => zeroBox(link.connection),
  };
}

function withDefaults(options: XparkleSensorOptions): LinkOptions {
  return {
    getPassword: options.getPassword ?? (() => XPARKLE_DEFAULT_PASSWORD),
    getAxisMapping: options.getAxisMapping ?? (() => null),
    timers: {
      setTimer: options.setTimer ?? ((handler, ms) => setTimeout(handler, ms) as unknown as number),
      clearTimer: options.clearTimer ?? ((id) => clearTimeout(id)),
    },
    now: options.now ?? (() => performance.now()),
  };
}

async function verifyPassword(link: XparkleLink): Promise<boolean | null> {
  const live = link.connection;
  const frame = buildPasswordFrame(
    XPARKLE_PASSWORD_MODE.verify,
    XPARKLE_DEFAULT_PASSWORD,
    link.options.getPassword(),
  );
  if (!live || !frame) return null;
  const verdict = link.replies.nextPasswordVerdict();
  try {
    await live.write(frame);
  } catch {
    // A failed write says nothing about the code itself.
    link.replies.abandonPasswordVerdict();
  }
  return verdict;
}

async function zeroBox(live: XparkleConnection | null): Promise<boolean> {
  if (!live) return false;
  try {
    await live.write(buildResetZero());
    return true;
  } catch {
    return false;
  }
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
