/**
 * ☰ menu (Classic appearance only; Modern's gear opens `settingsPage.ts`):
 * a flat list of full-screen pages with a ‹ Back header. The History API is
 * integrated so the Android back button/gesture closes the page, then the
 * drawer, and only then leaves the app.
 *
 * Vehicle/Ramps/Level/General are one settings form: `createSettingsForm`'s
 * `splitPages` option exposes Modern's tab groups as `classicPages`, and
 * `showPage` mounts the right one into the shared form before showing it —
 * one real component, reparented, never a copy. Calibration alone stays
 * standalone. The Level page keeps the section id 'targets', which the
 * main screen's target badge opens.
 */
import { createSettingsForm } from './settingsPanel';
import type { SettingsFormElement } from './settingsLayout';
import { createCalibrationSection } from './calibrationSection';
import { button, createElement, textElement } from './dom';
import { t, type MessageKey } from './i18n';
import { holdFocus, type FocusHold } from './focusHold';
import { setVisible } from './motion';
import type { SettingsOptions } from './settingsOptions';

export type MenuSection = 'general' | 'calibration' | 'vehicle' | 'ramps' | 'targets';

/** The ☰ menu reads exactly what the Settings page does. */
export type MenuOptions = SettingsOptions;

export interface Menu {
  /** The drawer + page containers, appended to the document body. */
  element: HTMLElement;
  open(section: MenuSection): void;
  /** Show the drawer, as a tap of the gear does when the menu is closed. */
  openDrawer(): void;
  attach(button: HTMLButtonElement): void;
  /** True while the drawer or a page is showing — the app pauses guidance. */
  isOpen(): boolean;
  /**
   * Redraw the calibration and targets pages if the menu is open — the
   * active sensor changed underneath it, e.g. the box disconnected from its
   * own page, which opens on top of this one.
   */
  refresh(): void;
}

export function createMenu(options: MenuOptions): Menu {
  const drawer = createDrawer();
  const page = createPage();
  const settingsForm = createMenuSettingsForm(options);
  const calibration = createCalibrationSection(options.calibration, 'checklist');
  const entries = createEntries(drawer, settingsForm, calibration.element, showPage);
  const element = wrap(drawer.backdrop, page.element);
  const view = createMenuView(drawer, page, element);
  const depth = createMenuHistory(() => view.render(depth.current()));

  function refreshPages(): void {
    calibration.refresh();
    settingsForm.refreshTargetsPage?.();
  }
  // The bottom bar's mute toggle can change the sound prefs while the menu
  // is closed — resync every reopen.
  function refreshBeforeShowing(): void {
    refreshPages();
    settingsForm.resyncSoundFields?.(options.getSoundPrefs());
  }
  function showDrawer(): void {
    depth.advanceTo(1);
    refreshBeforeShowing();
    view.render(depth.current());
  }
  function showPage(section: MenuSection): void {
    if (section !== 'calibration') {
      settingsForm.replaceChildren(settingsForm.classicPages![section]);
    }
    depth.advanceTo(2);
    refreshBeforeShowing();
    view.render(depth.current(), entries.get(section));
  }

  wireBackButtons(drawer, page, depth.back);
  return {
    element,
    open: showPage,
    openDrawer: showDrawer,
    isOpen: () => depth.current() > 0,
    refresh() {
      if (depth.current() > 0) refreshPages();
    },
    attach: (button) => toggleOnTap(button, depth, showDrawer),
  };
}

/** The gear opens the drawer when the menu is closed, and steps back when not. */
function toggleOnTap(
  button: HTMLButtonElement,
  depth: ReturnType<typeof createMenuHistory>,
  showDrawer: () => void,
): void {
  button.addEventListener('click', () => {
    if (depth.current() === 0) showDrawer();
    else depth.back();
  });
}

/** 0 = closed, 1 = the drawer, 2 = a page on top of it. */
type Depth = 0 | 1 | 2;

interface Drawer {
  backdrop: HTMLElement;
  panel: HTMLElement;
  close: HTMLButtonElement;
}

function createDrawer(): Drawer {
  const backdrop = createElement('div', 'menu');
  backdrop.hidden = true;
  const panel = createElement('div', 'menu__drawer');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', t('menu.title'));

  const header = createElement('div', 'menu__header');
  const title = textElement('span', 'menu__title', t('menu.title'));
  const close = button('menu__close', '✕');
  close.setAttribute('aria-label', t('menu.close'));
  header.append(title, close);
  panel.append(header);
  backdrop.append(panel);
  return { backdrop, panel, close };
}

interface MenuPage {
  element: HTMLElement;
  back: HTMLButtonElement;
  title: HTMLHeadingElement;
  body: HTMLElement;
}

