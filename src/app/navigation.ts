/**
 * Where each shortcut on the main screen leads (#392, step 3): the lamps,
 * the sensor icon, the target badge, Help's topic buttons and the
 * overlays' links to a box. One router, so every surface that names a
 * place opens the same page for it.
 */
import type { SensorSource } from '../domain/settings';
import type { HelpTarget } from '../ui/infoMenu';
import type { Menu, MenuSection } from '../ui/menu';
import type { SettingsPage } from '../ui/settingsPage';
import type { ExternalSensorPage, SensorPage } from '../ui/sensorPage';

export interface NavigationDeps {
  /** Modern's tabbed Settings page, or Classic's ☰ menu. */
  settings:
    | { settingsPage: Pick<SettingsPage, 'open' | 'openTab' | 'openTargets'> }
    | { menu: Pick<Menu, 'open'> };
  /** Each box's own page; absent without Web Bluetooth. */
  externalSensorPage: Pick<ExternalSensorPage, 'openSource'> | null;
  /** The box list, or iOS's guide; absent when neither applies. */
  sensorPage: Pick<SensorPage, 'open'> | null;
  activeSource: () => SensorSource;
  /** A box chosen in the wizard but not connected yet (#365). */
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
  const { settings, externalSensorPage, sensorPage } = deps;

  /** The active box's own page, if a box is in use and has one. */
  function openActiveBox(): boolean {
    const source = deps.activeSource();
    if (source === 'phone' || !externalSensorPage) return false;
    externalSensorPage.openSource(source);
    return true;
  }

  function openSettingsSection(section: MenuSection): void {
    if ('settingsPage' in settings) settings.settingsPage.openTab(section);
    else settings.menu.open(section);
  }

  // With a box in use, calibrating is about the box's setup, so it opens
  // the box's page, where its checklist expands the next step not yet
  // done (#316). A box chosen in the wizard, not yet connected (#365):
  // the list, to connect it.
  function openCalibration(): void {
    if (openActiveBox()) return;
    if (deps.isBoxPending() && sensorPage) sensorPage.open();
    else openSettingsSection('calibration');
  }

  // With a box in use (connected or lost), its own page (#315): its
  // state, Reconnect and setup are all there. The list stays the way to
  // add or switch boxes while the phone is active.
  function openSensor(): void {
    if (!openActiveBox()) sensorPage?.open();
  }

  return {
    openSettingsSection,
    openCalibration,
    openSensor,
    openActiveSensorPage: () => void openActiveBox(),
    openLamp(section) {
      if (section === 'calibration') openCalibration();
      else if ('settingsPage' in settings) settings.settingsPage.open();
      else settings.menu.open(section);
    },
    openTargets() {
      if ('settingsPage' in settings) settings.settingsPage.openTargets();
      else settings.menu.open('targets');
    },
    openHelpTarget(target) {
      if (target === 'sensor') openSensor();
      else if (target === 'calibration') openCalibration();
      else openSettingsSection(target);
    },
  };
}
