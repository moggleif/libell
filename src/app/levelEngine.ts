/**
 * The level screen's vehicle engine: compute → stabilize → draw for the
 * chosen vehicle type. Settings are read afresh on every tick; only what
 * the diagram is built from is fixed at creation.
 */
import { computeCaravanLeveling, createCaravanStabilizer } from '../domain/caravan';
import { computeLeveling, WHEEL_IDS, type GravityVector } from '../domain/leveling';
import { deficitMagnitude } from '../domain/rampPlan';
import type { LevelSettings } from '../domain/settings';
import { formatLength } from '../domain/lengths';
import type { Calibration } from '../domain/calibration';
import { createDisplayStabilizer, type DisplayResult } from '../domain/stability';
import { createCaravanDiagram } from '../ui/caravanDiagram';
import { t } from '../ui/i18n';
import { createRvDiagram } from '../ui/rvDiagram';
import type { EngineTick } from './levelFrame';

/** Where the engine reports each reading besides its diagram. */
export interface EngineOutput {
  showStatus(text: string, isLevel: boolean): void;
  showTilt(tilt: { rollDeg: number; pitchDeg: number }): void;
}

export interface LevelEngine {
  element: HTMLElement;
  tick(gravity: GravityVector, nowMs: number): EngineTick;
}

/**
 * The motorhome's status row: only what no wheel card can show —
 * how little is left, and whether the ramps reach at all. Level, and
 * which wheels to raise, are the wheel cards' own colour, glyph and step.
 */
export function motorhomeStatusText(result: DisplayResult, settings: LevelSettings): string {
  if (result.isLevel) return '';
  const maxMm = largestLift(result);
  if (maxMm <= settings.toleranceMm + 10) {
    return t('status.almost', {
      left: formatLength(Math.max(1, maxMm - settings.toleranceMm), settings.displayUnit),
    });
  }
  // A red wheel without a step is one the owned ramps cannot serve.
  const toRaise = WHEEL_IDS.filter(
    (id) => result.wheels[id].stepMm > 0 && result.wheels[id].severity !== 'none',
  ).length;
  if (toRaise > 0) return '';
  const magnitude = deficitMagnitude(result.maxDeficitMm, settings.toleranceMm);
  return t(magnitude === 'close' ? 'status.cantLevel.close' : 'status.cantLevel.far');
}

function largestLift(result: DisplayResult): number {
  return Math.max(...WHEEL_IDS.map((id) => result.wheels[id].displayMm));
}

export function createLevelEngine(
  settings: () => LevelSettings,
  calibration: () => Calibration | null,
  output: EngineOutput,
): LevelEngine {
  return settings().vehicleType === 'caravan'
    ? createCaravanEngine(settings, calibration, output)
    : createMotorhomeEngine(settings, calibration, output);
}

function createMotorhomeEngine(
  settings: () => LevelSettings,
  calibration: () => Calibration | null,
  output: EngineOutput,
): LevelEngine {
  const { rearAxle, appearance } = settings();
  const diagram = createRvDiagram(rearAxle, appearance);
  const stabilize = createDisplayStabilizer();
  return {
    element: diagram.element,
    tick(gravity, nowMs) {
      const current = settings();
      const result = stabilize(computeLeveling(gravity, current, calibration()), current, nowMs);
      diagram.update(result, current.displayUnit, current.rampStepHeightsMm);
      output.showStatus(motorhomeStatusText(result, current), result.isLevel);
      output.showTilt(result);
      return { isLevel: result.isLevel, maxCorrectionMm: largestLift(result) };
    },
  };
}

/**
 * The caravan diagram draws the jockey wheel's direction, action and
 * amount, and the axle wheels their severity, so its status row has
 * nothing to add.
 */
function createCaravanEngine(
  settings: () => LevelSettings,
  calibration: () => Calibration | null,
  output: EngineOutput,
): LevelEngine {
  const { rearAxle, appearance } = settings();
  const diagram = createCaravanDiagram(rearAxle, appearance);
  const stabilize = createCaravanStabilizer();
  return {
    element: diagram.element,
    tick(gravity, nowMs) {
      const current = settings();
      const result = stabilize(
        computeCaravanLeveling(gravity, current, calibration()),
        current,
        nowMs,
      );
      diagram.update(result, current.displayUnit, current.rampStepHeightsMm);
      output.showStatus('', result.isLevel);
      output.showTilt(result);
      const maxAxleMm = Math.max(result.axle.left.displayMm, result.axle.right.displayMm);
      const jockeyMm = result.jockey.direction === 'ok' ? 0 : result.jockey.displayMm;
      return { isLevel: result.isLevel, maxCorrectionMm: Math.max(maxAxleMm, jockeyMm) };
    },
  };
}
