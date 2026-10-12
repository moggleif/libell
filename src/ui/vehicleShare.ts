/**
 * "Share vehicle setup": a link carrying only the vehicle-geometry fields
 * (`domain/vehicleShare.ts` — never calibration, never UI/behavior
 * preferences), through the same share sheet / clipboard fallback as the
 * app-link share button.
 */
import { encodeVehicleGeometry, type VehicleGeometry } from '../domain/vehicleShare';
import { appUrl, shareOrCopyLink } from './share';
import { t } from './i18n';

const SETUP_HASH_PREFIX = '#setup=';

export function vehicleSetupUrl(geometry: VehicleGeometry): string {
  const url = new URL(appUrl());
  url.hash = `setup=${encodeVehicleGeometry(geometry)}`;
  return url.href;
}

export async function shareVehicleSetup(geometry: VehicleGeometry): Promise<void> {
  await shareOrCopyLink(vehicleSetupUrl(geometry), t('share.vehicle.text'));
}

/**
 * Reads a pending setup link's payload from the current URL, if any, and
 * removes it from the address bar so a later refresh never re-prompts.
 */
export function takePendingVehicleSetupCode(): string | null {
  if (!location.hash.startsWith(SETUP_HASH_PREFIX)) return null;
  const code = location.hash.slice(SETUP_HASH_PREFIX.length);
  history.replaceState(null, '', location.pathname + location.search);
  return code;
}
