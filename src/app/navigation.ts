/**
 * Where each shortcut on the main screen leads. One router, so every
 * surface that names a place opens the same page for it.
 */
import type { SensorSource } from '../domain/settings';
import type { HelpTarget } from '../ui/infoMenu';
import type { Menu, MenuSection } from '../ui/menu';
import type { SettingsPage } from '../ui/settingsPage';
import type { ExternalSensorPage, SensorPage } from '../ui/sensorPage';

export interface NavigationDeps {
  /** Modern's tabbed Settings page, or Classic's ☰ menu. */
  settings:
    { settingsPage: Pick<SettingsPage, 'openTab' | 'openTargets'> } | { menu: Pick<Menu, 'open'> };
  /** Each box's own page; absent without Web Bluetooth. */
  externalSensorPage: Pick<ExternalSensorPage, 'openSource'> | null;
  /** The box list, or iOS's guide; absent when neither applies. */
  sensorPage: Pick<SensorPage, 'open'> | null;
  activeSource: () => SensorSource;
  /** A box chosen in the wizard but not connected yet. */
  isBoxPending: () => boolean;
}

export interface Navigation {
  openSettingsSection(section: MenuSection): void;
  openCalibration(): void;
  openSensor(): void;
  openActiveSensorPage(): void;
  openLamp(section: MenuSection): void;
  openTargets(): void;
  openHelpTarget(target: HelpTarget): void;
}

export function createNavigation(deps: NavigationDeps): Navigation {
  return {
    openSettingsSection: (section) => openSettingsSection(deps, section),
    openCalibration: () => openCalibration(deps),
    openSensor: () => openSensor(deps),
    openActiveSensorPage: () => void openActiveBox(deps),
    openLamp(section) {
      if (section === 'calibration') openCalibration(deps);
      else openSettingsSection(deps, section);
    },
    openTargets() {
      const { settings } = deps;
      if ('settingsPage' in settings) settings.settingsPage.openTargets();
      else settings.menu.open('targets');
    },
    openHelpTarget(target) {
      if (target === 'sensor') openSensor(deps);
      else if (target === 'calibration') openCalibration(deps);
      else openSettingsSection(deps, target);
    },
  };
}

/** False when the phone is in use or there are no box pages. */
function openActiveBox({ activeSource, externalSensorPage }: NavigationDeps): boolean {
  const source = activeSource();
  if (source === 'phone' || !externalSensorPage) return false;
  externalSensorPage.openSource(source);
  return true;
}

function openSettingsSection({ settings }: NavigationDeps, section: MenuSection): void {
  if ('settingsPage' in settings) settings.settingsPage.openTab(section);
  else settings.menu.open(section);
}

/** With a box in use, calibrating is about the box's setup, so it opens the
 * box's page, where its checklist expands the next step not yet done. A box
 * chosen in the wizard, not yet connected: the list, to connect it. */
function openCalibration(deps: NavigationDeps): void {
  if (openActiveBox(deps)) return;
  if (deps.isBoxPending() && deps.sensorPage) deps.sensorPage.open();
  else openSettingsSection(deps, 'calibration');
}

/** With a box in use (connected or lost), its own page: its state, Reconnect
 * and setup are all there. The list stays the way to add or switch boxes
 * while the phone is active. */
function openSensor(deps: NavigationDeps): void {
  if (!openActiveBox(deps)) deps.sensorPage?.open();
}
