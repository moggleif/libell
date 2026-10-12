/**
 * Simulated Xparkle RVS01 (#271) — an `XparkleTransport` stand-in for
 * `createXparkleWebBluetoothTransport()`, selected by the `?xparkle-sim`
 * query flag, so the whole flow can be exercised with no physical box and
 * no Web Bluetooth at all.
 *
 * Same shape and same philosophy as `easyLevelSimulator.ts` (#220): a
 * synthetic stand-in behind a query flag, plugged in one seam below
 * everything that matters, so the sensor state machine, the calibration,
 * the pages and the fallback prompt are all exactly the code a real box
 * runs through. The bytes here are the real wire format
 * (`xparkleProtocol.ts`'s documented layouts), not a convenient shortcut.
 *
 * What this simulator has to model that #220's did not:
 *
 * - **The poll loop.** Readings are answered on demand from `readLive()`
 *   rather than pushed on a timer, which is the actual difference between
 *   the two boxes and the thing most likely to be got wrong.
 * - **The login handshake.** Writes are parsed, and the password command
 *   is answered with a real reply frame — accepted, or rejected in
 *   `'badpassword'` mode until the user types that box's code (#367). That case is the one most likely to reach a real
 *   user first (a box whose password was changed in the vendor app) and
 *   the least likely to be right first time, so it needs to be reachable
 *   deliberately rather than only by owning a box.
 * - **The stored parameters**, so the orientation the device page shows
 *   comes from a real reply rather than from nothing.
 *
 * Deliberately NOT here: any hook into `navigator.bluetooth`, and any
 * i18n/UI — this speaks bytes through the existing seam and nothing else.
 * Lives in `sensor/`, not `domain/`: it owns real timers (ADR 0002 keeps
 * those out of the domain layer), which tests drive with fake ones.
 */
import {
  buildCommandFrame,
  parseParameterReply,
  XPARKLE_COMMAND,
  XPARKLE_DEFAULT_PASSWORD,
  XPARKLE_FRAME_HEADER,
} from './xparkleProtocol';
import type { XparkleConnection, XparkleTransport } from './xparkleSensor';
import { createSimulatedLink, type SimulatedSession } from './simulatedLink';

export type XparkleSimulationMode = 'off' | 'steady' | 'drop' | 'badpassword';

/**
 * The `?xparkle-sim` query flag: absent → `'off'`; `=drop` → periodic
 * simulated connection loss; `=badpassword` → a box that rejects the
 * password; any other presence → `'steady'`.
 *
 * Deliberately the same shape as `?easylevel-sim` rather than a unified
 * `?sensor-sim=<source>`: that flag is documented in `CLAUDE.md` and used
 * by hand, and renaming it would be churn with no gain. Two flags of
 * identical shape are one convention, not two.
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
 * The code the `'badpassword'` box answers to (#367): not the factory
 * `"0000"` Libell offers first, so the rejection is reached, but one a
 * tester can type on the box's page to see the way out of it.
 */
export const SIMULATED_XPARKLE_BAD_PASSWORD_CODE = '1234';

/** The code a simulated box accepts: the factory one, unless it is the
 * box whose password was changed. */
function simulatedXparklePassword(mode: XparkleSimulationMode): string {
  return mode === 'badpassword' ? SIMULATED_XPARKLE_BAD_PASSWORD_CODE : XPARKLE_DEFAULT_PASSWORD;
}

/** Stable fake device id, so the remembered-device store (#130/R33) and
 * the silent reconnect path work across reloads exactly as with a real
 * box's browser-assigned id. */
export const SIMULATED_XPARKLE_DEVICE_ID = 'xparkle-simulated-box';

/**
 * Whether a remembered device id could possibly be reached in the current
 * simulation mode (#223's lesson, applied here before it can bite): a
 * simulated id is only findable by the simulated transport and a real one
 * only by the real transport, so attempting the mismatched pairing cannot
 * succeed — and failing to check strands the app on the "unavailable"
 * prompt with an auto-retry that can never win. Left as "not reachable
 * right now" rather than clearing the stored id, so returning to the
 * matching mode reconnects normally.
 */
