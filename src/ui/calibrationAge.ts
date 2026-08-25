/**
 * "(14 days ago)" from a calibration's capture timestamp (#87, R26) — empty
 * when the timestamp is unknown (calibrations saved before timestamps
 * existed stay valid and simply show no age). Shared by every calibration
 * layer's status line: the phone sensor calibration and vehicle zero in
 * `calibrationSection.ts`, and the EasyLevel installation offset in
 * `sensorSourceSection.ts` (#131) — one wording, never redecided per layer.
 */
import { t } from './i18n';

export function ageText(capturedAt: number | null): string {
  if (capturedAt === null) return '';
  const days = Math.max(0, Math.floor((Date.now() - capturedAt) / 86_400_000));
  return ' ' + (days === 0 ? t('calibration.age.today') : t('calibration.age.days', { n: days }));
}
