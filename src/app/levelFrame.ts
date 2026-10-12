/**
 * One frame of the level screen: what it shows for the reading at hand, and
 * when the celebration and the audio guidance fire. The elements live in
 * `levelScreenView.ts` behind `LevelFrameView`; this module only decides.
 */
import { createAudioGuidance, type GuidanceDirection } from '../domain/audioGuidance';
import { BOX_SMOOTHING_TIME_CONSTANT_MS, createGravityLowPass } from '../domain/boxSmoothing';
import { tiltFromGravity, type GravityVector } from '../domain/leveling';
import { createExternalPoseDetector, createPoseDetector, type ExternalPose } from '../domain/pose';
import type { LevelSettings, SensorSource } from '../domain/settings';
import { createStillnessDetector } from '../domain/stillness';
import type { ExternalSensorController } from '../sensor/externalSensorController';
import { externalSensorById } from '../sensor/externalSensors';
import type { OrientationSensor } from '../sensor/orientation';
import { isSensorUnavailable } from '../sensor/sensorFallback';
import type { MessageKey } from '../ui/i18n';
import { isActiveSensorStale } from './sensorStaleness';

export interface EngineTick {
  isLevel: boolean;
  maxCorrectionMm: number;
}

/** Why the pose guard pauses the guidance, and what it says. */
export interface PoseProblem {
  message: MessageKey;
  hint: MessageKey;
  /** A box's own page can help; the phone has none. */
  offerSensorPage: boolean;
}

export interface LevelFrameView {
  /** A page is open over the screen: hide every overlay and prompt. */
  pause(): void;
  /** No reading: dim the screen, and either wait or offer the way back. */
  showNoData(unavailable: boolean, canRetrySilently: boolean): void;
  /** A reading: undim, and clear the waiting hint and the prompt. */
  showReading(): void;
  showStale(offerSensorPage: boolean): void;
  hideStale(): void;
  showPose(problem: PoseProblem): void;
  hidePose(): void;
  tick(gravity: GravityVector, nowMs: number): EngineTick;
  showMeasuring(): void;
  celebrate(): void;
  hideCelebration(): void;
}

export interface LevelFrameDeps {
  /** Read fresh on every use: the active source changes. */
  sensor: () => OrientationSensor;
  /** Settings, help, a box page or the wizard is open. */
  isPaused: () => boolean;
  /** Indicators that follow the sensor even while a page is open. */
  refreshStatus: () => void;
  externalSensors: Pick<ExternalSensorController<never>, 'canRetrySilently' | 'maybeAutoRetry'>;
  hasSensorPage: boolean;
  isLandscape: () => boolean;
  isVisible: () => boolean;
  settings: () => LevelSettings;
  playGuidancePulse: (pitchHz: number, direction: GuidanceDirection) => void;
  view: LevelFrameView;
}

// The celebration re-arms only after the vehicle has been CLEARLY un-level,
// well past the tolerance and sustained, so jitter at the boundary can never
// celebrate again.
const REARM_MARGIN_MM = 15;
const REARM_SUSTAIN_MS = 3000;
const CELEBRATE_COOLDOWN_MS = 20000;

/** One frame at `nowMs`; the caller schedules the next. */
export function createLevelFrame(deps: LevelFrameDeps): (nowMs: number) => void {
  const { view } = deps;
  const detectPose = createPoseDetector();
  const detectExternalPose = createExternalPoseDetector();
  // Rocking vehicle: "Measuring…" until the reading has been calm.
  const isStill = createStillnessDetector();
  const celebration = createCelebration(deps);
  const guidance = createGuidancePulses(deps);
  const smoothBox = createBoxSmoothing();

  function frame(nowMs: number): void {
    // Refreshed every frame, a page open or not: a lost box is only ever
    // seen by polling its state.
    deps.refreshStatus();
    // The user is reading, phone in hand: no nagging, no celebration.
    if (deps.isPaused()) {
      view.pause();
      return;
    }
    const sensor = deps.sensor();
    const gravity = smoothBox(sensor.getSource(), sensor.getGravity(), nowMs);
    if (gravity) showReading(gravity, nowMs);
    else showNoData(nowMs);
  }

  /** No reading yet, or no longer: never a frozen last frame. */
  function showNoData(nowMs: number): void {
    const unavailable = isSensorUnavailable(deps.sensor().getState());
    view.showNoData(unavailable, deps.externalSensors.canRetrySilently());
    if (unavailable) deps.externalSensors.maybeAutoRetry(nowMs);
  }

  function showReading(gravity: GravityVector, nowMs: number): void {
    view.showReading();
    // Stale before pose: a reading too old to trust is not safe
    // to judge the pose from either, and the overlays never both show.
    if (isActiveSensorStale(deps.sensor(), nowMs)) {
      view.showStale(deps.hasSensorPage && deps.sensor().getSource() !== 'phone');
      view.hidePose();
      view.hideCelebration();
      return;
    }
    view.hideStale();
    const problem = poseProblem(gravity);
    if (problem) {
      view.showPose(problem);
      view.hideCelebration();
      return;
    }
    view.hidePose();
    guide(gravity, nowMs);
  }

  /** The phone's pose rules (R17) are the phone's; a mounted box is only
   * checked for positions too extreme to be a real mount (R43). */
  function poseProblem(gravity: GravityVector): PoseProblem | null {
    const source = deps.sensor().getSource();
    if (source === 'phone') {
      if (detectPose(gravity) === 'not-flat') return phoneProblem('pose.layFlat');
      return deps.isLandscape() ? phoneProblem('pose.portrait') : null;
    }
    const pose = detectExternalPose(gravity);
    if (pose === 'ok') return null;
    // A box built to stand is told to stand, never to lie flat.
    const upright = externalSensorById(source)?.capabilities.upright ?? false;
    return {
      message: upright ? 'pose.sensorNotUpright' : boxPoseMessage(pose),
      hint: upright ? 'pose.sensorHintUpright' : 'pose.sensorHint',
      offerSensorPage: true,
    };
  }

  function guide(gravity: GravityVector, nowMs: number): void {
    const tilt = tiltFromGravity(gravity, null);
    const still = isStill((tilt.roll * 180) / Math.PI, (tilt.pitch * 180) / Math.PI, nowMs);
    const engine = view.tick(gravity, nowMs);
    // Momentary readings mean nothing while the vehicle rocks.
    if (!still) view.showMeasuring();
    celebration.onReading(engine, still, nowMs);
    if (!engine.isLevel) view.hideCelebration();
    guidance.onReading(engine, still, nowMs);
    celebration.rearm(engine, nowMs);
  }

  return frame;
}

