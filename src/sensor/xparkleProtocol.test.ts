import { describe, expect, it } from 'vitest';
import {
  buildCommandFrame,
  buildFactoryReset,
  buildPasswordFrame,
  buildQueryParameters,
  buildResetZero,
  createXparkleFrameReassembler,
  gravityFromAngles,
  gravityFromReading,
  isValidXparklePassword,
  LIVE_PAYLOAD_MIN_BYTES,
  MAX_PLAUSIBLE_ANGLE_DEG,
  orientationFromByte,
  parseLivePayload,
  parseParameterReply,
  XPARKLE_COMMAND,
  XPARKLE_ORIENTATIONS,
  XPARKLE_PASSWORD_MODE,
} from './xparkleProtocol';
import { tiltFromGravity } from '../domain/leveling';

/** Big-endian uint16 bytes, the encoding every multi-byte field uses. */
function be16(value: number): [number, number] {
  return [(value >> 8) & 0xff, value & 0xff];
}

/**
 * A live payload: the two direction flags, the two magnitudes in 1/100°,
 * and the battery byte — in the wire order `parseLivePayload` documents.
 */
function livePayload(options: {
  frontHigh: boolean;
  pitchHundredths: number;
  leftLow: boolean;
  rollHundredths: number;
  battery: number;
}): number[] {
  return [
    options.frontHigh ? 1 : 0,
    ...be16(options.pitchHundredths),
    options.leftLow ? 1 : 0,
    ...be16(options.rollHundredths),
    options.battery,
  ];
}

describe('parseLivePayload (#269)', () => {
  it('reads both angles at 1/100° and the battery percent', () => {
    const reading = parseLivePayload(
      livePayload({
        frontHigh: true,
        pitchHundredths: 325,
        leftLow: true,
        rollHundredths: 150,
        battery: 87,
      }),
    );
    expect(reading).toEqual({ pitchDeg: 3.25, rollDeg: 1.5, batteryPercent: 87 });
  });

  it('keeps the full 1/100° precision the wire carries, not the app’s 0.1° display', () => {
    // The vendor app truncates `raw / 10` as an int before dividing by 10
    // again, which would turn 3.27° into 3.2°. Libell does not.
    const reading = parseLivePayload(
      livePayload({
        frontHigh: true,
        pitchHundredths: 327,
        leftLow: false,
        rollHundredths: 0,
        battery: 50,
      }),
    );
    expect(reading?.pitchDeg).toBe(3.27);
  });

  it('maps "uphill" to a positive pitch — nose up lifts the front wheels', () => {
    const up = parseLivePayload(
      livePayload({
        frontHigh: true,
        pitchHundredths: 200,
        leftLow: false,
        rollHundredths: 0,
        battery: 1,
      }),
    );
    const down = parseLivePayload(
      livePayload({
        frontHigh: false,
        pitchHundredths: 200,
        leftLow: false,
        rollHundredths: 0,
        battery: 1,
      }),
    );
    expect(up?.pitchDeg).toBe(2);
    expect(down?.pitchDeg).toBe(-2);
  });

  it('maps "left tilt" to a positive roll — a low left side lifts the right wheels', () => {
    const leftLow = parseLivePayload(
      livePayload({
        frontHigh: true,
        pitchHundredths: 0,
        leftLow: true,
        rollHundredths: 450,
        battery: 1,
      }),
    );
    const rightLow = parseLivePayload(
      livePayload({
        frontHigh: true,
        pitchHundredths: 0,
        leftLow: false,
        rollHundredths: 450,
        battery: 1,
      }),
    );
    expect(leftLow?.rollDeg).toBe(4.5);
    expect(rightLow?.rollDeg).toBe(-4.5);
  });

  it('treats any direction byte other than 1 as the negative direction, like the app', () => {
    const reading = parseLivePayload([7, ...be16(100), 9, ...be16(100), 42]);
    expect(reading).toEqual({ pitchDeg: -1, rollDeg: -1, batteryPercent: 42 });
  });

  it('accepts a DataView as readily as a plain array', () => {
    const bytes = Uint8Array.from(
      livePayload({
        frontHigh: true,
        pitchHundredths: 100,
        leftLow: true,
        rollHundredths: 100,
        battery: 5,
      }),
    );
    expect(parseLivePayload(new DataView(bytes.buffer))).toEqual({
      pitchDeg: 1,
      rollDeg: 1,
      batteryPercent: 5,
    });
  });

  it('returns null for a payload shorter than the minimum, never throws', () => {
    expect(parseLivePayload([])).toBeNull();
    expect(parseLivePayload([0x0f, 0, 0, 0, 0, 0])).toBeNull();
    expect(LIVE_PAYLOAD_MIN_BYTES).toBe(7);
  });

  it('rejects an implausible angle rather than clamping it to something believable', () => {
    const absurd = parseLivePayload(
      livePayload({
        frontHigh: true,
        pitchHundredths: (MAX_PLAUSIBLE_ANGLE_DEG + 1) * 100,
        leftLow: true,
        rollHundredths: 0,
        battery: 50,
      }),
    );
    expect(absurd).toBeNull();
  });

  it('accepts an angle exactly at the plausibility limit', () => {
    const atLimit = parseLivePayload(
      livePayload({
        frontHigh: true,
        pitchHundredths: MAX_PLAUSIBLE_ANGLE_DEG * 100,
        leftLow: true,
        rollHundredths: 0,
        battery: 50,
      }),
    );
    expect(atLimit?.pitchDeg).toBe(MAX_PLAUSIBLE_ANGLE_DEG);
  });

  it('ignores trailing bytes a longer payload may carry', () => {
    const bytes = [
      ...livePayload({
        frontHigh: true,
        pitchHundredths: 100,
        leftLow: false,
        rollHundredths: 200,
        battery: 60,
      }),
      0xaa,
      0xbb,
    ];
    expect(parseLivePayload(bytes)).toEqual({ pitchDeg: 1, rollDeg: -2, batteryPercent: 60 });
  });
});

