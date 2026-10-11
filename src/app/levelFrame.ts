/**
 * One frame of the level screen (#374): what the screen shows for the
 * reading at hand, and when the level celebration and the audio guidance
 * fire. The screen's elements stay in `main.ts` behind `LevelFrameView`;
 * this module only decides.
 */
import { createAudioGuidance, type GuidanceDirection } from '../domain/audioGuidance';
import { tiltFromGravity, type GravityVector } from '../domain/leveling';
import { createExternalPoseDetector, createPoseDetector, type ExternalPose } from '../domain/pose';
import type { LevelSettings } from '../domain/settings';
import { isSensorStale, STALE_TIMEOUT_PHONE_MS } from '../domain/staleness';
import { createStillnessDetector } from '../domain/stillness';
import type { ExternalSensorController } from '../sensor/externalSensorController';
import { externalSensorById } from '../sensor/externalSensors';
import type { OrientationSensor } from '../sensor/orientation';
import { isSensorUnavailable } from '../sensor/sensorFallback';
import type { MessageKey } from '../ui/i18n';

/** What the vehicle engine reports back for one reading. */
export interface EngineTick {
  isLevel: boolean;
  maxCorrectionMm: number;
}

/** Why the pose guard pauses the guidance, and what it says. */
export interface PoseProblem {
  message: MessageKey;
  hint: MessageKey;
  /** A box's own page can help (#285); the phone has none. */
  offerSensorPage: boolean;
}

/** The level screen's elements, as the frame drives them. */
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
  /** Compute and draw the guidance for this reading. */
  tick(gravity: GravityVector, nowMs: number): EngineTick;
  showMeasuring(): void;
  celebrate(): void;
  hideCelebration(): void;
}

export interface LevelFrameDeps {
  /** The source feeding readings right now, read fresh on every use. */
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

// Celebration arming (field feedback, twice): the trigger re-arms only
// after the vehicle has been CLEARLY un-level, well past the tolerance and
// sustained, so jitter at the boundary can never celebrate again.
const REARM_MARGIN_MM = 15;
const REARM_SUSTAIN_MS = 3000;
const CELEBRATE_COOLDOWN_MS = 20000;

/** One frame at `nowMs`; the caller schedules the next. */
export function createLevelFrame(deps: LevelFrameDeps): (nowMs: number) => void {
  const { view } = deps;
  const detectPose = createPoseDetector();
  const detectExternalPose = createExternalPoseDetector();
  // Rocking vehicle: "Measuring…" until the reading has been calm (#86).
  const isStill = createStillnessDetector();
  const celebration = createCelebration(deps);
  const guidance = createGuidancePulses(deps);

  function frame(nowMs: number): void {
    // Refreshed every frame, a page open or not: a lost box is only ever
    // seen by polling its state (#129).
    deps.refreshStatus();
    // The user is reading, phone in hand: no nagging, no celebration.
    if (deps.isPaused()) {
      view.pause();
      return;
    }
    const gravity = deps.sensor().getGravity();
    if (gravity) showReading(gravity, nowMs);
    else showNoData(nowMs);
  }

  /** No reading yet, or no longer (#116): never a frozen last frame. A
   * lost box gets the Retry prompt (#134) and a background retry (#211). */
  function showNoData(nowMs: number): void {
    const unavailable = isSensorUnavailable(deps.sensor().getState());
    view.showNoData(unavailable, deps.externalSensors.canRetrySilently());
    if (unavailable) deps.externalSensors.maybeAutoRetry(nowMs);
  }

  function showReading(gravity: GravityVector, nowMs: number): void {
    view.showReading();
    // Stale before pose (#132): a reading too old to trust is not safe
    // to judge the pose from either, and the overlays never both show.
    if (isStale(nowMs)) {
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

  /** Each box declares its own timeout (#266); the phone keeps its own. */
  function isStale(nowMs: number): boolean {
    const sensor = deps.sensor();
    const timeoutMs = externalSensorById(sensor.getSource())?.staleTimeoutMs;
    return isSensorStale(sensor.getLastSampleAt(), nowMs, timeoutMs ?? STALE_TIMEOUT_PHONE_MS);
  }

  /** The phone's pose rules (R17) are the phone's; a mounted box is only
   * checked for positions too extreme to be a real mount (#285, R43). */
  function poseProblem(gravity: GravityVector): PoseProblem | null {
    const source = deps.sensor().getSource();
    if (source === 'phone') {
      if (detectPose(gravity) === 'not-flat') return phoneProblem('pose.layFlat');
      return deps.isLandscape() ? phoneProblem('pose.portrait') : null;
    }
    const pose = detectExternalPose(gravity);
    if (pose === 'ok') return null;
    // A box built to stand (#304) is told to stand, never to lie flat.
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

function phoneProblem(message: MessageKey): PoseProblem {
  return { message, hint: 'pose.sensorHint', offerSensorPage: false };
}

function boxPoseMessage(pose: Exclude<ExternalPose, 'ok'>): MessageKey {
  return pose === 'upside-down' ? 'pose.sensorUpsideDown' : 'pose.sensorExtreme';
}

/** The vibration and overlay fire once per actual leveling (#124). */
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

/** Continuous audio guidance (#121, opt-in): fed every frame so its
 * direction hysteresis keeps up, but a pulse plays only while still. */
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
