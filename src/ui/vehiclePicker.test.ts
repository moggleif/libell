// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGES, setLanguage, t } from './i18n';
import { takeReopenSettings } from './reopenSettings';
import {
  createVehiclePicker,
  nextVehicleName,
  vehicleName,
  type VehiclePickerOptions,
} from './vehiclePicker';

afterEach(() => setLanguage('en'));

function fakeVehicles(names: string[] = ['']) {
  let vehicles = names.map((name, i) => ({ id: `v${i}`, name }));
  let active = 'v0';
  const options: VehiclePickerOptions = {
    list: () => vehicles,
    activeId: () => active,
    switchTo: vi.fn((id: string) => void (active = id)),
    add: vi.fn(),
    rename: vi.fn((id: string, name: string) => {
      vehicles = vehicles.map((v) => (v.id === id ? { ...v, name } : v));
    }),
    remove: vi.fn((id: string) => {
      if (vehicles.length < 2) return false;
      vehicles = vehicles.filter((v) => v.id !== id);
      return true;
    }),
  };
  return options;
}

function parts(element: HTMLElement) {
  const button = (key: Parameters<typeof t>[0]) =>
    [...element.querySelectorAll('button')].find((b) => b.textContent === t(key))!;
  return {
    rows: () =>
      [...element.querySelectorAll<HTMLButtonElement>('.choice__row-select')].map((b) => ({
        select: b,
        label: b.textContent?.slice(1),
        active: b.getAttribute('aria-pressed') === 'true',
      })),
    deletes: () => [...element.querySelectorAll<HTMLButtonElement>('.choice__row-delete')],
    input: () => element.querySelector<HTMLInputElement>('.name-prompt__input')!,
    prompt: element.querySelector<HTMLElement>('.name-prompt')!,
    status: () => element.querySelector('.menu__text--status')!.textContent,
    button,
  };
}

