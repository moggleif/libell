/**
 * Confirmation for an incoming shared vehicle setup link (R41): applies the
 * geometry only after an explicit tap. `domain/vehicleShare.ts` decides
 * which fields; this only previews and confirms them.
 */
import type { LevelSettings } from '../domain/settings';
import { formatLength } from '../domain/lengths';
import type { VehicleGeometry } from '../domain/vehicleShare';
import { t, type MessageKey } from './i18n';
import { createDialog } from './dialog';
import { button, createElement } from './dom';

export interface IncomingVehicleSetupOptions {
  geometry: VehicleGeometry;
  displayUnit: LevelSettings['displayUnit'];
  /** Replaces the current vehicle's measurements. */
  onApply: () => void;
  /** Adds the setup as a new vehicle (#599): the default choice. */
  onAddAsNew: () => void;
  onDismiss: () => void;
}

export function showIncomingVehicleSetup(options: IncomingVehicleSetupOptions): void {
  const dialog = createDialog({
    className: 'incoming-setup',
    cardClassName: 'incoming-setup__card',
    headingId: 'incoming-setup-heading',
    heading: { className: 'incoming-setup__heading', text: t('setup.incoming.h') },
  });
  const intro = paragraph('incoming-setup__intro', t('setup.incoming.intro'));
  const reminder = paragraph('incoming-setup__reminder', t('setup.incoming.reminder'));
  const actions = createActions({
    dismiss: dialog.closeThen(options.onDismiss),
    replace: dialog.closeThen(options.onApply),
    addNew: dialog.closeThen(options.onAddAsNew),
  });
  dialog.card.append(dialog.heading, intro, geometryList(options), reminder, actions);
  dialog.open();
}

/** What the link would set, in this phone's unit; a caravan's list leaves
 * out what it does not have. */
function geometryList({ geometry, displayUnit }: IncomingVehicleSetupOptions): HTMLElement {
  const unit = (mm: number) => formatLength(mm, displayUnit);
  const isCaravan = geometry.vehicleType === 'caravan';
  const list = createElement('dl', 'incoming-setup__list');
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
  if (geometry.rampStepless) {
    row('settings.stepless.max', unit(Math.max(...geometry.rampStepHeightsMm)));
  } else {
    row(
      'settings.steps',
      geometry.rampStepHeightsMm.length > 0 ? geometry.rampStepHeightsMm.map(unit).join(', ') : '—',
    );
  }
  if (!isCaravan) row('settings.rampCount', String(geometry.rampCount));
  row('settings.drain', t(`drain.${geometry.drainPosition}` as MessageKey));
  return list;
}

function paragraph(className: string, text: string): HTMLParagraphElement {
  const element = createElement('p', className);
  element.textContent = text;
  return element;
}

/** Adding it as a new vehicle is the primary choice: nothing is lost. */
function createActions(on: { dismiss(): void; replace(): void; addNew(): void }): HTMLElement {
  const actions = createElement('div', 'incoming-setup__actions');
  const secondary = 'menu__action menu__action--secondary';
  actions.append(
    button(secondary, t('setup.incoming.dismiss'), on.dismiss),
    button(secondary, t('setup.incoming.apply'), on.replace),
    button('menu__action', t('setup.incoming.addNew'), on.addNew),
  );
  return actions;
}
