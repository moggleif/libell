/**
 * Reading the kloss fields from untrusted input. Stored settings and a
 * shared vehicle link both call this, so a link always reads the klossar
 * the way saved settings do (#731).
 */
import { rampHeights } from './ramps';
import {
  DEFAULT_SETTINGS,
  DRAIN_POSITIONS,
  MAX_RAMP_COUNT,
  type DrainPosition,
  type LevelSettings,
} from './settings';

type RampFields = Pick<
  LevelSettings,
  'rampStepHeightsMm' | 'rampStepless' | 'rampCount' | 'drainPosition'
>;

/**
 * `stepsMm` are the already-validated step heights; each caller knows
 * which formats it accepts (stored settings also migrate legacy cm).
 */
export function parseRampFields(raw: Record<string, unknown>, stepsMm: number[]): RampFields {
  // Anything stored or shared before stepless wedges (#600) is a staircase.
  const rampStepless = raw.rampStepless === true;
  return {
    rampStepHeightsMm: rampHeights(stepsMm, rampStepless),
    rampStepless,
    rampCount: parseRampCount(raw.rampCount),
    drainPosition: DRAIN_POSITIONS.includes(raw.drainPosition as DrainPosition)
      ? (raw.drainPosition as DrainPosition)
      : DEFAULT_SETTINGS.drainPosition,
  };
}

/** 1–`MAX_RAMP_COUNT`, rounded; anything else is the default. */
function parseRampCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1
    ? Math.min(MAX_RAMP_COUNT, Math.round(value))
    : DEFAULT_SETTINGS.rampCount;
}
