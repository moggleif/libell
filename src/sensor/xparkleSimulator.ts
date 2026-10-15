/**
 * Simulated Xparkle RVS01 — an `XparkleTransport` selected by `?xparkle-sim`,
 * plugged in at the same seam as the real one so everything above it is the
 * code a real box runs through. The bytes are the real wire format
 * (`xparkleProtocol.ts`), not a shortcut.
 *
 * Unlike the EasyLevel simulator it models:
 *
 * - **The poll loop.** Readings answer `readLive()` on demand rather than
 *   being pushed — the real difference between the two boxes.
 * - **The login handshake.** The password command gets a real reply frame:
 *   accepted, or in `'badpassword'` mode rejected until the user types that
 *   box's code. A box whose password was changed in the vendor app is the
 *   case most likely to reach real users first, so it must be reachable
 *   without owning one.
 * - **The stored parameters**, so the reported orientation comes from a
 *   real reply.
 *
 * Bytes through the seam only: no `navigator.bluetooth`, no UI. Lives in
 * `sensor/`, not `domain/`, because it owns real timers (ADR 0002).
 */
import { parseParameterReply } from './xparkleReplies';
import {
  buildCommandFrame,
  XPARKLE_COMMAND,
  XPARKLE_DEFAULT_PASSWORD,
  XPARKLE_FRAME_HEADER,
} from './xparkleCommands';
import type { XparkleConnection, XparkleTransport } from './xparkleTransport';
import { createSimulatedLink, type SimulatedSession } from './simulatedLink';

export type XparkleSimulationMode = 'off' | 'steady' | 'drop' | 'badpassword';

/**
 * The `?xparkle-sim` query flag: absent → `'off'`; `=drop` → periodic
 * simulated connection loss; `=badpassword` → a box that rejects the
 * password; any other presence → `'steady'`. Same shape as
 * `?easylevel-sim`.
 */
export function xparkleSimulationMode(
  search: string = typeof location === 'undefined' ? '' : location.search,
): XparkleSimulationMode {
  const params = new URLSearchParams(search);
  if (!params.has('xparkle-sim')) return 'off';
  const value = params.get('xparkle-sim');
  if (value === 'drop') return 'drop';
  if (value === 'badpassword') return 'badpassword';
  return 'steady';
}

/**
 * The code the `'badpassword'` box answers to: not the factory `"0000"`
 * Libell offers first, so the rejection is reached, but one a tester can
 * type on the box's page to get past it.
 */
export const SIMULATED_XPARKLE_BAD_PASSWORD_CODE = '1234';

function simulatedXparklePassword(mode: XparkleSimulationMode): string {
  return mode === 'badpassword' ? SIMULATED_XPARKLE_BAD_PASSWORD_CODE : XPARKLE_DEFAULT_PASSWORD;
}

/** Stable, so the remembered-device store (R33) and silent reconnect work
 * across reloads as with a real box's browser-assigned id. */
export const SIMULATED_XPARKLE_DEVICE_ID = 'xparkle-simulated-box';

/**
 * A simulated id is only findable by the simulated transport and a real one
 * only by the real transport; trying the mismatch strands the app on the
 * "unavailable" prompt with an auto-retry that can never win. The stored id
 * is kept, so returning to the matching mode reconnects normally.
 */
export function isRememberedXparkleDeviceUsable(
  deviceId: string,
  mode: XparkleSimulationMode = xparkleSimulationMode(),
): boolean {
  return (deviceId === SIMULATED_XPARKLE_DEVICE_ID) === (mode !== 'off');
}

/** `'drop'` mode: the link is lost this long after connecting — time to
 * watch live readings, short enough to exercise the R37 prompt and
 * auto-retry in a demo session. */
export const SIMULATED_XPARKLE_DROP_AFTER_MS = 12000;
/** `'drop'` mode: reconnects keep failing this long afterwards, like a box
 * out of range. Longer than one auto-retry interval, so a failed background
 * retry is observable. */
export const SIMULATED_XPARKLE_OUTAGE_MS = 8000;

/** Mirrors `?demo`'s tilt and the EasyLevel simulator's, so the two boxes
 * can be compared screen-for-screen. */
const SIM_ROLL_DEG = -1.2;
const SIM_PITCH_DEG = -0.35;
const SIM_BATTERY_PERCENT = 62;
/** Stored parameters, as the box would report them: cm, a motorhome,
 * 230 × 600, mounted front-facing, 0.5-unit display resolution. */
const SIM_PARAMETERS = [1, 0, 0, 230, 2, 88, 0, 1];
/** What `fff1` answers. A real box's layout is not established
 * (`docs/competitor-notes.md`), so these are plainly simulated: "SIM01"
 * then three bytes, shown as hex like any other. */
export const SIMULATED_XPARKLE_VERSION_BYTES = [0x53, 0x49, 0x4d, 0x30, 0x31, 0x01, 0x04, 0x06];

