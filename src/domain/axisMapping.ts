/**
 * Learned mounting (#293) — pure math, no browser APIs.
 *
 * A box that reports two finished angles (the Xparkle RVS01, R49) can sit
 * in the vehicle any way round: turned a quarter, back to front, even
 * lying on its back once it has been zeroed (#290). Rather than ask the
 * user to describe that — or trust the box's own front/rear/left/right
 * setting, whose meaning for a box lying down is unknown — Libell watches
 * what happens when the user lifts the vehicle's front, then its right
 * side, and records which reported axis moved and which way:
 *
 *   front raised  → whichever axis moved is pitch; its sign makes it positive
 *   right raised  → the other axis is roll; its sign makes that positive
 *                   (right up is left low, positive roll in Libell)
 *
 * Any mounting is some swap of the two axes plus a sign on each, so this
 * covers all eight, mirror images included. Because it is measured, it
 * composes correctly with whatever the box itself already applies — there
 * is nothing to double-correct.
 */
import type { Calibration } from './settings';

export interface AxisMapping {
  /** The box's roll axis is the vehicle's pitch, and vice versa. */
  swap: boolean;
  pitchSign: 1 | -1;
  rollSign: 1 | -1;
}

export const IDENTITY_AXIS_MAPPING: AxisMapping = { swap: false, pitchSign: 1, rollSign: 1 };

/** A lift smaller than this is too close to sensor noise to learn from. */
export const MIN_LEARN_DELTA_DEG = 1;

/**
 * The other axis may move a little too (nobody lifts perfectly straight),
 * but no more than this fraction of the main one — beyond it, which axis
 * was meant is a guess, and a wrong guess names the wrong wheel.
 */
export const MAX_CROSS_TALK_RATIO = 0.5;

export function applyAxisMapping(reading: Calibration, mapping: AxisMapping): Calibration {
  const pitch = mapping.swap ? reading.rollDeg : reading.pitchDeg;
  const roll = mapping.swap ? reading.pitchDeg : reading.rollDeg;
  return { pitchDeg: mapping.pitchSign * pitch, rollDeg: mapping.rollSign * roll };
}

export type LearnAxisError = 'tooSmall' | 'ambiguous' | 'sameAxis';

export type LearnAxisResult =
  { ok: true; mapping: AxisMapping } | { ok: false; error: LearnAxisError };

interface Movement {
  axis: 'pitch' | 'roll';
  sign: 1 | -1;
}

function dominantMovement(from: Calibration, to: Calibration): Movement | LearnAxisError {
  const dPitch = to.pitchDeg - from.pitchDeg;
  const dRoll = to.rollDeg - from.rollDeg;
  const major = Math.max(Math.abs(dPitch), Math.abs(dRoll));
  const minor = Math.min(Math.abs(dPitch), Math.abs(dRoll));
  if (major < MIN_LEARN_DELTA_DEG) return 'tooSmall';
  if (minor > major * MAX_CROSS_TALK_RATIO) return 'ambiguous';
  const axis = Math.abs(dPitch) >= Math.abs(dRoll) ? 'pitch' : 'roll';
  const delta = axis === 'pitch' ? dPitch : dRoll;
  return { axis, sign: delta > 0 ? 1 : -1 };
}

/**
 * Learn the mapping from three raw readings: the vehicle as it stands,
 * with its front raised, and with its right side raised (each lift from
 * that same starting position). Raw means as the box reports it — before
 * any mapping already learned, which this replaces.
 */
export function learnAxisMapping(
  baseline: Calibration,
  frontRaised: Calibration,
  rightRaised: Calibration,
): LearnAxisResult {
  const front = dominantMovement(baseline, frontRaised);
  if (typeof front === 'string') return { ok: false, error: front };
  const right = dominantMovement(baseline, rightRaised);
  if (typeof right === 'string') return { ok: false, error: right };
  if (front.axis === right.axis) return { ok: false, error: 'sameAxis' };
  return {
    ok: true,
    mapping: {
      swap: front.axis === 'roll',
      // Front up is positive pitch in Libell's convention.
      pitchSign: front.sign,
      // Right up means left low, which is already positive roll.
      rollSign: right.sign,
    },
  };
}

/** A stored mapping, validated field by field; null for anything else. */
export function parseAxisMapping(raw: unknown): AxisMapping | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const value = raw as Record<string, unknown>;
  const sign = (v: unknown): 1 | -1 | null => (v === 1 || v === -1 ? v : null);
  const pitchSign = sign(value.pitchSign);
  const rollSign = sign(value.rollSign);
  if (typeof value.swap !== 'boolean' || pitchSign === null || rollSign === null) return null;
  return { swap: value.swap, pitchSign, rollSign };
}
