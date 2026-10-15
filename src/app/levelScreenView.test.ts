// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { t } from '../ui/i18n';
import type { EngineOutput, LevelEngine } from './levelEngine';
import { mountLevelScreenView } from './levelScreenView';

const GRAVITY = { x: 0, y: 0, z: 9.81 };
const LEVEL_TICK = { isLevel: true, maxCorrectionMm: 0, spoken: { isLevel: true, parts: [] } };

function setup() {
  const root = document.createElement('div');
  root.append(document.createElement('span'));
  let output!: EngineOutput;
  const engineElement = document.createElement('div');
  engineElement.className = 'fake-engine';
  const engine: LevelEngine = {
    element: engineElement,
    tick: vi.fn(() => LEVEL_TICK),
  };
  const deps = {
    createEngine: vi.fn((out: EngineOutput) => {
      output = out;
      return engine;
    }),
    openActiveSensorPage: vi.fn(),
    retry: vi.fn(),
    usePhoneSensor: vi.fn(),
    onCelebrate: vi.fn(),
  };
  const view = mountLevelScreenView(root, deps);
  const $ = (selector: string) => root.querySelector<HTMLElement>(selector)!;
  return { root, view, deps, engine, output: () => output, $ };
}

describe('mountLevelScreenView', () => {
  it('replaces whatever the root held with the level screen, in order', () => {
    const { root } = setup();
    expect(root.classList.contains('app--level')).toBe(true);
    expect([...root.children].map((el) => el.className)).toEqual([
      'level-overlay',
      'fake-engine',
      'status-line',
      'tilt-readout',
      'app__hint',
      'sensor-fallback',
      'pose-overlay',
      'stale-overlay',
      'visually-hidden',
      'visually-hidden',
    ]);
  });

  it('starts with the status row empty and hidden, and every overlay hidden', () => {
    const { $ } = setup();
    expect($('.status-line').hidden).toBe(true);
    // Read through the announcer instead (#537): a just-unhidden live
    // region is often skipped.
    expect($('.status-line').hasAttribute('aria-live')).toBe(false);
    expect($('.app__hint').textContent).toBe(t('main.waiting'));
    expect($('.pose-overlay').hidden).toBe(true);
    expect($('.stale-overlay').hidden).toBe(true);
    expect($('.sensor-fallback').hidden).toBe(true);
    expect($('.level-overlay').hidden).toBe(true);
  });

  it('shows what the engine reports, and hides an empty status', () => {
    const { output, $ } = setup();
    output().showStatus('Almost', false);
    expect($('.status-line').textContent).toBe('Almost');
    expect($('.status-line').hidden).toBe(false);
    expect($('.status-line').classList.contains('status-line--level')).toBe(false);
    output().showStatus('', true);
    expect($('.status-line').hidden).toBe(true);
    expect($('.status-line').classList.contains('status-line--level')).toBe(true);
  });

  it('ticks the engine', () => {
    const { view, engine } = setup();
    expect(view.tick(GRAVITY, 5)).toEqual(LEVEL_TICK);
    expect(engine.tick).toHaveBeenCalledWith(GRAVITY, 5);
  });

  it('dims the screen with no data and offers the way back when unavailable', () => {
    const { view, output, $ } = setup();
    output().showStatus('Almost', false);
    view.showNoData(true, true);
    expect($('.fake-engine').classList.contains('is-no-data')).toBe(true);
    expect($('.tilt-readout').classList.contains('is-no-data')).toBe(true);
    expect($('.status-line').hidden).toBe(true);
    expect($('.app__hint').hidden).toBe(true);
    expect($('.sensor-fallback').hidden).toBe(false);
  });

  it('waits with the plain hint when no data but not unavailable', () => {
    const { view, $ } = setup();
    view.showNoData(false, true);
    expect($('.app__hint').hidden).toBe(false);
    expect($('.app__hint').textContent).toBe(t('main.waiting'));
    expect($('.sensor-fallback').hidden).toBe(true);
  });

  it('undims and clears the hint and the prompt on a reading', () => {
    const { view, $ } = setup();
    view.showNoData(true, true);
    view.showReading();
    expect($('.fake-engine').classList.contains('is-no-data')).toBe(false);
    expect($('.tilt-readout').classList.contains('is-no-data')).toBe(false);
    expect($('.app__hint').hidden).toBe(true);
    expect($('.sensor-fallback').hidden).toBe(true);
  });

  it('shows the stale overlay, with the box link only when offered', () => {
    const { view, $ } = setup();
    view.showStale(false);
    expect($('.stale-overlay').hidden).toBe(false);
    expect($('.stale-overlay__text').textContent).toBe(t('stale.dataUnavailable'));
    expect($('.stale-overlay button').hidden).toBe(true);
    view.showStale(true);
    expect($('.stale-overlay button').hidden).toBe(false);
    view.hideStale();
    expect($('.stale-overlay').hidden).toBe(true);
  });

  it('shows the pose problem, with the hint and the box link only when offered', () => {
    const { view, $ } = setup();
    view.showPose({ message: 'pose.portrait', hint: 'pose.sensorHint', offerSensorPage: false });
    expect($('.pose-overlay').hidden).toBe(false);
    expect($('.pose-overlay__text').textContent).toBe(t('pose.portrait'));
    expect($('.pose-overlay__hint').hidden).toBe(true);
    expect($('.pose-overlay button').hidden).toBe(true);
    view.showPose({
      message: 'pose.sensorNotUpright',
      hint: 'pose.sensorHintUpright',
      offerSensorPage: true,
    });
    expect($('.pose-overlay__hint').textContent).toBe(t('pose.sensorHintUpright'));
    expect($('.pose-overlay__hint').hidden).toBe(false);
    expect($('.pose-overlay button').hidden).toBe(false);
    view.hidePose();
    expect($('.pose-overlay').hidden).toBe(true);
  });

  it('opens the active box page from both overlays', () => {
    const { deps, $ } = setup();
    $('.pose-overlay button').click();
    $('.stale-overlay button').click();
    expect(deps.openActiveSensorPage).toHaveBeenCalledTimes(2);
    expect($('.pose-overlay button').textContent).toBe(t('pose.openSensorPage'));
  });

  it('says it is measuring, never as level', () => {
    const { view, output, $ } = setup();
    output().showStatus('', true);
    view.showMeasuring();
    expect($('.status-line').textContent).toBe(t('status.measuring'));
    expect($('.status-line').hidden).toBe(false);
    expect($('.status-line').classList.contains('status-line--level')).toBe(false);
  });

  it('celebrates with the overlay, and hides it again', () => {
    const { view, deps, $ } = setup();
    view.celebrate();
    expect(deps.onCelebrate).toHaveBeenCalledTimes(1);
    expect($('.level-overlay').hidden).toBe(false);
    view.hideCelebration();
    expect($('.level-overlay').hidden).toBe(true);
  });

  it('hides every overlay and prompt on pause', () => {
    const { view, $ } = setup();
    view.showStale(true);
    view.showPose({ message: 'pose.portrait', hint: 'pose.sensorHint', offerSensorPage: false });
    view.showNoData(true, true);
    view.celebrate();
    view.pause();
    expect($('.pose-overlay').hidden).toBe(true);
    expect($('.stale-overlay').hidden).toBe(true);
    expect($('.sensor-fallback').hidden).toBe(true);
    expect($('.level-overlay').hidden).toBe(true);
  });

  it('wires the fallback prompt to retry and to the phone', () => {
    const { view, deps, $ } = setup();
    view.showNoData(true, true);
    const [retry, usePhone] = $('.sensor-fallback').querySelectorAll('button');
    retry!.click();
    usePhone!.click();
    expect(deps.retry).toHaveBeenCalledTimes(1);
    expect(deps.usePhoneSensor).toHaveBeenCalledTimes(1);
  });
});