describe('gravityFromAngles (#269)', () => {
  it('inverts domain/leveling.ts’s own tilt derivation exactly', () => {
    // The whole point of synthesizing a vector: every source must hand
    // `domain/` the one shape it takes, and round-trip through the real
    // `tiltFromGravity` is the only assertion that proves it.
    const RAD_TO_DEG = 180 / Math.PI;
    for (let rollDeg = -30; rollDeg <= 30; rollDeg += 2.5) {
      for (let pitchDeg = -30; pitchDeg <= 30; pitchDeg += 2.5) {
        const tilt = tiltFromGravity(gravityFromAngles(rollDeg, pitchDeg), null);
        expect(tilt.roll * RAD_TO_DEG).toBeCloseTo(rollDeg, 10);
        expect(tilt.pitch * RAD_TO_DEG).toBeCloseTo(pitchDeg, 10);
      }
    }
  });

  it('is flat for a flat box, with z positive as the seam expects', () => {
    expect(gravityFromAngles(0, 0)).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('lifts the right-hand side for a positive roll, matching the wheel math', () => {
    // `domain/leveling.ts` computes wheel height as x·tan(roll) + y·tan(pitch)
    // with x = right, so a positive roll must give a positive x here.
    expect(gravityFromAngles(5, 0).x).toBeGreaterThan(0);
    expect(gravityFromAngles(0, 5).y).toBeGreaterThan(0);
  });

  it('converts a parsed reading without restating the angles', () => {
    const reading = { rollDeg: 2, pitchDeg: -3, batteryPercent: 10 };
    expect(gravityFromReading(reading)).toEqual(gravityFromAngles(2, -3));
  });
});

describe('buildCommandFrame (#269)', () => {
  it('frames the argument-less commands byte for byte as the vendor app does', () => {
    expect([...buildQueryParameters()]).toEqual([0x0f, 0x04, 0x02, 0x00, 0x00, 0x03, 0xff, 0xff]);
    expect([...buildResetZero()]).toEqual([0x0f, 0x04, 0x05, 0x00, 0x00, 0x06, 0xff, 0xff]);
    expect([...buildFactoryReset()]).toEqual([0x0f, 0x04, 0x01, 0x00, 0x00, 0x02, 0xff, 0xff]);
  });

  it('declares a length of payload + 3 and emits payload + 7 bytes', () => {
    const frame = buildCommandFrame(XPARKLE_COMMAND.setParameters, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(frame).toHaveLength(16);
    expect(frame[1]).toBe(12);
  });

  it('checksums the command, the unused byte and the payload, truncated to a byte', () => {
    const frame = buildCommandFrame(XPARKLE_COMMAND.setParameters, [0xff, 0xff, 0xff]);
    // 1 + 0x03 + 0x00 + 0xff·3 = 769 = 0x301 → 0x01
    expect(frame[3 + 4]).toBe(0x01);
  });

  it('always ends with the two 0xFF stop bytes', () => {
    const frame = buildCommandFrame(XPARKLE_COMMAND.queryParameters, [0, 0]);
    expect([...frame.slice(-2)]).toEqual([0xff, 0xff]);
  });
});

describe('buildPasswordFrame (#269)', () => {
  it('puts the new password first and the old one second, one digit per byte', () => {
    const frame = buildPasswordFrame(XPARKLE_PASSWORD_MODE.verify, '0000', '1234');
    expect(frame).not.toBeNull();
    expect([...frame!]).toEqual([
      0x0f, 0x0c, 0x04, 0x00,
      // payload: mode, new password digits, old password digits
      0x00, 1, 2, 3, 4, 0, 0, 0, 0, 0x0f, 0xff, 0xff,
    ]);
  });

  it('carries the mode byte so "verify" and "change" are distinguishable on the wire', () => {
    const verify = buildPasswordFrame(XPARKLE_PASSWORD_MODE.verify, '1111', '2222');
    const change = buildPasswordFrame(XPARKLE_PASSWORD_MODE.change, '1111', '2222');
    expect(verify![4]).toBe(0x00);
    expect(change![4]).toBe(0x01);
  });

  it('refuses anything that is not four digits instead of sending a malformed frame', () => {
    expect(buildPasswordFrame(XPARKLE_PASSWORD_MODE.verify, '0000', '123')).toBeNull();
    expect(buildPasswordFrame(XPARKLE_PASSWORD_MODE.verify, '0000', '12345')).toBeNull();
    expect(buildPasswordFrame(XPARKLE_PASSWORD_MODE.verify, '00a0', '1234')).toBeNull();
    expect(buildPasswordFrame(XPARKLE_PASSWORD_MODE.verify, '0000', '')).toBeNull();
  });

  it('validates a password the same way the frame builder does', () => {
    expect(isValidXparklePassword('0000')).toBe(true);
    expect(isValidXparklePassword('9999')).toBe(true);
    expect(isValidXparklePassword('999')).toBe(false);
    expect(isValidXparklePassword(' 999')).toBe(false);
  });
});

describe('parseParameterReply (#269)', () => {
  /** A reply frame carrying the six stored parameter fields. */
  function parameterReply(fields: {
    unit: number;
    vehicleType: number;
    width: number;
    length: number;
    orientation: number;
    resolution: number;
  }): number[] {
    return [
      0x0f,
      0x0b,
      XPARKLE_COMMAND.queryParameters,
      0x00,
      fields.unit,
      fields.vehicleType,
      ...be16(fields.width),
      ...be16(fields.length),
      fields.orientation,
      fields.resolution,
      0x00,
      0xff,
      0xff,
    ];
  }

  it('reads the box’s stored vehicle configuration', () => {
    const parsed = parseParameterReply(
      parameterReply({
        unit: 1,
        vehicleType: 2,
        width: 230,
        length: 600,
        orientation: 2,
        resolution: 1,
      }),
    );
    expect(parsed).toEqual({
      unit: 1,
      vehicleType: 2,
      width: 230,
      length: 600,
      installationOrientation: 2,
      displayResolution: 1,
    });
  });

  it('returns null for a reply to a different command', () => {
    const other = parameterReply({
      unit: 0,
      vehicleType: 0,
      width: 0,
      length: 0,
      orientation: 0,
      resolution: 0,
    });
    other[2] = XPARKLE_COMMAND.resetZero;
    expect(parseParameterReply(other)).toBeNull();
  });

  it('returns null for a truncated reply, never throws', () => {
    expect(parseParameterReply([0x0f, 0x0b, XPARKLE_COMMAND.queryParameters])).toBeNull();
    expect(parseParameterReply([])).toBeNull();
  });

  it('names the four mounting orientations the box stores', () => {
    expect(XPARKLE_ORIENTATIONS).toHaveLength(4);
    expect(orientationFromByte(0)).toBe('front');
    expect(orientationFromByte(3)).toBe('right');
    expect(orientationFromByte(4)).toBeNull();
    expect(orientationFromByte(-1)).toBeNull();
  });
});

describe('createXparkleFrameReassembler (#269)', () => {
  const frame = [...buildCommandFrame(XPARKLE_COMMAND.queryParameters, [1, 2, 3, 4, 5, 6, 7, 8])];

  it('returns a frame that arrives in one notification', () => {
    const reassembler = createXparkleFrameReassembler();
    expect([...(reassembler.push(frame) ?? [])]).toEqual(frame);
  });

  it('yields the same result for a frame split across notifications', () => {
    const reassembler = createXparkleFrameReassembler();
    expect(reassembler.push(frame.slice(0, 5))).toBeNull();
    expect(reassembler.push(frame.slice(5, 9))).toBeNull();
    expect([...(reassembler.push(frame.slice(9)) ?? [])]).toEqual(frame);
  });

  it('does not let an abandoned frame corrupt the next one', () => {
    const reassembler = createXparkleFrameReassembler();
    reassembler.push(frame.slice(0, 5));
    // A new start-of-frame arrives instead of the missing tail.
    expect(reassembler.push(frame.slice(0, 5))).toBeNull();
    expect([...(reassembler.push(frame.slice(5)) ?? [])]).toEqual(frame);
  });

  it('drops a continuation that arrives with no start frame', () => {
    const reassembler = createXparkleFrameReassembler();
    expect(reassembler.push([0x01, 0x02, 0x03])).toBeNull();
  });

  it('drops a continuation that would overflow the declared length', () => {
    const reassembler = createXparkleFrameReassembler();
    reassembler.push(frame.slice(0, 5));
    expect(reassembler.push(new Array(frame.length).fill(0x01))).toBeNull();
    // The buffer is discarded, so the next complete frame still parses.
    expect([...(reassembler.push(frame) ?? [])]).toEqual(frame);
  });

  it('ignores an empty notification', () => {
    const reassembler = createXparkleFrameReassembler();
    expect(reassembler.push([])).toBeNull();
  });

  it('forgets a partial frame on reset, as a disconnect must', () => {
    const reassembler = createXparkleFrameReassembler();
    reassembler.push(frame.slice(0, 5));
    reassembler.reset();
    expect(reassembler.push(frame.slice(5))).toBeNull();
  });

  it('reassembles a real parameter reply into something parseable', () => {
    const reply = [
      0x0f,
      0x0b,
      XPARKLE_COMMAND.queryParameters,
      0x00,
      1,
      2,
      ...be16(230),
      ...be16(600),
      2,
      1,
      0x00,
      0xff,
      0xff,
    ];
    const reassembler = createXparkleFrameReassembler();
    expect(reassembler.push(reply.slice(0, 6))).toBeNull();
    const complete = reassembler.push(reply.slice(6));
    expect(complete).not.toBeNull();
    expect(parseParameterReply(complete!)?.installationOrientation).toBe(2);
  });
});
