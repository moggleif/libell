// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import type { OrientationSensor } from '../sensor/orientation';
import { buildLevelScreen, createLevelScreenHost, levelScreenKey } from './levelScreen';

describe('levelScreenKey', () => {
  const base = levelScreenKey(DEFAULT_SETTINGS);

  it.each<Partial<LevelSettings>>([
    { vehicleType: 'caravan' },
    { rearAxle: 'boggie' },
    { wheelbaseMm: DEFAULT_SETTINGS.wheelbaseMm + 1 },
    { trackWidthFrontMm: DEFAULT_SETTINGS.trackWidthFrontMm + 1 },
    { trackWidthRearMm: DEFAULT_SETTINGS.trackWidthRearMm + 1 },
    { rampStepHeightsMm: [10, 20] },
    { rampCount: DEFAULT_SETTINGS.rampCount + 1 },
    { rampStepless: true },
    { drainPosition: DEFAULT_SETTINGS.drainPosition === 'none' ? 'left' : 'none' },
    { toleranceMm: DEFAULT_SETTINGS.toleranceMm + 1 },
    { appearance: DEFAULT_SETTINGS.appearance === 'modern' ? 'classic' : 'modern' },
  ] as Partial<LevelSettings>[])('changes with %o', (change) => {
    expect(levelScreenKey({ ...DEFAULT_SETTINGS, ...change })).not.toBe(base);
  });

  it.each<Partial<LevelSettings>>([
    { soundOnLevel: !DEFAULT_SETTINGS.soundOnLevel },
    { soundGuidance: !DEFAULT_SETTINGS.soundGuidance },
    { displayUnit: DEFAULT_SETTINGS.displayUnit === 'mm' ? 'cm' : 'mm' },
    { theme: DEFAULT_SETTINGS.theme === 'dark' ? 'light' : 'dark' },
  ] as Partial<LevelSettings>[])('stays the same with %o', (change) => {
    expect(levelScreenKey({ ...DEFAULT_SETTINGS, ...change })).toBe(base);
  });
});

/** A host over a manual animation-frame queue. */
function setup() {
  let settings: LevelSettings = { ...DEFAULT_SETTINGS };
  const queue: (() => void)[] = [];
  const frames: string[] = [];
  let builds = 0;
  const build = vi.fn(() => {
    const screen = `screen${++builds}`;
    return (nowMs: number) => void frames.push(`${screen}@${nowMs}`);
  });
  const host = createLevelScreenHost({
    settings: () => settings,
    build,
    requestFrame: (callback) => void queue.push(callback),
    now: () => 7,
  });
  const runFrames = (count: number) => {
    for (let i = 0; i < count; i += 1) queue.shift()?.();
  };
  return {
    host,
    build,
    frames,
    runFrames,
    queue,
    change: (next: Partial<LevelSettings>) => (settings = { ...settings, ...next }),
  };
}

describe('createLevelScreenHost', () => {
  it('builds the screen and runs its frame on every animation frame', () => {
    const { host, build, frames, runFrames } = setup();
    host.show();
    expect(build).toHaveBeenCalledTimes(1);
    expect(frames).toEqual([]);
    runFrames(3);
    expect(frames).toEqual(['screen1@7', 'screen1@7', 'screen1@7']);
  });

  it('does not build a screen that was never shown', () => {
    const { host, build, change } = setup();
    change({ vehicleType: 'caravan' });
    host.rebuildIfChanged();
    expect(build).not.toHaveBeenCalled();
  });

  it('keeps the screen when the change is not one it is built from', () => {
    const { host, build, change } = setup();
    host.show();
    change({ soundOnLevel: !DEFAULT_SETTINGS.soundOnLevel });
    host.rebuildIfChanged();
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('rebuilds on a change it is built from, and the old loop stops', () => {
    const { host, build, frames, runFrames, queue, change } = setup();
    host.show();
    runFrames(1);
    change({ vehicleType: 'caravan' });
    host.rebuildIfChanged();
    expect(build).toHaveBeenCalledTimes(2);
    runFrames(4);
    expect(frames).toEqual(['screen1@7', 'screen2@7', 'screen2@7', 'screen2@7']);
    // One loop left: one frame waiting.
    expect(queue).toHaveLength(1);
  });

  it('rebuilds only once for one change', () => {
    const { host, build, change } = setup();
    host.show();
    change({ toleranceMm: 99 });
    host.rebuildIfChanged();
    host.rebuildIfChanged();
    expect(build).toHaveBeenCalledTimes(2);
  });

  it('builds afresh on every show', () => {
    const { host, build } = setup();
    host.show();
    host.show();
    expect(build).toHaveBeenCalledTimes(2);
  });
});

describe('buildLevelScreen', () => {
  it('builds the screen for the vehicle into the root and steps it', () => {
    const root = document.createElement('div');
    const sensor = {
      getSource: () => 'phone',
      getState: () => 'granted',
      getGravity: () => ({ x: 0, y: 0, z: 9.81 }),
      getLastSampleAt: () => 0,
    } as unknown as OrientationSensor;
    const step = buildLevelScreen(root, {
      sensor: () => sensor,
      isPaused: () => false,
      refreshStatus: () => {},
      boxes: { canRetrySilently: () => true, maybeAutoRetry: () => {} },
      hasSensorPage: false,
      isLandscape: () => false,
      isVisible: () => true,
      settings: () => ({ ...DEFAULT_SETTINGS, vehicleType: 'caravan' }),
      calibration: () => null,
      openActiveSensorPage: () => {},
      retry: () => {},
      usePhoneSensor: () => {},
      playChime: () => {},
      playGuidancePulse: () => {},
      speak: () => {},
      vibrate: () => {},
    });
    expect(root.querySelector('svg')?.getAttribute('aria-label')).toContain('caravan');
    const before = root.textContent;
    step(0);
    step(1000);
    // A step draws the reading: the tilt readout for the flat gravity (#526).
    expect(root.textContent).not.toBe(before);
    expect(root.textContent).toContain('Front/back +0.0°');
  });
});