describe('vehicle picker (#599, #613)', () => {
  it('lists the one vehicle an existing install has as "My vehicle", chosen', () => {
    const { rows } = parts(createVehiclePicker(fakeVehicles()));
    expect(rows().map((r) => [r.label, r.active])).toEqual([[t('vehicles.defaultName'), true]]);
  });

  it('switches to the vehicle tapped', () => {
    const options = fakeVehicles(['', 'Caravan']);
    const { rows } = parts(createVehiclePicker(options));
    rows()[1]!.select.click();
    expect(options.switchTo).toHaveBeenCalledWith('v1');
  });

  it('renames the chosen vehicle when it is tapped again; an emptied name is kept', () => {
    const options = fakeVehicles(['Bus', 'Caravan']);
    const element = createVehiclePicker(options);
    document.body.append(element);
    const { rows } = parts(element);
    rows()[0]!.select.click();
    expect(options.switchTo).not.toHaveBeenCalled();
    const edit = element.querySelector<HTMLInputElement>('.choice__row-input')!;
    expect(edit.value).toBe('Bus');
    edit.value = '  ';
    edit.dispatchEvent(new Event('blur'));
    expect(options.rename).not.toHaveBeenCalled();
    expect(rows()[0]!.label).toBe('Bus');
    rows()[0]!.select.click();
    const again = element.querySelector<HTMLInputElement>('.choice__row-input')!;
    again.value = 'Motorhome';
    again.dispatchEvent(new Event('blur'));
    expect(options.rename).toHaveBeenCalledWith('v0', 'Motorhome');
    expect(rows()[0]!.label).toBe('Motorhome');
    element.remove();
  });

  it('shows no name field until New vehicle is tapped', () => {
    const { prompt, button } = parts(createVehiclePicker(fakeVehicles()));
    expect(prompt.hidden).toBe(true);
    button('vehicles.add').click();
    expect(prompt.hidden).toBe(false);
    expect(button('vehicles.add').hidden).toBe(true);
    button('namePrompt.cancel').click();
    expect(prompt.hidden).toBe(true);
    expect(button('vehicles.add').hidden).toBe(false);
  });

  it('asks for the new name filled with the next free "Vehicle N", and adds it', () => {
    const options = fakeVehicles(['', 'Vehicle 2']);
    const { input, button } = parts(createVehiclePicker(options));
    button('vehicles.add').click();
    expect(input().value).toBe(t('vehicles.numbered', { n: 3 }));
    button('namePrompt.save').click();
    expect(options.add).toHaveBeenCalledWith(t('vehicles.numbered', { n: 3 }));
    button('vehicles.add').click();
    input().value = '  Caravan ';
    button('namePrompt.save').click();
    expect(options.add).toHaveBeenLastCalledWith('Caravan');
    button('vehicles.add').click();
    input().value = '';
    button('namePrompt.save').click();
    expect(options.add).toHaveBeenLastCalledWith(t('vehicles.numbered', { n: 3 }));
  });

  it('skips a "Vehicle N" already in use', () => {
    expect(nextVehicleName([{ name: '' }, { name: 'Vehicle 3' }])).toBe('Vehicle 4');
  });

  it('has no ✕ while there is only one vehicle', () => {
    expect(parts(createVehiclePicker(fakeVehicles())).deletes()).toHaveLength(0);
    expect(parts(createVehiclePicker(fakeVehicles(['Bus', 'Car']))).deletes()).toHaveLength(2);
  });

  it('asks before removing any vehicle, then removes that one', () => {
    const options = fakeVehicles(['Bus', 'Caravan']);
    const { button, status, deletes } = parts(createVehiclePicker(options));
    expect(button('vehicles.remove.yes').hidden).toBe(true);
    deletes()[1]!.click();
    expect(status()).toBe(t('vehicles.remove.confirm', { name: 'Caravan' }));
    expect(options.remove).not.toHaveBeenCalled();
    button('vehicles.remove.yes').click();
    expect(options.remove).toHaveBeenCalledWith('v1');
    expect(button('vehicles.remove.yes').hidden).toBe(true);
    expect(deletes()).toHaveLength(0);
  });

  it('names each ✕ for its vehicle', () => {
    const { deletes } = parts(createVehiclePicker(fakeVehicles(['', 'Caravan'])));
    expect(deletes().map((d) => d.getAttribute('aria-label'))).toEqual([
      t('vehicles.delete', { name: t('vehicles.defaultName') }),
      t('vehicles.delete', { name: 'Caravan' }),
    ]);
  });

  // #615: each of these starts the app again, which must not close Settings.
  it('marks Settings to reopen on Vehicle before a switch, an add or removing the active one', () => {
    sessionStorage.clear();
    const options = fakeVehicles(['Bus', 'Caravan', 'Van']);
    const { rows, button, input, deletes } = parts(createVehiclePicker(options));
    rows()[1]!.select.click();
    expect(takeReopenSettings()).toBe('vehicle');
    button('vehicles.add').click();
    input().value = 'Camper';
    button('namePrompt.save').click();
    expect(takeReopenSettings()).toBe('vehicle');
    // Bus is no longer the active one: removing it reloads nothing.
    deletes()[0]!.click();
    button('vehicles.remove.yes').click();
    expect(takeReopenSettings()).toBeNull();
    deletes()[0]!.click();
    button('vehicles.remove.yes').click();
    expect(options.remove).toHaveBeenLastCalledWith('v1');
    expect(takeReopenSettings()).toBe('vehicle');
  });

  it('names vehicles in every language', () => {
    for (const language of LANGUAGES) {
      setLanguage(language);
      expect(vehicleName('')).toBe(t('vehicles.defaultName'));
      expect(vehicleName('Bus')).toBe('Bus');
      expect(nextVehicleName([{ name: '' }])).toBe(t('vehicles.numbered', { n: 2 }));
      const element = createVehiclePicker(fakeVehicles());
      for (const text of [...element.querySelectorAll('p, button')].map((e) => e.textContent)) {
        expect(text).not.toMatch(/^vehicles\./);
      }
    }
  });
});
