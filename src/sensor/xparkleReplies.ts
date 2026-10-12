/**
 * Replies an Xparkle box sends on its notify characteristic: the stored
 * parameters, and the reassembly of a reply split over several
 * notifications (see `xparkleProtocol.ts` for how the layout was read).
 */
import { XPARKLE_COMMAND, XPARKLE_FRAME_HEADER } from './xparkleCommands';
import { toDataView, type PacketBytes } from './xparkleProtocol';

/**
 * The box's own stored vehicle configuration (`Cmd.setParameters`, and the
 * reply to `queryParameters`). Lengths are whole inches or whole
 * centimetres depending on `unit` — this is the box's own unit choice, and
 * is not related to Libell's millimetres-everywhere rule (ADR 0003):
 * nothing in `domain/` ever sees these values, since Libell has its own
 * vehicle geometry and computes its own guidance.
 */
export interface XparkleParameters {
  /** 0 = inch, anything else = cm. */
  unit: number;
  /** The box's own vehicle-type choice; Libell has no use for it. */
  vehicleType: number;
  /** Track width, in whole `unit`s. */
  width: number;
  /** Front-to-rear distance, in whole `unit`s. */
  length: number;
  /** Which way the box is mounted — see `XPARKLE_ORIENTATIONS`. */
  installationOrientation: number;
  /** The app's display rounding step, 0–3; a vendor-app display setting. */
  displayResolution: number;
}

/**
 * The four mounting orientations the box stores and the vendor app offers
 * (`setup_3_activity.xml`: "Installation Orientation", front / rear / left
 * / right). Unlike EasyLevel's `sensor_Placing`, this one is readable back
 * over the wire.
 */
export const XPARKLE_ORIENTATIONS = ['front', 'rear', 'left', 'right'] as const;

export type XparkleOrientation = (typeof XPARKLE_ORIENTATIONS)[number];

export function orientationFromByte(byte: number): XparkleOrientation | null {
  return XPARKLE_ORIENTATIONS[byte] ?? null;
}

/** Bytes a parameter reply needs before every field above is readable. */
const PARAMETER_REPLY_MIN_BYTES = 12;

/**
 * Parse a completed reply frame to `queryParameters`
 * (`ConnectListener.onNotify`'s `b == 2` branch). Returns `null` for a
 * frame that is not a parameter reply, or is too short — never throws.
 */
export function parseParameterReply(frame: PacketBytes): XparkleParameters | null {
  const view = toDataView(frame);
  if (view.byteLength < PARAMETER_REPLY_MIN_BYTES) return null;
  if (view.getUint8(2) !== XPARKLE_COMMAND.queryParameters) return null;
  return {
    unit: view.getUint8(4),
    vehicleType: view.getUint8(5),
    width: view.getUint16(6, false),
    length: view.getUint16(8, false),
    installationOrientation: view.getUint8(10),
    displayResolution: view.getUint8(11),
  };
}

/**
 * Reassemble command replies arriving on the notify characteristic
 * (`ConnectListener.onNotify`): a reply longer than the negotiated MTU
 * arrives in pieces, and only the first carries the `0x0F` header and the
 * length byte. Declared length is `bytes[1] + 4`, matching a frame's total
 * of payload + 7 (the length byte itself is payload + 3).
 *
 * A piece that would overflow the declared length, or a continuation with
 * no start seen, is dropped rather than appended: a corrupt reply must not
 * poison the next one.
 */
export interface XparkleFrameReassembler {
  /** Feed one notification; returns a completed frame, or null. */
  push(chunk: PacketBytes): Uint8Array | null;
  /** Drop any partial frame — call on disconnect. */
  reset(): void;
}

export function createXparkleFrameReassembler(): XparkleFrameReassembler {
  let partial: PartialFrame | null = null;
  return {
    push(chunk) {
      partial = nextPartialFrame(partial, bytesOf(chunk));
      if (!partial || partial.filled < partial.bytes.length) return null;
      const complete = partial.bytes;
      partial = null;
      return complete;
    },
    reset() {
      partial = null;
    },
  };
}

/** A reply whose declared length has not all arrived yet. */
interface PartialFrame {
  bytes: Uint8Array;
  filled: number;
}

function bytesOf(chunk: PacketBytes): Uint8Array {
  const view = toDataView(chunk);
  const out = new Uint8Array(view.byteLength);
  for (let i = 0; i < view.byteLength; i++) out[i] = view.getUint8(i);
  return out;
}

function nextPartialFrame(partial: PartialFrame | null, bytes: Uint8Array): PartialFrame | null {
  if (bytes.length === 0) return partial;
  // A new frame always restarts the buffer, even mid-reassembly: that is
  // what the app's own `lastPos == 0 && bytes[0] == 15` branch effectively
  // does, and it is the only way to recover from a reply whose tail never
  // arrived.
  if (bytes[0] === XPARKLE_FRAME_HEADER) return startFrame(bytes) ?? partial;
  return partial ? continueFrame(partial, bytes) : null;
}

/** Null when the piece cannot start a frame: a lone header byte carries no
 * length yet, and a piece longer than its declared length is corrupt. */
function startFrame(bytes: Uint8Array): PartialFrame | null {
  if (bytes.length < 2) return null;
  const declared = bytes[1]! + 4;
  if (bytes.length > declared) return null;
  const frame = new Uint8Array(declared);
  frame.set(bytes, 0);
  return { bytes: frame, filled: bytes.length };
}

function continueFrame(partial: PartialFrame, bytes: Uint8Array): PartialFrame | null {
  if (partial.filled + bytes.length > partial.bytes.length) return null;
  partial.bytes.set(bytes, partial.filled);
  return { bytes: partial.bytes, filled: partial.filled + bytes.length };
}
