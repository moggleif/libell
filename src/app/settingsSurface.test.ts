// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import type { MenuOptions } from '../ui/menu';

const fakes = vi.hoisted(() => {
  const page = {
    element: null as unknown as HTMLElement,
    attach: vi.fn(),
    isOpen: vi.fn(() => true),
    open: vi.fn(),
    openTab: vi.fn(),
    openTargets: vi.fn(),
    refreshOpenTab: vi.fn(),
  };
  const menu = {
    element: null as unknown as HTMLElement,
    attach: vi.fn(),
    isOpen: vi.fn(() => false),
    open: vi.fn(),
    openDrawer: vi.fn(),
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

  it("mounts Modern's Settings page behind the gear once loaded", async () => {
    const surface = mountSettingsSurface(options('modern'));
    expect(surface.isOpen()).toBe(false);
    await surface.load();
    expect(document.body.contains(fakes.page.element)).toBe(true);
    expect(fakes.page.attach).toHaveBeenCalledWith(button);
    expect(surface.isOpen()).toBe(true);
  });

  it("mounts Classic's ☰ menu behind the gear once loaded", async () => {
    const surface = mountSettingsSurface(options('classic'));
    await surface.load();
    expect(document.body.contains(fakes.menu.element)).toBe(true);
    expect(fakes.menu.attach).toHaveBeenCalledWith(button);
    expect(surface.isOpen()).toBe(false);
  });

  it('opens Settings on a tap of the gear before it has loaded (#708)', async () => {
    mountSettingsSurface(options('modern'));
    button.click();
    await vi.waitFor(() => expect(fakes.page.open).toHaveBeenCalledTimes(1));
    document.body.replaceChildren(button);
    mountSettingsSurface(options('classic'));
    button.click();
    await vi.waitFor(() => expect(fakes.menu.openDrawer).toHaveBeenCalledTimes(1));
  });

  it('routes sections to the page or the menu, loading it first', async () => {
    const modern = mountSettingsSurface(options('modern'));
    const page = modern.route as {
      settingsPage: { openTab(s: string): void; openTargets(): void };
    };
    page.settingsPage.openTab('ramps');
    page.settingsPage.openTargets();
    await vi.waitFor(() => expect(fakes.page.openTab).toHaveBeenCalledWith('ramps'));
    expect(fakes.page.openTargets).toHaveBeenCalledTimes(1);
    const classic = mountSettingsSurface(options('classic'));
    (classic.route as { menu: { open(s: string): void } }).menu.open('targets');
    await vi.waitFor(() => expect(fakes.menu.open).toHaveBeenCalledWith('targets'));
  });

  it('reopens the marked section after a reload from Settings', async () => {
    fakes.reopen.value = 'general';
    mountSettingsSurface(options('modern'));
    mountSettingsSurface(options('classic'));
    await vi.waitFor(() => expect(fakes.page.openTab).toHaveBeenCalledWith('general'));
    await vi.waitFor(() => expect(fakes.menu.open).toHaveBeenCalledWith('general'));
    fakes.reopen.value = 'vehicle';
    mountSettingsSurface(options('modern'));
    mountSettingsSurface(options('classic'));
    await vi.waitFor(() => expect(fakes.page.openTab).toHaveBeenLastCalledWith('vehicle'));
    await vi.waitFor(() => expect(fakes.menu.open).toHaveBeenLastCalledWith('vehicle'));
  });

  it('opens nothing on an ordinary start', async () => {
    const surface = mountSettingsSurface(options('modern'));
    await surface.load();
    expect(fakes.page.openTab).not.toHaveBeenCalled();
    expect(fakes.page.open).not.toHaveBeenCalled();
  });

  it('redraws only when the source really changes', async () => {
    const modern = mountSettingsSurface(options('modern'));
    modern.followSource('phone');
    modern.followSource('xparkle');
    modern.followSource('xparkle');
    modern.followSource('phone');
    await modern.load();
    await vi.waitFor(() => expect(fakes.page.refreshOpenTab).toHaveBeenCalledTimes(2));
    const classic = mountSettingsSurface(options('classic'));
    classic.followSource('easylevel');
    await vi.waitFor(() => expect(fakes.menu.refresh).toHaveBeenCalledTimes(1));
  });
});
