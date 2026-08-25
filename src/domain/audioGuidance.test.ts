import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';
import {
  createAudioGuidance,
  DIRECTION_DWELL_MS,
  GUIDANCE_RANGE_MM,
  MAX_PITCH_HZ,
  MAX_PULSE_INTERVAL_MS,
  MIN_PITCH_HZ,
  MIN_PULSE_INTERVAL_MS,
} from './audioGuidance';

const settings = { ...DEFAULT_SETTINGS, toleranceMm: 20, stabilityMm: 3 };

describe('audio guidance (#121)', () => {
  it('is silent (no pulse/pitch) while level — the R16 chime owns "reached"', () => {
    const guide = createAudioGuidance();
    const state = guide(0, true, settings, 0);
    expect(state.pulseIntervalMs).toBeNull();
    expect(state.pitchHz).toBeNull();
    expect(state.direction).toBe('steady');
  });

  it('pulses faster and pitches higher the closer the stabilized distance is to level', () => {
    const guide = createAudioGuidance();
    const far = guide(settings.toleranceMm + GUIDANCE_RANGE_MM, false, settings, 0);
    const mid = guide(settings.toleranceMm + GUIDANCE_RANGE_MM / 2, false, settings, 100);
    const near = guide(settings.toleranceMm, false, settings, 200);

    expect(far.pulseIntervalMs).toBe(MAX_PULSE_INTERVAL_MS);
    expect(near.pulseIntervalMs).toBe(MIN_PULSE_INTERVAL_MS);
    expect(mid.pulseIntervalMs!).toBeGreaterThan(near.pulseIntervalMs!);
    expect(mid.pulseIntervalMs!).toBeLessThan(far.pulseIntervalMs!);

    expect(far.pitchHz).toBe(MIN_PITCH_HZ);
    expect(near.pitchHz).toBe(MAX_PITCH_HZ);
    expect(mid.pitchHz!).toBeGreaterThan(far.pitchHz!);
    expect(mid.pitchHz!).toBeLessThan(near.pitchHz!);
  });

  it('clamps distances beyond the guidance range to the slowest/lowest pulse', () => {
    const guide = createAudioGuidance();
    const state = guide(settings.toleranceMm + GUIDANCE_RANGE_MM * 5, false, settings, 0);
    expect(state.pulseIntervalMs).toBe(MAX_PULSE_INTERVAL_MS);
    expect(state.pitchHz).toBe(MIN_PITCH_HZ);
  });

  it('reports "improving" only once a decrease clears the dead band AND sustains the dwell', () => {
    const guide = createAudioGuidance();
    guide(100, false, settings, 0);
    // Clearly below the dead band — but a fresh candidate, not yet sustained.
    let state = guide(80, false, settings, 100);
    expect(state.direction).toBe('steady');
    state = guide(80, false, settings, 100 + DIRECTION_DWELL_MS - 50);
    expect(state.direction).toBe('steady');
    // Sustained past the dwell: now it commits.
    state = guide(80, false, settings, 100 + DIRECTION_DWELL_MS + 50);
    expect(state.direction).toBe('improving');
  });

  it('reports "worsening" once a sustained increase clears the dead band', () => {
    const guide = createAudioGuidance();
    guide(50, false, settings, 0);
    guide(70, false, settings, 100);
    const state = guide(70, false, settings, 100 + DIRECTION_DWELL_MS + 50);
    expect(state.direction).toBe('worsening');
  });

  it('never flips direction on raw jitter that stays inside the stability dead band', () => {
    const guide = createAudioGuidance();
    guide(50, false, settings, 0);
    let t = 0;
    for (let i = 0; i < 20; i++) {
      t += 100;
      // Jitters by less than settings.stabilityMm around 50mm.
      const jittered = 50 + (i % 2 === 0 ? 1 : -1) * (settings.stabilityMm - 0.5);
      const state = guide(jittered, false, settings, t);
      expect(state.direction).toBe('steady');
    }
  });

  it('a brief reversal shorter than the dwell does not flip the committed direction', () => {
    const guide = createAudioGuidance();
    guide(100, false, settings, 0);
    guide(70, false, settings, 100);
    let state = guide(70, false, settings, 100 + DIRECTION_DWELL_MS + 50);
    expect(state.direction).toBe('improving');
    // A worsening blip is registered but released before its own dwell.
    state = guide(85, false, settings, 100 + DIRECTION_DWELL_MS + 100);
    expect(state.direction).toBe('improving');
    state = guide(70, false, settings, 100 + DIRECTION_DWELL_MS + 150);
    expect(state.direction).toBe('improving');
  });

  it('a sustained reversal is recognized relative to the best point reached, not a stale start', () => {
    const guide = createAudioGuidance();
    guide(100, false, settings, 0);
    guide(60, false, settings, 100);
    let state = guide(60, false, settings, 100 + DIRECTION_DWELL_MS + 50);
    expect(state.direction).toBe('improving');
    // Turns around: only 6mm worse than the 60mm low point (deadband 3mm) —
    // clearly past the band relative to the true turning point.
    state = guide(66, false, settings, 100 + DIRECTION_DWELL_MS + 100);
    expect(state.direction).toBe('improving');
    state = guide(66, false, settings, 100 + DIRECTION_DWELL_MS + 100 + DIRECTION_DWELL_MS + 50);
    expect(state.direction).toBe('worsening');
  });

  it('resets direction tracking to "steady" after reaching level, so the next departure starts fresh', () => {
    const guide = createAudioGuidance();
    guide(100, false, settings, 0);
    guide(60, false, settings, 100);
    let state = guide(60, false, settings, 100 + DIRECTION_DWELL_MS + 50);
    expect(state.direction).toBe('improving');
    state = guide(0, true, settings, 2000);
    expect(state.direction).toBe('steady');
    // Departing level again: a single reading never instantly resurrects a
    // direction — it needs its own sustained dead-band move, just like a
    // cold start.
    state = guide(25, false, settings, 2100);
    expect(state.direction).toBe('steady');
  });
});