describe('what a screen reader hears from the level screen (#537)', () => {
  function announced(root: HTMLElement) {
    return {
      polite: () => root.querySelector('[role=status].visually-hidden')?.textContent,
      urgent: () => root.querySelector('[role=alert]')?.textContent,
    };
  }

  it('says once that the vehicle is level', () => {
    const { root, view } = setup();
    view.celebrate();
    expect(announced(root).polite()).toBe(t('main.level'));
  });

  it('says a new status sentence once, not on every frame that repeats it', () => {
    const { root, output } = setup();
    const said = vi.spyOn(
      root.querySelector('[role=status].visually-hidden')!,
      'textContent',
      'set',
    );
    output().showStatus('Almost level', false);
    output().showStatus('Almost level', false);
    expect(announced(root).polite()).toBe('Almost level');
    expect(said.mock.calls.filter(([text]) => text === 'Almost level')).toHaveLength(1);
  });

  it('says the pose problem when it appears or changes, not on every frame', () => {
    const { root, view } = setup();
    const said = vi.spyOn(
      root.querySelector('[role=status].visually-hidden')!,
      'textContent',
      'set',
    );
    const portrait = {
      message: 'pose.portrait',
      hint: 'pose.sensorHint',
      offerSensorPage: false,
    } as const;
    view.showPose(portrait);
    view.showPose(portrait);
    expect(said.mock.calls.filter(([text]) => text === t('pose.portrait'))).toHaveLength(1);
    view.hidePose();
    view.showPose(portrait);
    expect(said.mock.calls.filter(([text]) => text === t('pose.portrait'))).toHaveLength(2);
  });

  it('alerts once when the data goes stale', () => {
    const { root, view } = setup();
    const said = vi.spyOn(root.querySelector('[role=alert]')!, 'textContent', 'set');
    view.showStale(false);
    view.showStale(false);
    expect(announced(root).urgent()).toBe(t('stale.dataUnavailable'));
    expect(said.mock.calls.filter(([text]) => text === t('stale.dataUnavailable'))).toHaveLength(1);
  });
});
