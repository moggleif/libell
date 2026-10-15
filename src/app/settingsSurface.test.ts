// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import type { MenuOptions } from '../ui/menu';

const fakes = vi.hoisted(() => {
  const page = {
    element: null as unknown as HTMLElement,
    attach: vi.fn(),
    isOpen: vi.fn(() => true),
    openTab: vi.fn(),
    refreshOpenTab: vi.fn(),
  };
  const menu = {
    element: null as unknown as HTMLElement,
    attach: vi.fn(),
    isOpen: vi.fn(() => false),
    open: vi.fn(),
    refresh: vi.fn(),
  };
  return { page, menu, reopen: { value: null as string | null } };
});
vi.mock('../ui/settingsPage', () => ({ createSettingsPage: () => fakes.page }));
vi.mock('../ui/menu', () => ({ createMenu: () => fakes.menu }));
vi.mock('../ui/reopenSettings', () => ({ takeReopenSettings: () => fakes.reopen.value }));

const { mountSettingsSurface } = await import('./settingsSurface');

function options(appearance: 'modern' | 'classic') {
  return { initialSettings: { ...DEFAULT_SETTINGS, appearance } } as unknown as MenuOptions;
}

describe('mountSettingsSurface', () => {
  let button: HTMLButtonElement;
  beforeEach(() => {
    vi.clearAllMocks();
    fakes.reopen.value = null;
    fakes.page.element = document.createElement('section');
    fakes.menu.element = document.createElement('nav');
    document.body.replaceChildren();
    button = document.createElement('button');
    button.id = 'settings-button';
    document.body.append(button);
  });

  it("mounts Modern's Settings page behind the gear", () => {
    const surface = mountSettingsSurface(options('modern'));
    expect(document.body.contains(fakes.page.element)).toBe(true);
    expect(fakes.page.attach).toHaveBeenCalledWith(button);
    expect(surface.isOpen()).toBe(true);
    expect(surface.route).toEqual({ settingsPage: fakes.page });
  });

  it("mounts Classic's ☰ menu behind the gear", () => {
    const surface = mountSettingsSurface(options('classic'));
    expect(document.body.contains(fakes.menu.element)).toBe(true);
    expect(fakes.menu.attach).toHaveBeenCalledWith(button);
    expect(surface.isOpen()).toBe(false);
    expect(surface.route).toEqual({ menu: fakes.menu });
  });

  it('reopens the marked section after a reload from Settings', () => {
    fakes.reopen.value = 'general';
    mountSettingsSurface(options('modern'));
    mountSettingsSurface(options('classic'));
    expect(fakes.page.openTab).toHaveBeenCalledWith('general');
    expect(fakes.menu.open).toHaveBeenCalledWith('general');
    fakes.reopen.value = 'vehicle';
    mountSettingsSurface(options('modern'));
    mountSettingsSurface(options('classic'));
    expect(fakes.page.openTab).toHaveBeenLastCalledWith('vehicle');
    expect(fakes.menu.open).toHaveBeenLastCalledWith('vehicle');
  });

  it('opens nothing on an ordinary start', () => {
    mountSettingsSurface(options('modern'));
    expect(fakes.page.openTab).not.toHaveBeenCalled();
  });

  it('redraws only when the source really changes', () => {
    const modern = mountSettingsSurface(options('modern'));
    modern.followSource('phone');
    modern.followSource('xparkle');
    modern.followSource('xparkle');
    modern.followSource('phone');
    expect(fakes.page.refreshOpenTab).toHaveBeenCalledTimes(2);
    const classic = mountSettingsSurface(options('classic'));
    classic.followSource('easylevel');
    expect(fakes.menu.refresh).toHaveBeenCalledTimes(1);
  });
});
