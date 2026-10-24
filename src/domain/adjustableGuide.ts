/**
 * The adjustable kloss's line above the vehicle (#687, R57): with a kloss
 * like Lippert LEVEL9 the step is set on the kloss before driving up, and
 * moving it means driving off again.
 *
 * The plan counts from the tilt as it is now, so its steps are right only
 * while the wheels stand on the ground. Once the vehicle has driven up and
 * is still not level, the line says to drive off instead, and the app
 * measures again from the ground. "Driven up" is told from the largest
 * lift: after the vehicle has moved and stands still again, it falls by at
 * least `dropMm` below the reading on the ground within SETTLE_MS, the time
 * the stabilized figures take to catch up. Reversing up to the klossar on
 * the same ground changes it by far less; once SETTLE_MS has passed without
 * that drop, the reading where it stands is the ground reading.
 */

export type AdjustablePhase = 'hidden' | 'before' | 'after';

/** How long after stopping a drop still counts as having driven up. */
export const SETTLE_MS = 3000;

export interface AdjustableReading {
  isLevel: boolean;
  /** R25's stillness detector: false while the vehicle moves or rocks. */
  still: boolean;
  /** The shown plan puts at least one wheel on a step. */
  hasStep: boolean;
  /** The largest lift the wheel cards show (mm). */
  maxLiftMm: number;
}

/** Feed it every reading; it returns what the line says. */
export function createAdjustableGuide(): (
  reading: AdjustableReading,
  dropMm: number,
  nowMs: number,
) => AdjustablePhase {
  let onKlossar = false;
  let moving = false;
  // Since when the vehicle has stood still after moving; null once settled.
  let stoppedAt: number | null = null;
  // The largest lift on the ground, before driving up; null once level.
  let groundMm: number | null = null;
  let shown: AdjustablePhase = 'hidden';

  return (reading, dropMm, nowMs) => {
    if (reading.isLevel) {
      onKlossar = moving = false;
      stoppedAt = groundMm = null;
      return (shown = 'hidden');
    }
    // Moving: the last text stays until the vehicle stands still again.
    if (!reading.still) {
      moving = true;
      return shown;
    }
    if (moving) {
      moving = false;
      stoppedAt = nowMs;
    }
    const drop = groundMm === null ? 0 : groundMm - reading.maxLiftMm;
    if (onKlossar) onKlossar = drop >= dropMm;
    else if (stoppedAt !== null && drop >= dropMm) onKlossar = true;
    else if (stoppedAt === null || nowMs - stoppedAt >= SETTLE_MS) {
      groundMm = reading.maxLiftMm;
      stoppedAt = null;
    }
    if (onKlossar) return (shown = 'after');
    return (shown = reading.hasStep ? 'before' : 'hidden');
  };
}