export function isRememberedXparkleDeviceUsable(
  deviceId: string,
  mode: XparkleSimulationMode = xparkleSimulationMode(),
): boolean {
  return (deviceId === SIMULATED_XPARKLE_DEVICE_ID) === (mode !== 'off');
}

/** `'drop'` mode: how long after connecting the simulated link is lost —
 * long enough to watch live readings first, short enough to exercise the
 * R37 prompt and the #211 auto-retry within a demo session. */
export const SIMULATED_XPARKLE_DROP_AFTER_MS = 12000;
/** `'drop'` mode: how long a reconnect keeps failing afterwards, like a
 * box still out of range. Longer than one auto-retry interval, so at least
 * one failed background retry is observable. */
export const SIMULATED_XPARKLE_OUTAGE_MS = 8000;

/** The simulated vehicle's tilt — mirrors `?demo`'s fixed synthetic tilt
 * and the EasyLevel simulator's, so the two boxes can be compared
 * screen-for-screen. */
const SIM_ROLL_DEG = -1.2;
const SIM_PITCH_DEG = -0.35;
const SIM_BATTERY_PERCENT = 62;
/** Stored parameters, as the box would report them: cm, a motorhome,
 * 230 × 600, mounted front-facing, 0.5-unit display resolution. */
const SIM_PARAMETERS = [1, 0, 0, 230, 2, 88, 0, 1];

/** The live payload: magnitudes plus a direction flag each, in 1/100°,
 * exactly as `parseLivePayload` documents. A deterministic ±0.02° wobble
 * (a pure function of the sample index — no clock, no randomness) keeps
 * the live UI visibly updating while staying far inside the stillness
 * detector's tolerance. */
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
  // The box's own zero (#290): stored in the box, so it outlives a
  // connection, exactly as on real hardware.
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

/** One connection to the simulated box: reads on demand, and command
 * replies on the notify characteristic. */
function openSimulatedXparkle(
  session: SimulatedSession,
  mode: Exclude<XparkleSimulationMode, 'off'>,
  zero: { rollDeg: number; pitchDeg: number },
): Omit<XparkleConnection, 'deviceId' | 'disconnect'> {
  let sampleIndex = 0;
  let notify: ((view: DataView) => void) | null = null;

  /** Answer a command the way the box does — on the notify
   * characteristic, one frame per command, asynchronously. */
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
    write: (frame) => {
      if (!session.isLive()) return Promise.reject(new Error('simulated box: link lost'));
      if (frame.length < 3 || frame[0] !== XPARKLE_FRAME_HEADER) {
        return Promise.reject(new Error('simulated box: not a command frame'));
      }
      if (frame[2] === XPARKLE_COMMAND.password) {
        // Byte 4 of the reply is the verdict: 0 accepted, anything else
        // rejected, per the app's own `setPwd(bArr[4] == 0)`. The code
        // offered is the frame's "new" field, bytes 5–8 (#367).
        const offered = [...frame.subarray(5, 9)].join('');
        const accepted = offered === simulatedXparklePassword(mode);
        answer(buildCommandFrame(XPARKLE_COMMAND.password, [accepted ? 0 : 1]));
      } else if (frame[2] === XPARKLE_COMMAND.queryParameters) {
        answer(buildCommandFrame(XPARKLE_COMMAND.queryParameters, SIM_PARAMETERS));
      } else if (frame[2] === XPARKLE_COMMAND.resetZero) {
        // Where the box sits now becomes its zero (#290). No reply is
        // modelled: whether a real box answers this command is unknown,
        // and Libell does not wait for one.
        zero.rollDeg = SIM_ROLL_DEG;
        zero.pitchDeg = SIM_PITCH_DEG;
      }
      // Every other command is accepted silently — nothing in Libell
      // sends one, and a simulator that invented replies for commands no
      // caller issues would be testing itself.
      return Promise.resolve();
    },
  };
}

/** The parameter reply this simulator sends, parsed — so a test can assert
 * what the device page should be showing without restating the bytes. */
export function simulatedXparkleParameters() {
  return parseParameterReply(buildCommandFrame(XPARKLE_COMMAND.queryParameters, SIM_PARAMETERS));
}
