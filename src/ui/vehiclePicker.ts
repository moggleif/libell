/**
 * Settings › Vehicle's vehicle picker (#599): which vehicle the fields below
 * edit, and New vehicle, Rename and Remove. Choosing another vehicle starts
 * the app again on it, so nothing here redraws after a switch.
 */
import { button } from './calibrationControls';
import { createElement } from './dom';
import { t } from './i18n';

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
  const element = button('menu__action menu__action--secondary', text);
  element.addEventListener('click', onClick);
  return element;
}

function createParts() {
  const heading = createElement('p', 'settings__section');
  heading.textContent = t('vehicles.title');
  const select = createElement('select', 'settings__select vehicles__select');
  select.setAttribute('aria-label', t('vehicles.pick'));
  const nameInput = createElement('input', 'vehicles__name-input');
  nameInput.type = 'text';
  nameInput.maxLength = 40;
  nameInput.placeholder = t('vehicles.name.placeholder');
  nameInput.setAttribute('aria-label', t('vehicles.name.label'));
  const hint = createElement('p', 'settings__hint');
  hint.textContent = t('vehicles.hint');
  const status = createElement('p', 'menu__text menu__text--status');
  status.setAttribute('aria-live', 'polite');
  return { heading, select, nameInput, hint, status };
}

export function createVehiclePicker(options: VehiclePickerOptions): HTMLElement {
  const parts = createParts();
  const { select, nameInput, status } = parts;
  const activeName = () =>
    vehicleName(options.list().find((v) => v.id === options.activeId())?.name ?? '');
  let confirming = false;
  const yes = actionButton(t('vehicles.remove.yes'), () => {
    if (!options.remove(options.activeId())) status.textContent = t('vehicles.remove.last');
    confirming = false;
    refresh();
  });
  function refresh(): void {
    fillSelect(select, options);
    yes.hidden = !confirming;
  }
  select.addEventListener('change', () => options.switchTo(select.value));
  const actions = createElement('div', 'vehicles__actions');
  actions.append(
    actionButton(t('vehicles.add'), () => options.add(nameOrNext(nameInput, options))),
    actionButton(t('vehicles.rename'), () => {
      status.textContent = rename(nameInput, options);
      refresh();
    }),
    actionButton(t('vehicles.remove'), () => {
      confirming = options.list().length > 1;
      status.textContent = confirming
        ? t('vehicles.remove.confirm', { name: activeName() })
        : t('vehicles.remove.last');
      refresh();
    }),
  );
  const element = createElement('div', 'vehicles');
  element.append(parts.heading, select, nameInput, actions, status, yes, parts.hint);
  refresh();
  return element;
}

function fillSelect(select: HTMLSelectElement, options: VehiclePickerOptions): void {
  select.replaceChildren(
    ...options.list().map(({ id, name }) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = vehicleName(name);
      return option;
    }),
  );
  select.value = options.activeId();
}

/** Nothing is disabled: a vehicle added without a name gets the lowest
 * "Vehicle N" not already taken. */
function nameOrNext(input: HTMLInputElement, options: VehiclePickerOptions): string {
  return input.value.trim() || nextVehicleName(options.list());
}

/** "Vehicle N", counting on from the vehicles there are, never a name in use. */
export function nextVehicleName(vehicles: Array<{ name: string }>): string {
  const taken = new Set(vehicles.map((v) => vehicleName(v.name)));
  let n = vehicles.length + 1;
  while (taken.has(t('vehicles.numbered', { n }))) n++;
  return t('vehicles.numbered', { n });
}

/** The status line to show: done, or what to type first. */
function rename(input: HTMLInputElement, options: VehiclePickerOptions): string {
  const typed = input.value.trim();
  if (!typed) return t('vehicles.rename.empty');
  options.rename(options.activeId(), typed);
  input.value = '';
  return t('vehicles.renamed');
}
