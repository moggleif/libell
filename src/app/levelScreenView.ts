/** The level screen's elements, driven by the frame through `LevelFrameView`. */
import { t } from '../ui/i18n';
import { createLevelOverlay } from '../ui/levelOverlay';
import { createSensorFallbackPrompt } from '../ui/sensorFallbackPrompt';
import { createTiltReadout } from '../ui/tiltReadout';
import type { EngineOutput, LevelEngine } from './levelEngine';
import type { LevelFrameView, PoseProblem } from './levelFrame';

export interface LevelScreenViewDeps {
  createEngine(output: EngineOutput): LevelEngine;
  openActiveSensorPage(): void;
  /** The lost-box prompt's Reconnect and its way back to the phone. */
  retry(): Promise<void> | void;
  usePhoneSensor(): void;
  /** What celebrating does besides the overlay: vibrate, chime. */
  onCelebrate(): void;
}

/** Replaces `root`'s content with a fresh level screen. */
export function mountLevelScreenView(root: HTMLElement, deps: LevelScreenViewDeps): LevelFrameView {
  root.replaceChildren();
  root.classList.add('app--level');
  const parts = createParts(deps);
  root.append(
    parts.levelOverlay.element,
    parts.engine.element,
    parts.status.element,
    parts.tilt.element,
    parts.waiting,
    parts.fallbackPrompt.element,
    parts.pose.element,
    parts.stale.element,
  );
  return viewOf(parts, deps);
}

type Parts = ReturnType<typeof createParts>;

function createParts(deps: LevelScreenViewDeps) {
  const status = createStatusLine();
  const tilt = createTiltReadout();
  return {
    status,
    tilt,
    waiting: hint(t('main.waiting')),
    fallbackPrompt: createSensorFallbackPrompt(deps.retry, deps.usePhoneSensor),
    levelOverlay: createLevelOverlay(),
    engine: deps.createEngine({
      showStatus(text, isLevel) {
        status.show(text);
        status.markLevel(isLevel);
      },
      showTilt: (reading) => tilt.update(reading),
    }),
    pose: createPoseOverlay(deps.openActiveSensorPage),
    stale: createStaleOverlay(deps.openActiveSensorPage),
  };
}

function viewOf(parts: Parts, deps: LevelScreenViewDeps): LevelFrameView {
  const { status, waiting, fallbackPrompt, levelOverlay, engine, pose, stale } = parts;
  return {
    pause() {
      pose.element.hidden = true;
      stale.element.hidden = true;
      fallbackPrompt.update(false, true);
      levelOverlay.hideNow();
    },
    showNoData(unavailable, canRetrySilently) {
      dim(parts, true);
      fallbackPrompt.update(unavailable, canRetrySilently);
      // The plain hint and the Retry prompt never show at once.
      waiting.hidden = unavailable;
      if (!unavailable) waiting.textContent = t('main.waiting');
    },
    showReading() {
      dim(parts, false);
      waiting.hidden = true;
      fallbackPrompt.update(false, true);
    },
    showStale: stale.show,
    hideStale: () => (stale.element.hidden = true),
    showPose: pose.show,
    hidePose: () => (pose.element.hidden = true),
    tick: (gravity, nowMs) => engine.tick(gravity, nowMs),
    showMeasuring() {
      status.show(t('status.measuring'));
      status.markLevel(false);
    },
    celebrate() {
      deps.onCelebrate();
      levelOverlay.celebrate();
    },
    hideCelebration: () => levelOverlay.hideNow(),
  };
}

/** While there is no reading at all (first load, or a lost box), the
 * diagram and readout are dimmed and say nothing: the last frame's steps
 * must never stay on screen looking live. */
function dim({ engine, tilt, status }: Parts, noData: boolean): void {
  engine.element.classList.toggle('is-no-data', noData);
  tilt.element.classList.toggle('is-no-data', noData);
  if (noData) status.show('');
}

/**
 * The status row speaks only when it has something the diagram cannot
 * show, and hides itself otherwise rather than hold a blank line.
 */
function createStatusLine() {
  const element = document.createElement('p');
  element.className = 'status-line';
  element.setAttribute('aria-live', 'polite');
  const show = (text: string): void => {
    element.textContent = text;
    element.hidden = text === '';
  };
  show('');
  return {
    element,
    show,
    markLevel: (isLevel: boolean) => element.classList.toggle('status-line--level', isLevel),
  };
}

function hint(text: string): HTMLParagraphElement {
  const element = document.createElement('p');
  element.className = 'app__hint';
  element.textContent = text;
  return element;
}

function sensorPageButton(onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu__action';
  button.textContent = t('pose.openSensorPage');
  button.addEventListener('click', onClick);
  return button;
}

/** Wrong-pose overlay instead of wrong guidance; for a box, what to do
 * about it and a link to its page. */
function createPoseOverlay(openSensorPage: () => void) {
  const element = document.createElement('div');
  element.className = 'pose-overlay';
  element.hidden = true;
  const text = document.createElement('p');
  text.className = 'pose-overlay__text';
  const hintText = document.createElement('p');
  hintText.className = 'pose-overlay__hint';
  hintText.textContent = t('pose.sensorHint');
  const button = sensorPageButton(openSensorPage);
  element.append(text, hintText, button);
  return {
    element,
    show(problem: PoseProblem) {
      text.textContent = t(problem.message);
      hintText.textContent = t(problem.hint);
      hintText.hidden = button.hidden = !problem.offerSensorPage;
      element.hidden = false;
    },
  };
}

/** No trustworthy data at all: the guidance is hidden rather than left
 * frozen; for a box, a link to its page. */
function createStaleOverlay(openSensorPage: () => void) {
  const element = document.createElement('div');
  element.className = 'stale-overlay';
  element.hidden = true;
  const text = document.createElement('p');
  text.className = 'stale-overlay__text';
  text.textContent = t('stale.dataUnavailable');
  const button = sensorPageButton(openSensorPage);
  element.append(text, button);
  return {
    element,
    show(offerSensorPage: boolean) {
      button.hidden = !offerSensorPage;
      element.hidden = false;
    },
  };
}
