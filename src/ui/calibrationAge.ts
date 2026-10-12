/**
 * Calibration age (R26), shared by every calibration layer's status line.
 * Empty when the timestamp is unknown: calibrations saved before timestamps
 * existed stay valid and show no age.
 */
import { t } from './i18n';

export function ageText(capturedAt: number | null): string {
  if (capturedAt === null) return '';
  const days = Math.max(0, Math.floor((Date.now() - capturedAt) / 86_400_000));
  return ' ' + (days === 0 ? t('calibration.age.today') : t('calibration.age.days', { n: days }));
}
