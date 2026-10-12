/**
 * Confirmation for an incoming shared vehicle setup link (R41): applies the
 * geometry only after an explicit tap. `domain/vehicleShare.ts` decides
 * which fields; this only previews and confirms them.
 */
import type { LevelSettings } from '../domain/settings';
import { formatLength } from '../domain/lengths';
import type { VehicleGeometry } from '../domain/vehicleShare';
import { t, type MessageKey } from './i18n';

export interface IncomingVehicleSetupOptions {
  geometry: VehicleGeometry;
  displayUnit: LevelSettings['displayUnit'];
  onApply: () => void;
  onDismiss: () => void;
}

export function showIncomingVehicleSetup(options: IncomingVehicleSetupOptions): void {
  const overlay = document.createElement('div');
  overlay.className = 'incoming-setup';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'incoming-setup-heading');

  const heading = document.createElement('h2');
  heading.id = 'incoming-setup-heading';
  heading.className = 'incoming-setup__heading';
  heading.textContent = t('setup.incoming.h');
  const intro = paragraph('incoming-setup__intro', t('setup.incoming.intro'));
  const reminder = paragraph('incoming-setup__reminder', t('setup.incoming.reminder'));
  const close = (): void => overlay.remove();
  const actions = createActions(
    () => {
      close();
      options.onDismiss();
    },
    () => {
      close();
      options.onApply();
    },
  );

  const card = document.createElement('div');
  card.className = 'incoming-setup__card';
  card.append(heading, intro, geometryList(options), reminder, actions);
  overlay.append(card);
  document.body.append(overlay);
}

/** What the link would set, in this phone's unit; a caravan's list leaves
 * out what it does not have. */
function geometryList({ geometry, displayUnit }: IncomingVehicleSetupOptions): HTMLElement {
  const unit = (mm: number) => formatLength(mm, displayUnit);
  const isCaravan = geometry.vehicleType === 'caravan';
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
  return list;
}

function paragraph(className: string, text: string): HTMLParagraphElement {
  const element = document.createElement('p');
  element.className = className;
  element.textContent = text;
  return element;
}

function createActions(onDismiss: () => void, onApply: () => void): HTMLElement {
  const actions = document.createElement('div');
  actions.className = 'incoming-setup__actions';
  const dismissButton = document.createElement('button');
  dismissButton.type = 'button';
  dismissButton.className = 'menu__action menu__action--secondary';
  dismissButton.textContent = t('setup.incoming.dismiss');
  dismissButton.addEventListener('click', onDismiss);
  const applyButton = document.createElement('button');
  applyButton.type = 'button';
  applyButton.className = 'menu__action';
  applyButton.textContent = t('setup.incoming.apply');
  applyButton.addEventListener('click', onApply);
  actions.append(dismissButton, applyButton);
  return actions;
}
