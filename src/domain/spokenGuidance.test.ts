import { describe, expect, it } from 'vitest';
import type { CaravanDisplayResult } from './caravan';
import type { WheelId } from './leveling';
import type { DisplayResult, DisplayWheel } from './stability';
import {
  caravanSpokenPlan,
  createSpokenGuidance,
  motorhomeSpokenPlan,
  pickOfflineVoice,
  SPEECH_DWELL_MS,
  SPEECH_REPEAT_MS,
  type SpokenPlan,
} from './spokenGuidance';

const STEPS = [40, 80, 120];
const DONE: DisplayWheel = { displayMm: 0, stepMm: 0, severity: 'none' };

function motorhome(wheels: Partial<Record<WheelId, DisplayWheel>>): DisplayResult {
  const all = { frontLeft: DONE, frontRight: DONE, rearLeft: DONE, rearRight: DONE, ...wheels };
  const isLevel = Object.values(all).every((wheel) => wheel.severity === 'none');
  return { rollDeg: 0, pitchDeg: 0, isLevel, wheels: all, maxDeficitMm: 0 };
}

const REAR_LEFT_STEP_2: SpokenPlan = {
  isLevel: false,
  parts: [{ kind: 'wheel', wheel: 'rearLeft', step: 2, liftMm: 78, notEnough: false }],
};
const LEVEL: SpokenPlan = { isLevel: true, parts: [] };

describe('the spoken plan follows the stabilized wheel cards (#602)', () => {
  it('names each wheel to raise with its ramp step', () => {
    const plan = motorhomeSpokenPlan(
      motorhome({ rearLeft: { displayMm: 78, stepMm: 80, severity: 'small' } }),
      STEPS,
    );
    expect(plan).toEqual(REAR_LEFT_STEP_2);
  });

  it('says the lift in mm when the step is not one of the ramp steps', () => {
    const plan = motorhomeSpokenPlan(
      motorhome({ frontRight: { displayMm: 30, stepMm: 33, severity: 'small' } }),
      STEPS,
    );
    expect(plan.parts).toEqual([
      { kind: 'wheel', wheel: 'frontRight', step: null, liftMm: 30, notEnough: false },
    ]);
  });

  it('says when even the tallest step is not enough', () => {
    const plan = motorhomeSpokenPlan(
      motorhome({ rearRight: { displayMm: 200, stepMm: 120, severity: 'large' } }),
      STEPS,
    );
    expect(plan.parts).toEqual([
      { kind: 'wheel', wheel: 'rearRight', step: 3, liftMm: 200, notEnough: true },
    ]);
  });

  it('says how far to drive up a stepless wedge, its full height when short (#600)', () => {
    const plan = motorhomeSpokenPlan(
      motorhome({
        frontLeft: { displayMm: 37, stepMm: 37, severity: 'small' },
        rearRight: { displayMm: 140, stepMm: 101, severity: 'large' },
      }),
      [],
    );
    expect(plan.parts).toEqual([
      { kind: 'wheel', wheel: 'frontLeft', step: null, liftMm: 37, notEnough: false },
      { kind: 'wheel', wheel: 'rearRight', step: null, liftMm: 101, notEnough: true },
    ]);
  });

  it('leaves out level wheels and gray wheels no ramp is left for', () => {
    const plan = motorhomeSpokenPlan(
      motorhome({
        rearLeft: { displayMm: 78, stepMm: 80, severity: 'small' },
        frontLeft: { displayMm: 50, stepMm: 0, severity: 'unserved' },
      }),
      STEPS,
    );
    expect(plan).toEqual(REAR_LEFT_STEP_2);
  });

  it('is empty and level when every wheel is done', () => {
    expect(motorhomeSpokenPlan(motorhome({}), STEPS)).toEqual(LEVEL);
  });

  it('says the caravan axle wheel first, then cranking the jockey wheel', () => {
    const result: CaravanDisplayResult = {
      rollDeg: 0,
      pitchDeg: 0,
      isLevel: false,
      axle: { left: DONE, right: { displayMm: 41, stepMm: 40, severity: 'small' } },
      jockey: { displayMm: 20, direction: 'up' },
    };
    expect(caravanSpokenPlan(result, STEPS).parts).toEqual([
      { kind: 'wheel', wheel: 'axleRight', step: 1, liftMm: 41, notEnough: false },
      { kind: 'crank', direction: 'up', mm: 20 },
    ]);
  });

  it('says nothing about a jockey wheel that is already right', () => {
    const result: CaravanDisplayResult = {
      rollDeg: 0,
      pitchDeg: 0,
      isLevel: true,
      axle: { left: DONE, right: DONE },
      jockey: { displayMm: 0, direction: 'ok' },
    };
    expect(caravanSpokenPlan(result, STEPS)).toEqual(LEVEL);
  });
});

