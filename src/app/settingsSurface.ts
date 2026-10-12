/**
 * Where Settings live: Modern's tabbed Settings page behind
 * the gear, or Classic's ☰ drawer. Decided once at start-up, like every
 * other appearance-branching component; a later appearance change reloads.
 */
import type { SensorSource } from '../domain/settings';
import { createMenu, type MenuOptions } from '../ui/menu';
import { takeReopenSettings } from '../ui/reopenSettings';
import { createSettingsPage } from '../ui/settingsPage';
import type { NavigationDeps } from './navigation';

export interface SettingsSurface {
  isOpen(): boolean;
  /** What the router opens sections on. */
  route: NavigationDeps['settings'];
  /**
   * The active source may have flipped under an open Settings (a box
   * connected or disconnected from its own page): redraw its calibration
   * view so closing the box page shows the right one. Only on a
   * real change, so a silent reconnect never redraws mid-read.
   */
  followSource(source: SensorSource): void;
}

export function mountSettingsSurface(options: MenuOptions): SettingsSurface {
  const button = document.querySelector<HTMLButtonElement>('#settings-button');
  const surface =
    options.initialSettings.appearance === 'modern'
      ? mountSettingsPage(options, button)
      : mountMenu(options, button);
  // Just reloaded for a new appearance or language from Settings:
  // back on General, where the choice was made.
  if (takeReopenSettings()) surface.openGeneral();
  let lastSource: SensorSource = 'phone';
  return {
    isOpen: surface.isOpen,
    route: surface.route,
    followSource(source) {
      if (source === lastSource) return;
      lastSource = source;
      surface.redraw();
    },
  };
}

function mountSettingsPage(options: MenuOptions, button: HTMLButtonElement | null) {
  const settingsPage = createSettingsPage(options);
  document.body.append(settingsPage.element);
  if (button) settingsPage.attach(button);
  return {
    isOpen: () => settingsPage.isOpen(),
    route: { settingsPage },
    openGeneral: () => settingsPage.openTab('general'),
    redraw: () => settingsPage.refreshOpenTab(),
  };
}

function mountMenu(options: MenuOptions, button: HTMLButtonElement | null) {
  const menu = createMenu(options);
  document.body.append(menu.element);
  if (button) menu.attach(button);
  return {
    isOpen: () => menu.isOpen(),
    route: { menu },
    openGeneral: () => menu.open('general'),
    redraw: () => menu.refresh(),
  };
}
