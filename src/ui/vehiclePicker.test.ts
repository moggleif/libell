// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGES, setLanguage, t } from './i18n';
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
    select: element.querySelector('select')!,
    input: element.querySelector('input')!,
    prompt: element.querySelector<HTMLElement>('.name-prompt')!,
    status: () => element.querySelector('.menu__text--status')!.textContent,
    button,
  };
}

describe('vehicle picker (#599)', () => {
  it('shows the one vehicle an existing install has as "My vehicle"', () => {
    const element = createVehiclePicker(fakeVehicles());
    const { select } = parts(element);
    expect([...select.options].map((o) => o.textContent)).toEqual([t('vehicles.defaultName')]);
    expect(select.value).toBe('v0');
  });

  it('switches to the vehicle chosen', () => {
    const options = fakeVehicles(['', 'Caravan']);
    const { select } = parts(createVehiclePicker(options));
    select.value = 'v1';
    select.dispatchEvent(new Event('change'));
    expect(options.switchTo).toHaveBeenCalledWith('v1');
  });

  // #613: no name field until a name is needed.
  it('shows no name field until New vehicle or Rename is tapped', () => {
    const { prompt, button } = parts(createVehiclePicker(fakeVehicles()));
    expect(prompt.hidden).toBe(true);
    button('vehicles.add').click();
    expect(prompt.hidden).toBe(false);
    button('namePrompt.cancel').click();
    expect(prompt.hidden).toBe(true);
  });

  it('asks for the new name filled with the next free "Vehicle N", and adds it', () => {
    const options = fakeVehicles(['', 'Vehicle 2']);
    const { input, button } = parts(createVehiclePicker(options));
    button('vehicles.add').click();
    expect(input.value).toBe(t('vehicles.numbered', { n: 3 }));
    button('namePrompt.save').click();
    expect(options.add).toHaveBeenCalledWith(t('vehicles.numbered', { n: 3 }));
    button('vehicles.add').click();
    input.value = '  Caravan ';
    button('namePrompt.save').click();
    expect(options.add).toHaveBeenLastCalledWith('Caravan');
    button('vehicles.add').click();
    input.value = '';
    button('namePrompt.save').click();
    expect(options.add).toHaveBeenLastCalledWith(t('vehicles.numbered', { n: 3 }));
  });

  it('skips a "Vehicle N" already in use', () => {
    expect(nextVehicleName([{ name: '' }, { name: 'Vehicle 3' }])).toBe('Vehicle 4');
  });

  it('renames the active vehicle, and guides when the name is emptied', () => {
    const options = fakeVehicles(['Bus']);
    const element = createVehiclePicker(options);
    const { input, button, status, select, prompt } = parts(element);
    button('vehicles.rename').click();
    expect(input.value).toBe('Bus');
    input.value = ' ';
    button('namePrompt.save').click();
    expect(status()).toBe(t('vehicles.rename.empty'));
    expect(options.rename).not.toHaveBeenCalled();
    expect(prompt.hidden).toBe(false);
    input.value = 'Motorhome';
    button('namePrompt.save').click();
    expect(options.rename).toHaveBeenCalledWith('v0', 'Motorhome');
    expect(status()).toBe(t('vehicles.renamed'));
    expect(select.options[0]!.textContent).toBe('Motorhome');
    expect(prompt.hidden).toBe(true);
  });

  it('explains instead of removing the only vehicle', () => {
    const options = fakeVehicles();
    const { button, status } = parts(createVehiclePicker(options));
    button('vehicles.remove').click();
    expect(status()).toBe(t('vehicles.remove.last'));
    expect(button('vehicles.remove.yes').hidden).toBe(true);
    expect(options.remove).not.toHaveBeenCalled();
  });

  it('asks before removing, then removes the active vehicle', () => {
    const options = fakeVehicles(['Bus', 'Caravan']);
    const { button, status } = parts(createVehiclePicker(options));
    button('vehicles.remove').click();
    expect(status()).toBe(t('vehicles.remove.confirm', { name: 'Bus' }));
    expect(options.remove).not.toHaveBeenCalled();
    button('vehicles.remove.yes').click();
    expect(options.remove).toHaveBeenCalledWith('v0');
    expect(button('vehicles.remove.yes').hidden).toBe(true);
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