/** The full-screen page with its ‹ Back header. */
function createPage(): MenuPage {
  const element = createElement('div', 'menu-page');
  element.hidden = true;
  const header = createElement('div', 'menu-page__header');
  const back = button('menu-page__back', '‹');
  const title = createElement('h2', 'menu-page__title');
  title.tabIndex = -1;
  header.append(back, title);
  const body = createElement('div', 'menu-page__body');
  element.append(header, body);
  return { element, back, title, body };
}

/** ✕, ‹ and a tap on the backdrop outside the drawer all go one step back. */
function wireBackButtons(drawer: Drawer, page: MenuPage, back: () => void): void {
  drawer.close.addEventListener('click', back);
  page.back.addEventListener('click', back);
  drawer.backdrop.addEventListener('click', (event) => {
    if (event.target === drawer.backdrop) back();
  });
}

function wrap(...children: HTMLElement[]): HTMLElement {
  const container = document.createElement('div');
  container.append(...children);
  return container;
}

/** Every change is stored as it is made; only ✕/back close the drawer. */
function createMenuSettingsForm(options: MenuOptions): SettingsFormElement {
  return createSettingsForm(
    options.initialSettings,
    (settings) => options.onSettingsSaved(settings),
    {
      hosts: options,
      splitPages: true,
      onShareVehicleSetup: options.onShareVehicleSetup,
    },
  );
}

interface MenuEntry {
  label: string;
  body: HTMLElement;
  item: HTMLButtonElement;
}

/** Modern's tab order, with Calibration third. */
const ENTRY_LABELS: readonly [MenuSection, MessageKey][] = [
  ['vehicle', 'settings.tab.vehicle'],
  ['ramps', 'settings.tab.ramps'],
  ['calibration', 'menu.calibration'],
  ['targets', 'settings.tab.level'],
  ['general', 'settings.general'],
];

/** Calibration is the one page outside the shared settings form (ADR 0013). */
function createEntries(
  drawer: Drawer,
  settingsForm: SettingsFormElement,
  calibrationBody: HTMLElement,
  showPage: (section: MenuSection) => void,
): Map<MenuSection, MenuEntry> {
  const entries = new Map<MenuSection, MenuEntry>();
  for (const [section, labelKey] of ENTRY_LABELS) {
    const label = t(labelKey);
    const item = button('menu__item', label, () => showPage(section));
    drawer.panel.append(item);
    const body = section === 'calibration' ? calibrationBody : settingsForm;
    entries.set(section, { label, body, item });
  }
  return entries;
}

/**
 * Opening a page focuses its title; going back to the drawer returns focus
 * to the entry that opened it. While the menu is open the rest of the app
 * is inert, and closing it returns focus to the ☰ button (#537).
 */
function createMenuView(drawer: Drawer, page: MenuPage, menu: HTMLElement) {
  let returnFocus: (() => void) | null = null;
  let hold: FocusHold | null = null;
  function showEntry(entry: MenuEntry): void {
    page.title.textContent = entry.label;
    page.body.replaceChildren(entry.body);
    page.title.focus();
    returnFocus = () => entry.item.focus();
  }
  return {
    render(depth: Depth, entry?: MenuEntry): void {
      if (depth > 0 && !hold) {
        hold = holdFocus(menu);
        if (depth === 1) drawer.close.focus();
      }
      setVisible(drawer.backdrop, depth > 0);
      setVisible(page.element, depth === 2);
      if (depth === 2 && entry) showEntry(entry);
      if (depth === 1) {
        returnFocus?.();
        returnFocus = null;
      }
      if (depth === 0) {
        hold?.release();
        hold = null;
      }
    },
  };
}

/**
 * The menu's depth, kept in the browser history so the Android back
 * button/gesture and our own buttons share one code path: every close
 * goes through `history.back()` and lands in `onBack`.
 *
 * Opening a page straight from closed pushes both entries (0 → 1 → 2) but
 * the caller renders only once, at the final depth. setVisible arms
 * a ~400ms fallback timer on every hide; rendering at the intermediate
 * depth would hide-then-reshow the page in one tick and leave that timer
 * armed to close the page a moment after it opened.
 */
function createMenuHistory(onBack: () => void) {
  let depth: Depth = 0;
  window.addEventListener('popstate', () => {
    if (depth === 0) return;
    depth -= 1;
    onBack();
  });
  return {
    current: (): Depth => depth,
    advanceTo(target: Depth): void {
      while (depth < target) {
        history.pushState({ libellMenu: depth + 1 }, '');
        depth += 1;
      }
    },
    back(): void {
      if (depth > 0) history.back();
    },
  };
}
