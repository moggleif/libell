// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCore, type Screen } from './core';
import { mountMainScreen, vibrateIfSupported } from './mainScreen';
import { mountPages } from './pages';

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
    const slot = document.querySelector('#sensor-slot')!;
    // The lamps and the target badge, side by side; the sensor icon in its slot.
    expect(indicators.childElementCount).toBe(2);
    expect(indicators.querySelector('.target-badge')).not.toBeNull();
    expect(slot.childElementCount).toBe(1);
    const indicatorsBefore = indicators.innerHTML;
    screen.lamps.refresh();
    screen.targetBadge.refresh();
    screen.sensorStatus.refresh();
    expect(indicators.innerHTML).toBe(indicatorsBefore);
    screen.levelScreen.show();
    expect(root.childElementCount).toBeGreaterThan(0);
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
