import { createElement } from '../dom';
import { legendIllustration, placementIllustration } from '../helpIllustrations';
import { SEVERITY_GLYPH } from '../rvDiagram';
import { t, type MessageKey } from '../i18n';
import type { Step } from './types';
import { paragraph, textClass, type WizardState } from './wizardState';

/** Modern legend rows: status color swatch, glyph, short text — the same
 * four severities the diagram itself uses (#110 originally shipped only
 * the first three; 'unserved' — the gray "ramps don't reach" wheel — was
 * missing here even though Classic's legend and the Help text both cover
 * it). */
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

    const swatch = createElement('span', `onboarding__legend-swatch ${swatchClass}`);
    swatch.setAttribute('aria-hidden', 'true');
    swatch.textContent = SEVERITY_GLYPH[severity];

    const text = createElement('span', 'onboarding__legend-text');
    text.textContent = t(textKey);

    row.append(swatch, text);
    container.append(row);
  }
  return container;
}

// How to read the answer (#71): the same legend and caption as the Help
// section in Classic; color swatch + glyph + short text rows in Modern (#110).
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

// External-sensor path (#285): the phone-placement step is skipped (the
// box, not the phone, is what must sit right), but its "how to read the
// answer" half is still needed — shown on its own here.
export function readScreenStep(state: WizardState): Step {
  return {
    title: t('help.screen.h'),
    build: () => readScreenElements(state),
  };
}