describe('when the plan is said (#602)', () => {
  it('says a new plan once it has held while still', () => {
    const speak = createSpokenGuidance();
    expect(speak(REAR_LEFT_STEP_2, true, 0)).toBeNull();
    expect(speak(REAR_LEFT_STEP_2, true, SPEECH_DWELL_MS)).toEqual(REAR_LEFT_STEP_2);
  });

  it('never speaks while the vehicle moves', () => {
    const speak = createSpokenGuidance();
    for (let t = 0; t <= 3 * SPEECH_REPEAT_MS; t += 100) {
      expect(speak(REAR_LEFT_STEP_2, false, t)).toBeNull();
    }
  });

  it('repeats an unchanged plan only after the repeat interval', () => {
    const speak = createSpokenGuidance();
    speak(REAR_LEFT_STEP_2, true, 0);
    expect(speak(REAR_LEFT_STEP_2, true, SPEECH_DWELL_MS)).not.toBeNull();
    for (let t = SPEECH_DWELL_MS + 100; t < SPEECH_DWELL_MS + SPEECH_REPEAT_MS; t += 100) {
      expect(speak(REAR_LEFT_STEP_2, true, t)).toBeNull();
    }
    expect(speak(REAR_LEFT_STEP_2, true, SPEECH_DWELL_MS + SPEECH_REPEAT_MS)).not.toBeNull();
  });

  it('says a changed plan as soon as it has held, without waiting for the repeat', () => {
    const speak = createSpokenGuidance();
    speak(REAR_LEFT_STEP_2, true, 0);
    speak(REAR_LEFT_STEP_2, true, SPEECH_DWELL_MS);
    const step1: SpokenPlan = {
      isLevel: false,
      parts: [{ kind: 'wheel', wheel: 'rearLeft', step: 1, liftMm: 38, notEnough: false }],
    };
    expect(speak(step1, true, 2000)).toBeNull();
    expect(speak(step1, true, 2000 + SPEECH_DWELL_MS)).toEqual(step1);
  });

  it('never says a plan that only flickers past', () => {
    const speak = createSpokenGuidance();
    speak(REAR_LEFT_STEP_2, true, 0);
    expect(speak(REAR_LEFT_STEP_2, true, SPEECH_DWELL_MS)).not.toBeNull();
    expect(speak(LEVEL, true, 2000)).toBeNull();
    expect(speak(REAR_LEFT_STEP_2, true, 2000 + SPEECH_DWELL_MS / 2)).toBeNull();
  });

  it('says "level" once per arrival, never as a reminder', () => {
    const speak = createSpokenGuidance();
    speak(LEVEL, true, 0);
    expect(speak(LEVEL, true, SPEECH_DWELL_MS)).toEqual(LEVEL);
    expect(speak(LEVEL, true, SPEECH_DWELL_MS + 5 * SPEECH_REPEAT_MS)).toBeNull();
  });

  it('says "level" again after the vehicle has left level and come back', () => {
    const speak = createSpokenGuidance();
    speak(LEVEL, true, 0);
    speak(LEVEL, true, SPEECH_DWELL_MS);
    speak(REAR_LEFT_STEP_2, true, 2000);
    speak(REAR_LEFT_STEP_2, true, 2000 + SPEECH_DWELL_MS);
    speak(LEVEL, true, 4000);
    expect(speak(LEVEL, true, 4000 + SPEECH_DWELL_MS)).toEqual(LEVEL);
  });

  it('stays silent when not level but nothing can be done with the ramps', () => {
    const speak = createSpokenGuidance();
    const nothingToDo: SpokenPlan = { isLevel: false, parts: [] };
    expect(speak(nothingToDo, true, 0)).toBeNull();
    expect(speak(nothingToDo, true, SPEECH_DWELL_MS)).toBeNull();
  });
});

describe('only voices installed on the phone are used (#602, ADR 0005)', () => {
  const voices = [
    { name: 'net-sv', lang: 'sv-SE', localService: false },
    { name: 'en', lang: 'en-GB', localService: true },
    { name: 'sv', lang: 'sv_SE', localService: true },
  ];

  it('picks a local voice for the language, whatever its region', () => {
    expect(pickOfflineVoice(voices, 'sv')?.name).toBe('sv');
    expect(pickOfflineVoice(voices, 'en')?.name).toBe('en');
  });

  it('finds none when only a network voice speaks the language', () => {
    expect(pickOfflineVoice(voices, 'de')).toBeNull();
    expect(pickOfflineVoice(voices.slice(0, 1), 'sv')).toBeNull();
  });

  it('does not take a different language that shares the prefix', () => {
    expect(pickOfflineVoice([{ lang: 'es-ES', localService: true }], 'e')).toBeNull();
  });
});
