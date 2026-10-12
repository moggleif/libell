// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCore, type Screen } from './core';
import { mountPages } from './pages';

function fakeScreen(): Screen {
  const refreshable = () => ({ refresh: vi.fn() });
  return {
    lamps: refreshable(),
    targetBadge: refreshable(),
    sensorStatus: refreshable(),
    levelScreen: { show: vi.fn(), rebuildIfChanged: vi.fn() },
  } as unknown as Screen;
}

function button(id: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.id = id;
  document.body.append(element);
  return element;
}

describe('mountPages', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/?demo');
    document.body.replaceChildren();
  });

  it('hands the settings surface and the navigation to the screen', () => {
    button('settings-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    expect(screen.settingsSurface).toBe(pages.settingsSurface);
    expect(screen.navigation).toBe(pages.navigation);
  });

  it('mounts the "?" page behind the help button', () => {
    const help = button('help-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    expect(document.body.contains(pages.infoPage.element)).toBe(true);
    expect(pages.infoPage.isOpen()).toBe(false);
    help.click();
    expect(pages.infoPage.isOpen()).toBe(true);
  });

  it('mounts the "?" page even without a help button', () => {
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    expect(document.body.contains(pages.infoPage.element)).toBe(true);
  });

  it('starts with every page closed', () => {
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    expect(pages.onboarding.isOpen()).toBe(false);
    expect(pages.settingsSurface.isOpen()).toBe(false);
  });

  it('opens settings from the gear', () => {
    const gear = button('settings-button');
    const screen = fakeScreen();
    const pages = mountPages(createCore(screen), screen);
    gear.click();
    expect(pages.settingsSurface.isOpen()).toBe(true);
  });
});
