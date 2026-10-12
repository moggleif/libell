import { createSensorSourceSection, type SensorSourceOptions } from '../sensorSourceSection';
import { availableExternalSensors } from '../../sensor/externalSensors';
import { t } from '../i18n';
import type { OnboardingOptions, Step } from './types';
import { paragraph, textClass, type WizardState } from './wizardState';

/** One option bag per available source (#272). Falls back to the
 * caller's bag alone when it supplies no per-source factory. */
function sourceBags(options: OnboardingOptions): SensorSourceOptions[] {
  const perSource = options.sensorOptionsFor;
  if (!perSource) return [options];
  return availableExternalSensors().map((sensor) => perSource(sensor));
}

// External path's calibration equivalent (#135, ADR 0014): connect the box,
// then check its position live (#317) — the same components the box's
// pages show. Connecting is asynchronous, so Next may be tapped before it
// resolves; the position step then says so and never blocks (#189, #365).
export function connectStep(state: WizardState): Step {
  return {
    title: t('menu.sensorSource'),
    note: () => t('onboard.note.connect', { next: t('onboard.next') }),
    build: () =>
      sourceBags(state.options).map((bag) => createSensorSourceSection(bag).connectElement),
  };
}

function isActiveSource(bag: SensorSourceOptions): boolean {
  return bag.getSensorSource() === bag.sensor.id;
}

/** Calls `frame` every animation frame while `anchor` is in the document. */
function whileShown(anchor: Element, frame: () => void): void {
  const tick = () => {
    if (!anchor.isConnected) return;
    frame();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// No box connected (#365): say so, and that Next goes on. Should a
// connection started on the previous step land while this is shown, the
// step redraws with the live position.
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

// Only the box's position, live (#317, the #309 UX review): direction and
// zero wait for the first parking, where the box's own page guides them
// and the amber lamp reminds until they are done.
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
