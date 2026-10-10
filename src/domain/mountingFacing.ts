/**
 * Which way a mounted box faces, picked by tapping a side of the vehicle
 * (#314, the #309 UX review) — pure, no browser APIs.
 *
 * Every box has a reference side (the Xparkle box: its back, the screw
 * mount; the EasyLevel box: the arrow on its picture). The user taps the
 * side of the vehicle that reference side points to. Each choice is a
 * quarter turn of the box about the vertical axis, which is all either
 * box's own representation needs:
 *   - the EasyLevel box keeps its four `EasyLevelMounting` rotations (R43);
 *   - the Xparkle box keeps an `AxisMapping` (#293), here a pure rotation.
 * A mapping learned by lifting the vehicle can also be mirrored, which no
 * single facing describes — then no facing is shown as picked.
 */
import type { AxisMapping } from './axisMapping';
import type { EasyLevelMounting } from './settings';

export type Facing = 'front' | 'right' | 'rear' | 'left';

/** Clockwise, as seen from above: each step is a further quarter turn. */
export const FACINGS: readonly Facing[] = ['front', 'right', 'rear', 'left'];

const EASYLEVEL_BY_FACING: Record<Facing, EasyLevelMounting> = {
  front: 'standard',
  right: 'rotated90',
  rear: 'rotated180',
  left: 'rotated270',
};

export function easyLevelMountingForFacing(facing: Facing): EasyLevelMounting {
  return EASYLEVEL_BY_FACING[facing];
}

export function facingForEasyLevelMounting(mounting: EasyLevelMounting): Facing {
  return FACINGS.find((facing) => EASYLEVEL_BY_FACING[facing] === mounting) ?? 'front';
}

/**
 * A box turned clockwise by a quarter turn from the facing whose output
 * is already the vehicle's: its own front now points to the vehicle's
 * right, so a raised vehicle front tips its left side up (negative box
 * roll) and a raised right side tips its front up (positive box pitch).
 */
const MAPPING_BY_QUARTER_TURNS: readonly AxisMapping[] = [
  { swap: false, pitchSign: 1, rollSign: 1 },
  { swap: true, pitchSign: -1, rollSign: 1 },
  { swap: false, pitchSign: -1, rollSign: -1 },
  { swap: true, pitchSign: 1, rollSign: -1 },
];

function quarterTurns(facing: Facing, reference: Facing): number {
  return (FACINGS.indexOf(facing) - FACINGS.indexOf(reference) + 4) % 4;
}

/** The axis mapping for a box facing `facing`, where `reference` is the
 * facing in which the box's own output needs no mapping. */
export function axisMappingForFacing(facing: Facing, reference: Facing): AxisMapping {
  return MAPPING_BY_QUARTER_TURNS[quarterTurns(facing, reference)] as AxisMapping;
}

/** The facing a stored mapping describes, or null for no mapping or a
 * mirrored one only the lift guide can produce. */
export function facingForAxisMapping(
  mapping: AxisMapping | null,
  reference: Facing,
): Facing | null {
  if (!mapping) return null;
  const facing = FACINGS.find((candidate) => {
    const m = axisMappingForFacing(candidate, reference);
    return (
      m.swap === mapping.swap &&
      m.pitchSign === mapping.pitchSign &&
      m.rollSign === mapping.rollSign
    );
  });
  return facing ?? null;
}
