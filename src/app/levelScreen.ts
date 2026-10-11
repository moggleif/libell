/**
 * The level screen as a whole (#392, step 2): building it from the
 * engine, the view and the frame, running its frame loop, and rebuilding
 * it when a saved change alters what it is built from.
 */
import type { Calibration, LevelSettings } from '../domain/settings';
import { createLevelEngine } from './levelEngine';
import { createLevelFrame, type LevelFrameDeps } from './levelFrame';
import { mountLevelScreenView } from './levelScreenView';

/**
 * What the screen is built from. A change to any of these rebuilds it,
 * dropping the stabilizer's history so the new plan applies at once;
 * everything else is read live by the running screen.
 */
export function levelScreenKey(s: LevelSettings): string {
  return JSON.stringify([
    s.vehicleType,
    s.rearAxle,
    s.wheelbaseMm,
    s.trackWidthFrontMm,
    s.trackWidthRearMm,
    s.rampStepHeightsMm,
    s.rampCount,
    s.drainPosition,
    s.toleranceMm,
    // Modern's silhouette/wheel-card markup differs structurally from
    // Classic's on-diagram text (#106).
    s.appearance,
  ]);
}

export interface LevelScreenHostDeps {
  settings: () => LevelSettings;
  /** Builds a fresh screen and returns its per-frame step. */
  build: () => (nowMs: number) => void;
  requestFrame?: (callback: () => void) => void;
  now?: () => number;
}

export interface LevelScreenHost {
  /** Builds the screen afresh and starts its frame loop. */
  show(): void;
  /** Rebuilds a shown screen if the settings it is built from changed. */
  rebuildIfChanged(): void;
}

export function createLevelScreenHost({
  settings,
  build,
  requestFrame = (callback) => void requestAnimationFrame(callback),
  now = () => performance.now(),
}: LevelScreenHostDeps): LevelScreenHost {
  // Bumped on every build, so a superseded screen's loop stops itself.
  let generation = 0;
  let builtKey: string | null = null;

  function show(): void {
    const mine = ++generation;
    builtKey = levelScreenKey(settings());
    const step = build();
    const frame = () => {
      if (mine !== generation) return;
      step(now());
      requestFrame(frame);
    };
    requestFrame(frame);
  }

  return {
    show,
    rebuildIfChanged() {
      if (builtKey !== null && builtKey !== levelScreenKey(settings())) show();
    },
  };
}

export interface LevelScreenDeps extends Omit<LevelFrameDeps, 'view' | 'playGuidancePulse'> {
  /** Calibration, zero and target, combined, for the active source. */
  calibration: () => Calibration | null;
  openActiveSensorPage(): void;
  retry(): Promise<void> | void;
  usePhoneSensor(): void;
  playChime(): void;
  playGuidancePulse: LevelFrameDeps['playGuidancePulse'];
  vibrate(pattern: number[]): void;
}

/** Builds the level screen into `root`; returns its per-frame step. */
export function buildLevelScreen(
  root: HTMLElement,
  deps: LevelScreenDeps,
): (nowMs: number) => void {
  const view = mountLevelScreenView(root, {
    createEngine: (output) => createLevelEngine(deps.settings, deps.calibration, output),
    openActiveSensorPage: deps.openActiveSensorPage,
    retry: deps.retry,
    usePhoneSensor: deps.usePhoneSensor,
    onCelebrate() {
      deps.vibrate([200, 100, 200]);
      if (deps.settings().soundOnLevel) deps.playChime();
    },
  });
  return createLevelFrame({ ...deps, view });
}
