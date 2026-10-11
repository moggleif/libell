// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createLearnMountingSection, type LearnMountingOptions } from './learnMountingSection';
import { setLanguage, t } from './i18n';
import type { AxisMapping } from '../domain/axisMapping';
import type { Calibration } from '../domain/settings';

setLanguage('en');

function makeOptions(
  readings: (Calibration | null)[],
  overrides: Partial<LearnMountingOptions> = {},
): LearnMountingOptions & { saved: (AxisMapping | null)[] } {
  const saved: (AxisMapping | null)[] = [];
  let stored: AxisMapping | null = null;
  return {
    name: 'Xparkle',
    getRawReading: () => (readings.length > 1 ? readings.shift()! : readings[0]!),
    getLearnedMounting: () => stored,
    setLearnedMounting: (mapping) => {
      stored = mapping;
      saved.push(mapping);
    },
    saved,
    ...overrides,
  };
}

function button(root: HTMLElement, text: string): HTMLButtonElement {
  const found = [...root.querySelectorAll('button')].find(
    (b) => b.textContent === text && !b.hidden,
  );
  if (!found) throw new Error(`no visible button "${text}"`);
  return found;
}

describe('learn the mounting in Libell (#293)', () => {
  it('walks start → front → right and stores the learned mapping', () => {
    // The box is mounted turned a quarter: lifting the front moves its roll.
    const options = makeOptions([
      { pitchDeg: 0, rollDeg: 0 },
      { pitchDeg: 0, rollDeg: -3 },
      { pitchDeg: 2, rollDeg: 0 },
    ]);
    const section = createLearnMountingSection(options);
    section.refresh();
    expect(section.element.textContent).toContain(t('sensorSource.learn.status.none'));

    button(section.element, t('sensorSource.learn.start')).click();
    expect(section.element.textContent).toContain(t('sensorSource.learn.step.front'));
    button(section.element, t('sensorSource.learn.capture.front')).click();
    expect(section.element.textContent).toContain(t('sensorSource.learn.step.right'));
    button(section.element, t('sensorSource.learn.capture.right')).click();

    expect(options.saved).toEqual([{ swap: true, pitchSign: -1, rollSign: 1 }]);
    expect(section.element.textContent).toContain(t('sensorSource.learn.done'));
  });

  it('says why when the lifts could not be told apart, and stores nothing', () => {
    const options = makeOptions([
      { pitchDeg: 0, rollDeg: 0 },
      { pitchDeg: 0.2, rollDeg: 0 },
      { pitchDeg: 0, rollDeg: 2 },
    ]);
    const section = createLearnMountingSection(options);
    button(section.element, t('sensorSource.learn.start')).click();
    button(section.element, t('sensorSource.learn.capture.front')).click();
    button(section.element, t('sensorSource.learn.capture.right')).click();
    expect(options.saved).toEqual([]);
    expect(section.element.textContent).toContain(t('sensorSource.learn.err.tooSmall'));
    // And the user can start over from there.
    button(section.element, t('sensorSource.learn.start'));
  });

  it('refuses to start without a live reading', () => {
    const options = makeOptions([null]);
    const section = createLearnMountingSection(options);
    button(section.element, t('sensorSource.learn.start')).click();
    expect(section.element.textContent).toContain(
      t('calibration.external.err.notConnected', { name: 'Xparkle' }),
    );
    button(section.element, t('sensorSource.learn.start'));
  });

  it('can be cancelled midway without storing anything', () => {
    const options = makeOptions([{ pitchDeg: 0, rollDeg: 0 }]);
    const section = createLearnMountingSection(options);
    button(section.element, t('sensorSource.learn.start')).click();
    button(section.element, t('sensorSource.learn.cancel')).click();
    expect(options.saved).toEqual([]);
    button(section.element, t('sensorSource.learn.start'));
  });

  it('offers no forget button of its own — the direction step has the one link (#343)', () => {
    const section = createLearnMountingSection(
      makeOptions([{ pitchDeg: 0, rollDeg: 0 }], {
        getLearnedMounting: () => ({ swap: false, pitchSign: -1, rollSign: -1 }),
      }),
    );
    section.refresh();
    expect(section.element.textContent).toContain(t('sensorSource.learn.status.learned'));
    expect(section.element.querySelectorAll('button')).toHaveLength(4);
  });
});
