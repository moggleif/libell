// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCore, type Screen } from './core';
import { mountMainScreen, vibrateIfSupported } from './mainScreen';
import { mountPages } from './pages';
import { saveTargetPresets } from '../data/settingsStore';
import { saveVehicleList } from '../data/vehicleStore';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { vehicleFieldsOf } from '../domain/vehicles';
import { t } from '../ui/i18n';

/** The parts of index.html the main screen mounts into. */
function mountShell(): HTMLElement {
  document.body.replaceChildren();
  const add = (tag: string, id: string, parent: HTMLElement = document.body): HTMLElement => {
    const element = document.createElement(tag);
    element.id = id;
    parent.append(element);
    return element;
  };
  add('div', 'indicators');
  add('div', 'choices');
  add('div', 'sensor-slot', add('div', 'topbar-corner'));
  add('button', 'sound-button');
  return add('main', 'app');
}

function mount() {
  const root = mountShell();
  const screen = {} as Screen;
  const core = createCore(screen);
  const pages = mountPages(core, screen);
  const topBar = { syncCorner: vi.fn() };
  mountMainScreen(root, core, pages, screen, topBar);
  return { root, screen, core, topBar };
}

describe('mountMainScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/?demo');
  });

  it('fills in the screen the core calls back into, mounted into the shell (#526)', () => {
    const { screen, root } = mount();
    const indicators = document.querySelector('#indicators')!;
    const choices = document.querySelector<HTMLElement>('#choices')!;
    const slot = document.querySelector('#sensor-slot')!;
    // The lamps in the top bar; the vehicle, target and hitch height
    // badges (#598, #616) under it, hidden with one vehicle and no
    // targets; the sensor icon in its slot.
    expect(indicators.childElementCount).toBe(1);
    expect(choices.querySelector('.vehicle-badge')).not.toBeNull();
    expect(choices.querySelector('.target-badge')).not.toBeNull();
    expect(choices.hidden).toBe(true);
    expect(slot.childElementCount).toBe(1);
    const indicatorsBefore = indicators.innerHTML;
    screen.lamps.refresh();
    screen.choiceBadges.refresh();
    screen.sensorStatus.refresh();
    expect(indicators.innerHTML).toBe(indicatorsBefore);
    screen.levelScreen.show();
    expect(root.childElementCount).toBeGreaterThan(0);
  });

  it('names the active vehicle and target under the top bar once there is a choice (#616)', () => {
    const fields = vehicleFieldsOf(DEFAULT_SETTINGS);
    saveVehicleList({
      activeId: 'a',
      vehicles: [
        { id: 'a', name: 'Bus', fields, stored: {} },
        { id: 'b', name: 'Caravan', fields, stored: {} },
      ],
    });
    saveTargetPresets([{ id: 'p', name: 'Ferry', offset: { rollDeg: 1, pitchDeg: 0 } }]);
    mount();
    const choices = document.querySelector<HTMLElement>('#choices')!;
    expect(choices.hidden).toBe(false);
    expect(choices.querySelector('.vehicle-badge')!.textContent).toBe(
      t('vehicles.badge', { name: 'Bus' }),
    );
    expect(choices.querySelector('.target-badge')!.textContent).toBe(
      t('targets.badge', { name: t('targets.normal') }),
    );
  });

  it('shows the hitch height badge while a caravan goes back to it, and ends it on tap (#598)', () => {
    const { screen, core } = mount();
    core.settings.set({ ...core.settings.get(), vehicleType: 'caravan' });
    const { hitch } = core.optionDeps;
    expect(hitch.save()).toBeNull();
    hitch.start();
    const target = document.querySelector<HTMLButtonElement>('#choices .target-badge');
    const badge = document.querySelector<HTMLButtonElement>('#choices .hitch-badge');
    expect(target!.hidden).toBe(true);
    expect(badge!.hidden).toBe(false);
    badge!.click();
    expect(hitch.isActive()).toBe(false);
    screen.choiceBadges.refresh();
    expect(badge!.hidden).toBe(true);
  });

  it('forwards a vibration only where the browser can vibrate (#526)', () => {
    const vibrateFn = vi.fn(() => true);
    Object.defineProperty(navigator, 'vibrate', { value: vibrateFn, configurable: true });
    vibrateIfSupported([30, 50]);
    expect(vibrateFn).toHaveBeenCalledWith([30, 50]);
    delete (navigator as { vibrate?: unknown }).vibrate;
    expect('vibrate' in navigator).toBe(false);
    expect(() => vibrateIfSupported(20)).not.toThrow();
    expect(vibrateFn).toHaveBeenCalledOnce();
  });

  it('syncs the top-bar corner once the sensor status is in it', () => {
    const { topBar } = mount();
    expect(topBar.syncCorner).toHaveBeenCalledOnce();
  });

  it('mutes both sounds from the bottom bar', () => {
    const { core } = mount();
    document.querySelector<HTMLButtonElement>('#sound-button')!.click();
    expect(core.settings.get().soundOnLevel).toBe(false);
    expect(core.settings.get().soundGuidance).toBe(false);
  });

  it('builds the level screen into the root only when shown', () => {
    const { root, screen } = mount();
    expect(root.childElementCount).toBe(0);
    screen.levelScreen.show();
    expect(root.childElementCount).toBeGreaterThan(0);
  });
});
