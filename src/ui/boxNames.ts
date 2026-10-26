/**
 * The supported Sensorbox models, named as a language lists things (#709):
 * "EasyLevel and Xparkle RVS01", or "… or …" where any one of them is meant.
 * Brands never live in a catalogue (#267), so every text that names the
 * boxes fills them in from here.
 */
import { EXTERNAL_SENSORS } from '../sensor/boxes';
import type { Language } from './i18n';

export function boxNames(
  lang: Language,
  type: 'conjunction' | 'disjunction' = 'conjunction',
): string {
  const names = EXTERNAL_SENSORS.map((box) => box.displayName);
  return new Intl.ListFormat(lang, { type }).format(names);
}
