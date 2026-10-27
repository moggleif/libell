import { createElement, paragraph, textElement } from '../dom';
import { legendIllustration, placementIllustration } from '../helpIllustrations';
import { SEVERITY_GLYPH } from '../rvDiagram';
import { t, type MessageKey } from '../i18n';
import type { Step } from './types';
import { textClass, type WizardState } from './wizardState';

/** The same four severities the diagram uses, 'unserved' included. */
const LEGEND_ROWS: [string, keyof typeof SEVERITY_GLYPH, MessageKey][] = [
  ['onboarding__legend-swatch--ok', 'none', 'onboard.legend.ok'],
  ['onboarding__legend-swatch--up', 'small', 'onboard.legend.up'],
  ['onboarding__legend-swatch--no', 'large', 'onboard.legend.no'],
  ['onboarding__legend-swatch--dim', 'unserved', 'onboard.legend.dim'],
];

function buildModernLegend(): HTMLElement {
  const container = createElement('div', 'onboarding__legend');
  for (const [swatchClass, severity, textKey] of LEGEND_ROWS) {
    const row = createElement('div', 'onboarding__legend-row');

    const swatchClasses = `onboarding__legend-swatch ${swatchClass}`;
    const swatch = textElement('span', swatchClasses, SEVERITY_GLYPH[severity]);
    swatch.setAttribute('aria-hidden', 'true');

    const text = textElement('span', 'onboarding__legend-text', t(textKey));

    row.append(swatch, text);
    container.append(row);
  }
  return container;
}

function readScreenElements(state: WizardState): Element[] {
  if (state.isModern) return [buildModernLegend()];
  return [legendIllustration(t('help.screen.h')), paragraph('menu__text', t('help.screen.t'))];
}

export function placementStep(state: WizardState): Step {
  return {
    title: t('onboard.step1.h'),
    build: () => [
      placementIllustration(t('onboard.step1.h'), state.vehicleChoice),
      paragraph(textClass(state), t('help.what.t')),
      ...readScreenElements(state),
    ],
  };
}

// External-sensor path: the phone-placement step is skipped (the box, not
// the phone, must sit right), but its "how to read the answer" half is not.
export function readScreenStep(state: WizardState): Step {
  return {
    title: t('help.screen.h'),
    build: () => readScreenElements(state),
  };
}
