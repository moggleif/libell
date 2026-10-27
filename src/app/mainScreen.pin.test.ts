// @vitest-environment happy-dom
//
// Pins (#735) of the main screen — the lamps, the vehicle, target and hitch
// height badges, the level screen with its overlays, the start button and
// the toasts — written before their hand-built buttons and text elements
// are built with button(), textElement() and paragraph() from dom.ts, so
// the move cannot change any of it: every element, attribute, text and
// child order is compared with the stored snapshot.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveSettings, saveTargetPresets } from '../data/settingsStore';
import { saveVehicleList } from '../data/vehicleStore';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { vehicleFieldsOf } from '../domain/vehicles';
import { describeDom } from '../ui/domPin.testing';
import { setLanguage } from '../ui/i18n';
import { showActionToast, showToast } from '../ui/toast';
import { createCore, type Screen } from './core';
import { mountMainScreen } from './mainScreen';
import { mountPages } from './pages';
import { startSensors } from './sensorStartup';

setLanguage('en');

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/?demo');
  document.body.replaceChildren();
});

afterEach(() => {
  document.body.replaceChildren();
});

/** The parts of index.html the main screen mounts into. */
function mountShell(): HTMLElement {
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

/** A caravan with two vehicles and a saved target, so every badge is drawn. */
function mount() {
  const fields = vehicleFieldsOf({ ...DEFAULT_SETTINGS, vehicleType: 'caravan' });
  saveSettings({ ...DEFAULT_SETTINGS, vehicleType: 'caravan' });
  saveVehicleList({
    activeId: 'a',
    vehicles: [
      { id: 'a', name: 'Caravan', fields, stored: {} },
      { id: 'b', name: 'Bus', fields, stored: {} },
    ],
  });
  saveTargetPresets([{ id: 'p', name: 'Ferry', offset: { rollDeg: 1, pitchDeg: 0 } }]);
  const root = mountShell();
  const screen = {} as Screen;
  const core = createCore(screen);
  const install = { kind: () => null, install: () => null, onChange: () => {} };
  const pages = mountPages(core, screen, install);
  mountMainScreen(root, core, pages, screen, { syncCorner: () => {} });
  return { root, screen, core };
}

const shown = (...selectors: string[]) =>
  selectors.map((selector) => describeDom(document.querySelector(selector)!)).join('\n\n');

describe('the main screen (#735)', () => {
  it('draws the same top bar, badges and level screen', () => {
    const { screen } = mount();
    screen.levelScreen.show();
    expect(shown('#indicators', '#choices', '#topbar-corner', '#app')).toMatchSnapshot();
  });

  it('draws the same badges while going back to the hitch height', () => {
    const { screen, core } = mount();
    core.optionDeps.hitch.save();
    core.optionDeps.hitch.start();
    screen.choiceBadges.refresh();
    expect(shown('#choices')).toMatchSnapshot();
  });
});

describe('the start button where motion needs a tap (#735)', () => {
  it('draws the same DOM', async () => {
    const root = mountShell();
    await startSensors({
      root,
      sensor: vi.fn(),
      attemptAutoReconnect: () => Promise.resolve(false),
      showLevelScreen: () => {},
      isSensorSupported: () => true,
      needsPermissionGesture: () => true,
      isSecureContext: () => true,
    });
    expect(describeDom(root)).toMatchSnapshot();
  });
});

describe('the toasts (#735)', () => {
  it('draw the same DOM, with and without an action', () => {
    const plain = describeDom(showToast('Saved'));
    const withAction = describeDom(showActionToast('Deleted', 'Undo', () => {}));
    expect(`${plain}\n\n${withAction}`).toMatchSnapshot();
  });
});
