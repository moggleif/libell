/**
 * Confirmation prompt for an incoming "share vehicle setup" link (R41,
 * #207): shown once per received link, and only ever applies the geometry
 * it was given after an explicit tap — never automatically, and never
 * touching calibration, EasyLevel pairing, or any UI/behavior preference
 * (`domain/vehicleShare.ts` decides exactly which fields those are; this
 * component only previews and confirms them).
 */
import { formatLength, type LevelSettings } from '../domain/settings';
import type { VehicleGeometry } from '../domain/vehicleShare';
import { t, type MessageKey } from './i18n';

export interface IncomingVehicleSetupOptions {
  geometry: VehicleGeometry;
  displayUnit: LevelSettings['displayUnit'];
  onApply: () => void;
  onDismiss: () => void;
}

/** Builds and appends the one-shot overlay to `document.body`, removing
 * itself the moment either button is pressed. */
export function showIncomingVehicleSetup(options: IncomingVehicleSetupOptions): void {
  const { geometry, displayUnit, onApply, onDismiss } = options;
  const unit = (mm: number) => formatLength(mm, displayUnit);
  const isCaravan = geometry.vehicleType === 'caravan';

  const overlay = document.createElement('div');
  overlay.className = 'incoming-setup';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'incoming-setup-heading');

  const card = document.createElement('div');
  card.className = 'incoming-setup__card';

  const heading = document.createElement('h2');
  heading.id = 'incoming-setup-heading';
  heading.className = 'incoming-setup__heading';
  heading.textContent = t('setup.incoming.h');

  const intro = document.createElement('p');
  intro.className = 'incoming-setup__intro';
  intro.textContent = t('setup.incoming.intro');

  const list = document.createElement('dl');
  list.className = 'incoming-setup__list';
  const row = (labelKey: MessageKey, value: string): void => {
    const dt = document.createElement('dt');
    dt.textContent = t(labelKey);
    const dd = document.createElement('dd');
    dd.textContent = value;
    list.append(dt, dd);
  };
  row('settings.vehicle', t(`vehicle.${geometry.vehicleType}` as MessageKey));
  row(
    isCaravan ? 'settings.axle' : 'settings.rearAxle',
    t(`axle.${geometry.rearAxle}` as MessageKey),
  );
  row(isCaravan ? 'settings.axleToJockey' : 'settings.wheelbase', unit(geometry.wheelbaseMm));
  if (!isCaravan) row('settings.trackFront', unit(geometry.trackWidthFrontMm));
  row('settings.trackRear', unit(geometry.trackWidthRearMm));
  row(
    'settings.steps',
    geometry.rampStepHeightsMm.length > 0 ? geometry.rampStepHeightsMm.map(unit).join(', ') : '—',
  );
  if (!isCaravan) row('settings.rampCount', String(geometry.rampCount));
  row('settings.drain', t(`drain.${geometry.drainPosition}` as MessageKey));

  const reminder = document.createElement('p');
  reminder.className = 'incoming-setup__reminder';
  reminder.textContent = t('setup.incoming.reminder');

  const actions = document.createElement('div');
  actions.className = 'incoming-setup__actions';
  const dismissButton = document.createElement('button');
  dismissButton.type = 'button';
  dismissButton.className = 'menu__action menu__action--secondary';
  dismissButton.textContent = t('setup.incoming.dismiss');
  const applyButton = document.createElement('button');
  applyButton.type = 'button';
  applyButton.className = 'menu__action';
  applyButton.textContent = t('setup.incoming.apply');
  actions.append(dismissButton, applyButton);

  card.append(heading, intro, list, reminder, actions);
  overlay.append(card);
  document.body.append(overlay);

  const close = (): void => overlay.remove();
  dismissButton.addEventListener('click', () => {
    close();
    onDismiss();
  });
  applyButton.addEventListener('click', () => {
    close();
    onApply();
  });
}
