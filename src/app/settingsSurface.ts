/**
 * Where Settings live: Modern's tabbed Settings page behind
 * the gear, or Classic's ☰ drawer. Decided once at start-up, like every
 * other appearance-branching component; a later appearance change reloads.
 * Either loads after the first screen: when the phone is idle, on the first
 * tap of the gear, or at once when a reload asks to reopen it (ADR 0024).
 */
import type { SensorSource } from '../domain/settings';
import type { Menu, MenuOptions, MenuSection } from '../ui/menu';
import { takeReopenSettings } from '../ui/reopenSettings';
import type { SettingsPage } from '../ui/settingsPage';
import { lazyPage, whenIdle } from './lazyPart';
import type { NavigationDeps } from './navigation';

export interface SettingsSurface {
  isOpen(): boolean;
  /** What the router opens sections on; each loads Settings first. */
  route: NavigationDeps['settings'];
  /**
   * The active source may have flipped under an open Settings (a box
   * connected or disconnected from its own page): redraw its calibration
   * view so closing the box page shows the right one. Only on a
   * real change, so a silent reconnect never redraws mid-read.
   */
  followSource(source: SensorSource): void;
  /** Fetches and mounts Settings now, if not already. */
  load(): Promise<void>;
}

/** Modern's page or Classic's menu, once mounted. */
interface Surface {
  isOpen(): boolean;
  open(): void;
  attach(button: HTMLButtonElement): void;
  openSection(section: MenuSection): void;
  openTargets(): void;
  redraw(): void;
}

export function mountSettingsSurface(options: MenuOptions): SettingsSurface {
  const button = document.querySelector<HTMLButtonElement>('#settings-button');
  const modern = options.initialSettings.appearance === 'modern';
  const surface = lazyPage(button, async () =>
    modern
      ? mountSettingsPage((await import('../ui/settingsPage')).createSettingsPage(options))
      : mountMenu((await import('../ui/menu')).createMenu(options)),
  );
  const whenLoaded = (act: (loaded: Surface) => void) =>
    void surface.load().then((s) => s && act(s));
  // Just reloaded from Settings (a new appearance or language, another
  // vehicle): back on the section where the choice was made (#615).
  const reopen = takeReopenSettings();
  if (reopen) whenLoaded((loaded) => loaded.openSection(reopen));
  else whenIdle(() => void surface.load());
  let lastSource: SensorSource = 'phone';
  return {
    isOpen: surface.isOpen,
    route: route(modern, whenLoaded),
    followSource(source) {
      if (source === lastSource) return;
      lastSource = source;
      whenLoaded((loaded) => loaded.redraw());
    },
    load: () => surface.load().then(() => undefined),
  };
}

function route(
  modern: boolean,
  whenLoaded: (act: (loaded: Surface) => void) => void,
): NavigationDeps['settings'] {
  const openSection = (section: MenuSection) => whenLoaded((s) => s.openSection(section));
  if (!modern) return { menu: { open: openSection } };
  return {
    settingsPage: {
      openTab: openSection,
      openTargets: () => whenLoaded((s) => s.openTargets()),
    },
  };
}

function mountSettingsPage(settingsPage: SettingsPage): Surface {
  document.body.append(settingsPage.element);
  return {
    isOpen: () => settingsPage.isOpen(),
    open: () => settingsPage.open(),
    attach: (button) => settingsPage.attach(button),
    openSection: (section) => settingsPage.openTab(section),
    openTargets: () => settingsPage.openTargets(),
    redraw: () => settingsPage.refreshOpenTab(),
  };
}

function mountMenu(menu: Menu): Surface {
  document.body.append(menu.element);
  return {
    isOpen: () => menu.isOpen(),
    open: () => menu.openDrawer(),
    attach: (button) => menu.attach(button),
    openSection: (section) => menu.open(section),
    openTargets: () => menu.open('targets'),
    redraw: () => menu.refresh(),
  };
}
