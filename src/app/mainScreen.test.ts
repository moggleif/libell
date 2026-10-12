// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCore, type Screen } from './core';
import { mountMainScreen } from './mainScreen';
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

  it('fills in the screen the core calls back into', () => {
    const { screen } = mount();
    expect(screen.lamps).toBeDefined();
    expect(screen.targetBadge).toBeDefined();
    expect(screen.sensorStatus).toBeDefined();
    expect(screen.levelScreen).toBeDefined();
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