/** Magnitudes in 1/100° plus a direction flag each, per `parseLivePayload`.
 * The deterministic ±0.02° wobble keeps the live UI visibly updating while
 * staying far inside the stillness detector's tolerance. */
function livePayload(sampleIndex: number, zero: { rollDeg: number; pitchDeg: number }): DataView {
  const wobble = 0.02 * Math.sin(sampleIndex / 9);
  const pitch = SIM_PITCH_DEG - zero.pitchDeg + wobble;
  const roll = SIM_ROLL_DEG - zero.rollDeg + wobble;
  const view = new DataView(new ArrayBuffer(7));
  // Direction flags per `parseLivePayload`: byte 0 set = front high
  // (positive pitch), byte 3 set = left low (positive roll).
  view.setUint8(0, pitch > 0 ? 1 : 0);
  view.setUint16(1, Math.round(Math.abs(pitch) * 100), false);
  view.setUint8(3, roll > 0 ? 1 : 0);
  view.setUint16(4, Math.round(Math.abs(roll) * 100), false);
  view.setUint8(6, SIM_BATTERY_PERCENT);
  return view;
}

export function createSimulatedXparkleTransport(
  mode: Exclude<XparkleSimulationMode, 'off'> = 'steady',
): XparkleTransport {
  // The box's own zero is stored in the box, so it outlives a connection.
  const zero = { rollDeg: 0, pitchDeg: 0 };
  return createSimulatedLink({
    deviceId: SIMULATED_XPARKLE_DEVICE_ID,
    drop:
      mode === 'drop'
        ? { dropAfterMs: SIMULATED_XPARKLE_DROP_AFTER_MS, outageMs: SIMULATED_XPARKLE_OUTAGE_MS }
        : null,
    open: (session) => openSimulatedXparkle(session, mode, zero),
  });
}

function openSimulatedXparkle(
  session: SimulatedSession,
  mode: Exclude<XparkleSimulationMode, 'off'>,
  zero: { rollDeg: number; pitchDeg: number },
): Omit<XparkleConnection, 'deviceId' | 'disconnect'> {
  let sampleIndex = 0;
  let notify: ((view: DataView) => void) | null = null;

  /** As the box does: on the notify characteristic, one frame per command,
   * asynchronously. */
  function answer(frame: Uint8Array): void {
    session.after(10, () => notify?.(new DataView(frame.buffer.slice(0))));
  }

  return {
    subscribeNotify: (onData) => {
      notify = onData;
      return Promise.resolve();
    },
    readLive: () => {
      if (!session.isLive()) return Promise.reject(new Error('simulated box: link lost'));
      return Promise.resolve(livePayload(sampleIndex++, zero));
    },
    readVersion: () => {
      if (!session.isLive()) return Promise.reject(new Error('simulated box: link lost'));
      return Promise.resolve(new DataView(Uint8Array.from(SIMULATED_XPARKLE_VERSION_BYTES).buffer));
    },
    write: (frame) => {
      if (!session.isLive()) return Promise.reject(new Error('simulated box: link lost'));
      if (frame.length < 3 || frame[0] !== XPARKLE_FRAME_HEADER) {
        return Promise.reject(new Error('simulated box: not a command frame'));
      }
      runCommand(frame, mode, zero, answer);
      return Promise.resolve();
    },
  };
}

/** What the box does with one command frame. Other commands are accepted
 * silently: Libell sends none, and invented replies would only test the
 * simulator itself. */
function runCommand(
  frame: Uint8Array,
  mode: Exclude<XparkleSimulationMode, 'off'>,
  zero: { rollDeg: number; pitchDeg: number },
  answer: (frame: Uint8Array) => void,
): void {
  if (frame[2] === XPARKLE_COMMAND.password) {
    // Reply byte 4 is the verdict: 0 accepted, anything else rejected
    // (the app's `setPwd(bArr[4] == 0)`). The code offered is the
    // frame's "new" field, bytes 5–8.
    const offered = [...frame.subarray(5, 9)].join('');
    const accepted = offered === simulatedXparklePassword(mode);
    answer(buildCommandFrame(XPARKLE_COMMAND.password, [accepted ? 0 : 1]));
  } else if (frame[2] === XPARKLE_COMMAND.queryParameters) {
    answer(buildCommandFrame(XPARKLE_COMMAND.queryParameters, SIM_PARAMETERS));
  } else if (frame[2] === XPARKLE_COMMAND.resetZero) {
    // No reply modelled: whether a real box answers is unknown, and
    // Libell does not wait for one.
    zero.rollDeg = SIM_ROLL_DEG;
    zero.pitchDeg = SIM_PITCH_DEG;
  }
}

/** The parameter reply this simulator sends, parsed, so tests need not
 * restate the bytes. */
export function simulatedXparkleParameters() {
  return parseParameterReply(buildCommandFrame(XPARKLE_COMMAND.queryParameters, SIM_PARAMETERS));
}
