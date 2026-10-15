/**
 * Settings › Vehicle's vehicle picker (#599): which vehicle the fields below
 * edit, and New vehicle, Rename and Remove. Choosing another vehicle starts
 * the app again on it, so nothing here redraws after a switch.
 */
import { button } from './calibrationControls';
import { createElement } from './dom';
import { t } from './i18n';
import { createNamePrompt } from './namePrompt';

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
  const hint = createElement('p', 'settings__hint');
  hint.textContent = t('vehicles.hint');
  const status = createElement('p', 'menu__text menu__text--status');
  status.setAttribute('aria-live', 'polite');
  return { heading, select, hint, status };
}

export function createVehiclePicker(options: VehiclePickerOptions): HTMLElement {
  const parts = createParts();
  const { select, status } = parts;
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
  const naming = createNaming(options, status, refresh);
  const ask = (mode: 'add' | 'rename', name: string): void => {
    confirming = false;
    naming.open(mode, name);
    refresh();
  };
  select.addEventListener('change', () => options.switchTo(select.value));
  const actions = createElement('div', 'vehicles__actions');
  actions.append(
    actionButton(t('vehicles.add'), () => ask('add', nextVehicleName(options.list()))),
    actionButton(t('vehicles.rename'), () => ask('rename', activeName())),
    actionButton(t('vehicles.remove'), () => {
      naming.prompt.close();
      confirming = options.list().length > 1;
      status.textContent = confirming
        ? t('vehicles.remove.confirm', { name: activeName() })
        : t('vehicles.remove.last');
      refresh();
    }),
  );
  const element = createElement('div', 'vehicles');
  element.append(parts.heading, select, actions, naming.prompt.element, status, yes, parts.hint);
  refresh();
  return element;
}

/** The name is asked for only once New vehicle or Rename is tapped (#613). */
function createNaming(options: VehiclePickerOptions, status: HTMLElement, refresh: () => void) {
  let mode: 'add' | 'rename' = 'add';
  const prompt = createNamePrompt({
    label: t('vehicles.name.label'),
    placeholder: t('vehicles.name.placeholder'),
    onSave: (typed) => {
      if (mode === 'add') options.add(typed || nextVehicleName(options.list()));
      else status.textContent = rename(typed, options);
      if (mode === 'add' || typed) prompt.close();
      refresh();
    },
  });
  const open = (next: 'add' | 'rename', name: string): void => {
    mode = next;
    status.textContent = '';
    prompt.open(name);
  };
  return { prompt, open };
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

/** "Vehicle N", counting on from the vehicles there are, never a name in use. */
export function nextVehicleName(vehicles: Array<{ name: string }>): string {
  const taken = new Set(vehicles.map((v) => vehicleName(v.name)));
  let n = vehicles.length + 1;
  while (taken.has(t('vehicles.numbered', { n }))) n++;
  return t('vehicles.numbered', { n });
}

/** The status line to show: done, or what to type first. */
function rename(typed: string, options: VehiclePickerOptions): string {
  if (!typed) return t('vehicles.rename.empty');
  options.rename(options.activeId(), typed);
  return t('vehicles.renamed');
}
