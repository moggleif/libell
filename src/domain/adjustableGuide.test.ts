import { describe, expect, it } from 'vitest';
import { createAdjustableGuide, SETTLE_MS, type AdjustableReading } from './adjustableGuide';

// Half of LEVEL9's smallest 20 mm step: what driving up must at least take off.
const DROP_MM = 10;

const ground: AdjustableReading = { isLevel: false, still: true, hasStep: true, maxLiftMm: 60 };
const moving: AdjustableReading = { ...ground, still: false };

/** Feeds readings 100 ms apart and returns the phase after the last. */
function run(...readings: AdjustableReading[]) {
  const guide = createAdjustableGuide();
  let now = 0;
  let phase = guide(ground, DROP_MM, now);
  for (const reading of readings) phase = guide(reading, DROP_MM, (now += 100));
  return phase;
}

/** The same still reading for as long as the figures take to settle. */
const settled = (reading: AdjustableReading) =>
  Array.from({ length: SETTLE_MS / 100 + 1 }, () => reading);

describe('the adjustable-kloss line (#687)', () => {
  it('says to set the klossar first while on the ground with a step to set', () => {
    expect(run()).toBe('before');
  });

  it('hides once level', () => {
    expect(run({ ...ground, isLevel: true, maxLiftMm: 0 })).toBe('hidden');
  });

  it('hides when no step is planned on the ground', () => {
    expect(run({ ...ground, hasStep: false })).toBe('hidden');
  });

  it('keeps its text while the vehicle moves', () => {
    expect(run(moving, { ...moving, maxLiftMm: 5, hasStep: false })).toBe('before');
  });

  it('says to drive off once it has driven up and still is not level', () => {
    expect(run(moving, { ...ground, maxLiftMm: 25 })).toBe('after');
  });

  it('stays on the first text after reversing up to the klossar on the same ground', () => {
    expect(run(moving, { ...ground, maxLiftMm: 58 })).toBe('before');
  });

  it('still sees a drive-up when the shown lift catches up only after stopping', () => {
    expect(run(moving, { ...ground, maxLiftMm: 55 }, { ...ground, maxLiftMm: 40 })).toBe('after');
  });

  it('takes a new ground reading once settled without a drop', () => {
    // Reversed to a steeper spot, then driven up from there.
    const steeper = { ...ground, maxLiftMm: 90 };
    expect(run(moving, ...settled(steeper), moving, { ...ground, maxLiftMm: 75 })).toBe('after');
  });

  it('keeps the second text while standing on the klossar, whatever the plan says', () => {
    expect(
      run(moving, { ...ground, maxLiftMm: 25 }, { ...ground, maxLiftMm: 25, hasStep: false }),
    ).toBe('after');
  });

  it('goes back to the first text once driven off to the ground reading', () => {
    expect(run(moving, { ...ground, maxLiftMm: 25 }, moving, { ...ground, maxLiftMm: 61 })).toBe(
      'before',
    );
  });

  it('measures afresh after level: a later drive-up compares with the new ground', () => {
    const phase = run(
      { ...ground, isLevel: true, maxLiftMm: 0 },
      moving,
      ...settled({ ...ground, maxLiftMm: 30 }),
      moving,
      { ...ground, maxLiftMm: 26 },
    );
    expect(phase).toBe('before');
  });

  it('follows the ground reading while standing still before driving up', () => {
    // The ground reading settles from 60 to 30, then a drive-up to 25 is no drive-up.
    expect(run({ ...ground, maxLiftMm: 30 }, moving, { ...ground, maxLiftMm: 25 })).toBe('before');
  });
});
