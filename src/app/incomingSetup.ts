/**
 * An incoming "share vehicle setup" link (R41), shown instead of the
 * first-run wizard on this launch. Malformed, truncated or future-version
 * links fail closed: a toast, and nothing applied (`decodeVehicleGeometry`).
 * The setup is added as a new vehicle by default, or replaces the current
 * one's measurements (#599); its box and calibration never come with it.
 */
import {
  applyVehicleGeometry,
  decodeVehicleGeometry,
  type VehicleGeometry,
} from '../domain/vehicleShare';
import { t } from '../ui/i18n';
import type { IncomingVehicleSetupOptions } from '../ui/incomingVehicleSetup';
import type { SettingsAccess } from './boxWiring';

export interface IncomingSetupDeps {
  settings: SettingsAccess;
  markMeasurementsSaved(): void;
  /** Redraw what follows the measurements once they are applied. */
  onApplied(): void;
  /** Adds the setup as a new vehicle (#599) and makes it active. */
  addVehicle(geometry: VehicleGeometry): void;
  show(options: IncomingVehicleSetupOptions): void;
  toast(text: string): void;
}

/** Offers the setup in `code`, if any; true when it is on screen. */
export function offerIncomingSetup(code: string | null, deps: IncomingSetupDeps): boolean {
  if (code === null) return false;
  const geometry = decodeVehicleGeometry(code);
  if (geometry === null) {
    deps.toast(t('setup.incoming.invalid'));
    return false;
  }
  deps.show({
    geometry,
    displayUnit: deps.settings.get().displayUnit,
    onApply() {
      deps.settings.set(applyVehicleGeometry(deps.settings.get(), geometry));
      deps.markMeasurementsSaved();
      deps.onApplied();
    },
    onAddAsNew() {
      deps.markMeasurementsSaved();
      deps.addVehicle(geometry);
    },
    // Nothing to do: the link is already consumed off the URL.
    onDismiss: () => {},
  });
  return true;
}
