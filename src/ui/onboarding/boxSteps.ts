import { createSensorSourceSection, type SensorSourceOptions } from '../sensorSourceSection';
import { availableBoxes } from '../../sensor/boxes';
import { t } from '../i18n';
import type { OnboardingOptions, Step } from './types';
import { paragraph, textClass, type WizardState } from './wizardState';

/** Falls back to the caller's bag alone when it supplies no per-source
 * factory. */
function sourceBags(options: OnboardingOptions): SensorSourceOptions[] {
  const perSource = options.sensorOptionsFor;
  if (!perSource) return [options];
  return availableBoxes().map((sensor) => perSource(sensor));
}

function whileShown(anchor: Element, frame: () => void): void {
  const tick = () => {
    if (!anchor.isConnected) return;
    frame();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// The external path's calibration equivalent (ADR 0014). Connecting is
// asynchronous, so Next may be tapped before it resolves; the position step
// then says so and never blocks. A box's password verdict arrives after the
// connect, so the cards redraw live, as on the box page (#390).
export function connectStep(state: WizardState): Step {
  return {
    title: t('menu.sensorSource'),
    note: () => t('onboard.note.connect', { next: t('onboard.next') }),
    build: () => {
      const sections = sourceBags(state.options).map((bag) => createSensorSourceSection(bag));
      const cards = sections.map((section) => section.connectElement);
      const [anchor] = cards;
      if (anchor) whileShown(anchor, () => sections.forEach((section) => section.refreshLive()));
      return cards;
    },
  };
}

function isActiveSource(bag: SensorSourceOptions): boolean {
  return bag.getSensorSource() === bag.sensor.id;
}

// Should a connection started on the previous step land while this is
// shown, the step redraws with the live position.
function notConnectedNote(state: WizardState, bags: SensorSourceOptions[]): Element {
  const notConnected = paragraph(
    textClass(state),
    t('onboard.boxPosition.notConnected', { next: t('onboard.next') }),
  );
  whileShown(notConnected, () => {
    if (bags.some(isActiveSource)) state.render();
  });
  return notConnected;
}

// Only the box's position: direction and zero wait for the first parking,
// where the box's own page guides them and the lamp reminds.
export function boxPositionStep(state: WizardState): Step {
  return {
    title: t('onboard.boxPosition.h'),
    build: () => {
      const bags = sourceBags(state.options);
      const sections = bags.filter(isActiveSource).map((bag) => createSensorSourceSection(bag));
      const later = paragraph(textClass(state), t('onboard.boxPosition.later'));
      if (sections.length === 0) return [notConnectedNote(state, bags), later];
      whileShown(later, () => sections.forEach((section) => section.refreshLive()));
      return [...sections.map((section) => section.positionElement), later];
    },
  };
}
