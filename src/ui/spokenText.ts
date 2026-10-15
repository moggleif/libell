/**
 * The words of spoken guidance (#602): the same labels the wheel cards
 * show, in the app's language, so what is heard matches what is drawn.
 */
import { formatLengthValue } from '../domain/lengths';
import type { SpokenPart, SpokenPlan, SpokenWheel } from '../domain/spokenGuidance';
import { AXLE_LABEL } from './caravanDiagram';
import { getLanguage, t, type MessageKey } from './i18n';
import { WHEEL_LABEL } from './rvDiagram';

/** The wheel cards' own names. */
const SPOKEN_WHEEL_LABEL: Record<SpokenWheel, MessageKey> = {
  ...WHEEL_LABEL,
  axleLeft: AXLE_LABEL.left,
  axleRight: AXLE_LABEL.right,
};

/** "Vänster bak, Steg 2" / "Veva upp 20 mm" / "Plant". */
export function spokenText(plan: SpokenPlan, unit: 'mm' | 'cm'): string {
  if (plan.isLevel) return t('speech.level');
  return plan.parts.map((part) => partText(part, unit)).join('. ');
}

function partText(part: SpokenPart, unit: 'mm' | 'cm'): string {
  if (part.kind === 'crank') {
    const action = t(part.direction === 'up' ? 'caravan.crankUp' : 'caravan.crankDown');
    return `${action} ${spokenLength(part.mm, unit)}`;
  }
  const said = [
    t(SPOKEN_WHEEL_LABEL[part.wheel]),
    part.step !== null ? t('diagram.step', { n: part.step }) : spokenLength(part.liftMm, unit),
  ];
  if (part.notEnough) said.push(t('diagram.notEnough'));
  return said.join(', ');
}

/** The voice reads the language's own decimal mark: "3,5 cm", not "3.5". */
function spokenLength(mm: number, unit: 'mm' | 'cm'): string {
  const value = formatLengthValue(mm, unit);
  return `${getLanguage() === 'en' ? value : value.replace('.', ',')} ${unit}`;
}
