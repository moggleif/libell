/**
 * Settings › Vehicle's vehicles (#599), listed like the targets (#613): tap
 * one to switch to it, tap the chosen one again to rename it, ✕ to remove
 * one while there is another, and New vehicle to add one. Choosing another
 * vehicle starts the app again on it, so nothing here redraws after a switch;
 * each reload is marked so Settings reopens on Vehicle (#615).
 */
import { createChoiceRow } from './choiceList';
import { button, createElement, paragraph } from './dom';
import { t } from './i18n';
import { createNamePrompt } from './namePrompt';
import { markReopenSettings } from './reopenSettings';

export interface VehiclePickerOptions {
  list(): Array<{ id: string; name: string }>;
  activeId(): string;
  switchTo(id: string): void;
  add(name: string): void;
  rename(id: string, name: string): void;
  /** False when it is the only vehicle. */
  remove(id: string): boolean;
}

/** A first vehicle never renamed reads "My vehicle". */
export function vehicleName(name: string): string {
  return name === '' ? t('vehicles.defaultName') : name;
}

function actionButton(text: string, onClick: () => void): HTMLButtonElement {
  return button('menu__action menu__action--secondary', text, onClick);
}

function createParts() {
  const heading = paragraph('settings__section', t('vehicles.title'));
  const list = createElement('div', 'choice__list');
  const hint = paragraph('settings__hint', t('vehicles.hint'));
  const status = createElement('p', 'menu__text menu__text--status');
  status.setAttribute('aria-live', 'polite');
  return { heading, list, hint, status };
}

export function createVehiclePicker(options: VehiclePickerOptions): HTMLElement {
  const parts = createParts();
  const { status } = parts;
  // The vehicle a ✕ asks to remove, until "Yes, remove" or another tap.
  let removing: string | null = null;
  const yes = actionButton(t('vehicles.remove.yes'), () => {
    // Removing the active vehicle starts the app again on another.
    if (removing === options.activeId()) markReopenSettings('vehicle');
    if (removing) options.remove(removing);
    removing = null;
    refresh();
  });
  const confirmRemove = (id: string, name: string): void => {
    removing = id;
    status.textContent = t('vehicles.remove.confirm', { name });
    refresh();
  };
  function refresh(): void {
    fillList(parts.list, options, confirmRemove, refresh);
    yes.hidden = removing === null;
    if (removing === null) status.textContent = '';
  }
  const adding = createAdding(options);
  const element = createElement('div', 'vehicles');
  element.append(parts.heading, parts.list, ...adding, status, yes, parts.hint);
  refresh();
  return element;
}

/** "New vehicle", which asks for the name only once tapped (#613). */
function createAdding(options: VehiclePickerOptions): HTMLElement[] {
  const addButton = actionButton(t('vehicles.add'), () => {
    addButton.hidden = true;
    prompt.open(nextVehicleName(options.list()));
  });
  const prompt = createNamePrompt({
    label: t('vehicles.name.label'),
    placeholder: t('vehicles.name.placeholder'),
    onSave: (typed) => {
      markReopenSettings('vehicle');
      options.add(typed || nextVehicleName(options.list()));
      prompt.close();
    },
    onClose: () => (addButton.hidden = false),
  });
  return [addButton, prompt.element];
}

function fillList(
  list: HTMLElement,
  options: VehiclePickerOptions,
  confirmRemove: (id: string, name: string) => void,
  refresh: () => void,
): void {
  const vehicles = options.list();
  // One vehicle is always needed, so the last one has no ✕.
  const removable = vehicles.length > 1;
  list.replaceChildren(
    ...vehicles.map(({ id, name }) => {
      const label = vehicleName(name);
      return createChoiceRow({
        label,
        active: id === options.activeId(),
        onSelect: () => {
          markReopenSettings('vehicle');
          options.switchTo(id);
        },
        onRename: (typed) => {
          options.rename(id, typed);
          refresh();
        },
        onDelete: removable ? () => confirmRemove(id, label) : undefined,
        deleteLabel: t('vehicles.delete', { name: label }),
      });
    }),
  );
}

/** "Vehicle N", counting on from the vehicles there are, never a name in use. */
export function nextVehicleName(vehicles: Array<{ name: string }>): string {
  const taken = new Set(vehicles.map((v) => vehicleName(v.name)));
  let n = vehicles.length + 1;
  while (taken.has(t('vehicles.numbered', { n }))) n++;
  return t('vehicles.numbered', { n });
}
