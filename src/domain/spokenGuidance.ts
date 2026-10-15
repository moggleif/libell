/**
 * Spoken guidance (R54, #602): the plan the screen shows, said out loud, so
 * the driver can level without seeing the phone lying in its spot.
 *
 * The input is always the STABILIZED plan (`DisplayResult` /
 * `CaravanDisplayResult`), never a raw reading — what is said can never
 * disagree with the wheel cards (R6, R27). This module only decides WHAT to
 * say and WHEN; the words are `t()` strings in the UI layer and the voice is
 * the browser's.
 */
import type { CaravanDisplayResult } from './caravan';
import { WHEEL_IDS, type WheelId } from './leveling';
import type { DisplayWheel, DisplayResult } from './stability';

/** A wheel the plan names: the motorhome's four, or the caravan's axle pair. */
export type SpokenWheel = WheelId | 'axleLeft' | 'axleRight';

export type SpokenPart =
  | {
      kind: 'wheel';
      wheel: SpokenWheel;
      /** The ramp step to drive up (1-based), or null to say how far to
       * drive up instead (a stepless wedge, #600). */
      step: number | null;
      /** With a step, the lift; without, how far to drive up. */
      liftMm: number;
      /** Red: even the tallest step, or the whole wedge, leaves it short. */
      notEnough: boolean;
    }
  | { kind: 'crank'; direction: 'up' | 'down'; mm: number };

export interface SpokenPlan {
  isLevel: boolean;
  /** What to do, in the order to do it; empty while level. */
  parts: SpokenPart[];
}

/** A changed plan must hold this long before it is said, so a plan that
 * only flickers past is never announced. */
export const SPEECH_DWELL_MS = 1000;
/** An unchanged plan is said again at most this often, as a reminder. */
export const SPEECH_REPEAT_MS = 10000;

export function motorhomeSpokenPlan(result: DisplayResult, stepHeightsMm: number[]): SpokenPlan {
  const parts = WHEEL_IDS.flatMap((id) => wheelPart(id, result.wheels[id], stepHeightsMm));
  return { isLevel: result.isLevel, parts };
}

/** The axle wheel first, then the jockey: crank once the axle is level. */
export function caravanSpokenPlan(
  result: CaravanDisplayResult,
  stepHeightsMm: number[],
): SpokenPlan {
  const parts = [
    ...wheelPart('axleLeft', result.axle.left, stepHeightsMm),
    ...wheelPart('axleRight', result.axle.right, stepHeightsMm),
  ];
  const { direction, displayMm } = result.jockey;
  if (direction !== 'ok') parts.push({ kind: 'crank', direction, mm: displayMm });
  return { isLevel: result.isLevel, parts };
}

/** Only wheels to act on: a level wheel, or a gray one no ramp is left for
 * (ADR 0011), has nothing to do and is not said. */
function wheelPart(wheel: SpokenWheel, shown: DisplayWheel, stepHeightsMm: number[]): SpokenPart[] {
  if (shown.severity === 'none' || shown.severity === 'unserved') return [];
  const stepNumber = shown.stepMm > 0 ? stepHeightsMm.indexOf(shown.stepMm) + 1 : 0;
  return [
    {
      kind: 'wheel',
      wheel,
      step: stepNumber > 0 ? stepNumber : null,
      // As the wheel card: never more than a stepless wedge's height.
      liftMm: stepNumber === 0 ? Math.min(shown.displayMm, shown.stepMm) : shown.displayMm,
      notEnough: shown.severity === 'large',
    },
  ];
}

/**
 * Feed it the plan on every frame; it returns the plan to say now, or null.
 *
 * Nothing is said while the vehicle moves (R25's stillness). A new plan is
 * said once it has held for `SPEECH_DWELL_MS`; an unchanged one again only
 * after `SPEECH_REPEAT_MS`. "Level" is said once per arrival, never repeated.
 */
export function createSpokenGuidance(): (
  plan: SpokenPlan,
  still: boolean,
  nowMs: number,
) => SpokenPlan | null {
  let saidKey: string | null = null;
  let saidAt = -Infinity;
  let pendingKey: string | null = null;
  let pendingSince = 0;
  return (plan, still, nowMs) => {
    if (!still || (!plan.isLevel && plan.parts.length === 0)) {
      pendingKey = null;
      return null;
    }
    const key = JSON.stringify(plan);
    if (key !== pendingKey) {
      pendingKey = key;
      pendingSince = nowMs;
    }
    if (nowMs - pendingSince < SPEECH_DWELL_MS) return null;
    if (key === saidKey && (plan.isLevel || nowMs - saidAt < SPEECH_REPEAT_MS)) return null;
    saidKey = key;
    saidAt = nowMs;
    return plan;
  };
}

/** The structural part of `SpeechSynthesisVoice` this needs. */
export interface VoiceInfo {
  lang: string;
  localService: boolean;
}

/**
 * A voice installed on the phone for `language` ("sv" matches "sv-SE"), or
 * null. Network voices are never used: Libell works offline (ADR 0005).
 */
export function pickOfflineVoice<V extends VoiceInfo>(
  voices: readonly V[],
  language: string,
): V | null {
  const wanted = language.toLowerCase();
  return (
    voices.find((voice) => {
      const lang = voice.lang.toLowerCase().replace('_', '-');
      return voice.localService && (lang === wanted || lang.startsWith(`${wanted}-`));
    }) ?? null
  );
}