/**
 * A box's few, raw readings glide frame by frame (`domain/boxSmoothing.ts`);
 * the phone's are smoothed at the sensor already. A new source or a lost
 * reading starts the glide afresh, so it never blends two sources.
 */
function createBoxSmoothing() {
  const lowPass = createGravityLowPass(BOX_SMOOTHING_TIME_CONSTANT_MS);
  let lastSource: SensorSource | null = null;
  return (
    source: SensorSource,
    gravity: GravityVector | null,
    nowMs: number,
  ): GravityVector | null => {
    if (source !== lastSource || gravity === null || source === 'phone') lowPass.reset();
    lastSource = source;
    if (gravity === null || source === 'phone') return gravity;
    return lowPass(gravity, nowMs);
  };
}

function phoneProblem(message: MessageKey): PoseProblem {
  return { message, hint: 'pose.sensorHint', offerSensorPage: false };
}

function boxPoseMessage(pose: Exclude<ExternalPose, 'ok'>): MessageKey {
  return pose === 'upside-down' ? 'pose.sensorUpsideDown' : 'pose.sensorExtreme';
}

/** The vibration and overlay fire once per actual leveling. */
function createCelebration(deps: LevelFrameDeps) {
  let wasLevel = false;
  let armed = false;
  let clearlyUnlevelSince: number | null = null;
  let lastAt = -Infinity;

  function celebrate(nowMs: number): void {
    if (!armed || !deps.isVisible()) return;
    if (nowMs - lastAt < CELEBRATE_COOLDOWN_MS) return;
    armed = false;
    lastAt = nowMs;
    deps.view.celebrate();
  }

  return {
    onReading({ isLevel }: EngineTick, still: boolean, nowMs: number): void {
      if (still && isLevel && !wasLevel) celebrate(nowMs);
      wasLevel = isLevel;
    },
    rearm({ isLevel, maxCorrectionMm }: EngineTick, nowMs: number): void {
      if (!isLevel && maxCorrectionMm > deps.settings().toleranceMm + REARM_MARGIN_MM) {
        clearlyUnlevelSince ??= nowMs;
        if (nowMs - clearlyUnlevelSince >= REARM_SUSTAIN_MS) armed = true;
      } else {
        clearlyUnlevelSince = null;
      }
    },
  };
}

/** Fed every frame so the direction hysteresis keeps up, but a pulse plays
 * only while still. */
function createGuidancePulses(deps: LevelFrameDeps) {
  const guideAudio = createAudioGuidance();
  let lastPulseAt = -Infinity;
  return {
    onReading({ isLevel, maxCorrectionMm }: EngineTick, still: boolean, nowMs: number): void {
      const settings = deps.settings();
      const guidance = guideAudio(maxCorrectionMm, isLevel, settings, nowMs);
      if (
        settings.soundGuidance &&
        still &&
        guidance.pulseIntervalMs !== null &&
        guidance.pitchHz !== null &&
        nowMs - lastPulseAt >= guidance.pulseIntervalMs
      ) {
        deps.playGuidancePulse(guidance.pitchHz, guidance.direction);
        lastPulseAt = nowMs;
      }
    },
  };
}
