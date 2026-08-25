/**
 * Info page (screen-cleanup follow-up): the bottom bar's "?" button opens
 * exactly one page — Help / About / Feedback as tabs, the same tab
 * pattern the Settings form already uses for Vehicle/Ramps/Kalibrering
 * (`.settings__tabs`, `settingsPanel.ts`) — instead of the drawer-then-
 * page navigation the ☰ Settings menu uses.
 *
 * A previous version reused the ☰ menu's own shared history depth so this
 * page could be opened directly (`menu.open('help')`), but that meant its
 * back button popped through the SAME depth counter the ☰ menu itself
 * uses — from this page, back could land on depth 1, silently revealing
 * the Settings drawer underneath, a menu the user never opened. Tabs have
 * no navigation depth at all: switching tabs is local UI state, not a
 * history entry, so there is nothing to leak into. This page owns no
 * history state of its own either — it is simply shown/hidden, with one
 * ✕ to close it, exactly like the ☰ menu's own drawer-level close.
 */
import { createAboutSection } from './about';
import { createFeedbackSection } from './feedback';
import { t, type MessageKey } from './i18n';
import { setVisible } from './motion';
import {
  calibrationIllustration,
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';

export interface InfoPage {
  /** The page element, appended to the document body. */
  element: HTMLElement;
  /** True while the page is showing — the app pauses guidance, same as the ☰ menu. */
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
}

type InfoTab = 'help' | 'about' | 'feedback';

const HELP: {
  h: MessageKey;
  text: MessageKey;
  illustration?: (label: string) => SVGSVGElement;
}[] = [
  { h: 'help.what.h', text: 'help.what.t', illustration: placementIllustration },
  { h: 'help.first.h', text: 'help.first.t' },
  { h: 'help.screen.h', text: 'help.screen.t', illustration: legendIllustration },
  { h: 'help.settings.h', text: 'help.settings.t', illustration: measuresIllustration },
  { h: 'help.calibration.h', text: 'help.calibration.t', illustration: calibrationIllustration },
  { h: 'help.notes.h', text: 'help.notes.t' },
];

function buildHelpPanel(): HTMLElement {
  const panel = document.createElement('div');
  for (const { h, text, illustration } of HELP) {
    const heading = document.createElement('h3');
    heading.className = 'menu__heading';
    heading.textContent = t(h);
    panel.append(heading);
    if (illustration) panel.append(illustration(t(h)));
    const p = document.createElement('p');
    p.className = 'menu__text';
    p.textContent = t(text);
    panel.append(p);
  }
  return panel;
}

export function createInfoPage(): InfoPage {
  const page = document.createElement('div');
  page.className = 'menu-page';
  page.hidden = true;

  const header = document.createElement('div');
  header.className = 'menu-page__header';
  // ✕, not ‹ — this page is the top level reached from "?", never nested
  // under another menu, so "close" (not "back to something") is the
  // accurate action, same convention as the ☰ menu's own drawer header.
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'menu-page__back';
  close.setAttribute('aria-label', t('menu.close'));
  close.textContent = '✕';
  const title = document.createElement('h2');
  title.className = 'menu-page__title';
  title.tabIndex = -1;
  header.append(close, title);

  const body = document.createElement('div');
  body.className = 'menu-page__body';

  const tabsBar = document.createElement('div');
  tabsBar.className = 'settings__tabs';
  tabsBar.setAttribute('role', 'tablist');

  const TAB_LABELS: Record<InfoTab, string> = {
    help: t('menu.help'),
    about: t('menu.about.tab'),
    feedback: t('menu.feedback'),
  };
  // The header title spells out the full section name (About Libell, not
  // just the tab's short "About") — reused verbatim, not a new string.
  const TAB_TITLES: Record<InfoTab, string> = {
    help: t('menu.help'),
    about: t('menu.about'),
    feedback: t('menu.feedback'),
  };

  const tabButtons = new Map<InfoTab, HTMLButtonElement>();
  const tabPanels = new Map<InfoTab, HTMLElement>();

  function addTab(id: InfoTab, panel: HTMLElement): void {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'settings__tab';
    btn.setAttribute('role', 'tab');
    btn.dataset.tab = id;
    btn.textContent = TAB_LABELS[id];
    btn.addEventListener('click', () => selectTab(id));
    tabsBar.append(btn);
    tabButtons.set(id, btn);

    panel.classList.add('settings__tabpanel');
    tabPanels.set(id, panel);
  }

  addTab('help', buildHelpPanel());
  addTab('about', createAboutSection());
  addTab('feedback', createFeedbackSection());

  function selectTab(id: InfoTab): void {
    for (const [tid, btn] of tabButtons) btn.setAttribute('aria-selected', String(tid === id));
    for (const [tid, panel] of tabPanels) panel.hidden = tid !== id;
    title.textContent = TAB_TITLES[id];
  }
  selectTab('help');

  body.append(tabsBar);
  for (const panel of tabPanels.values()) body.append(panel);
  page.append(header, body);

  let open = false;
  function show(): void {
    open = true;
    history.pushState({ libellInfoPage: 1 }, '');
    setVisible(page, true);
    selectTab('help');
    title.focus();
  }
  // Set right before `hide()`'s own `history.back()` call, so the single
  // popstate that produces doesn't also run the listener below — this
  // function has already applied the closed state itself. Same pattern as
  // the ☰ menu's `closeAll()` (menu.ts), but never touching that menu's
  // own depth/history handling: this page pushed exactly one state of its
  // own, so it only ever pops its own.
  let suppressNextPopstate = false;
  function hide(): void {
    if (!open) return;
    open = false;
    setVisible(page, false);
    suppressNextPopstate = true;
    history.back();
  }
  close.addEventListener('click', hide);
  // Android back button/gesture (#53's original History API integration,
  // preserved here): closes this page instead of leaving the app,
  // completely independent of the ☰ Settings menu's own popstate handler
  // — that one only acts while ITS OWN depth is nonzero, so it can never
  // be the thing this page's back button ends up revealing.
  window.addEventListener('popstate', () => {
    if (suppressNextPopstate) {
      suppressNextPopstate = false;
      return;
    }
    if (open) {
      open = false;
      setVisible(page, false);
    }
  });

  return {
    element: page,
    isOpen: () => open,
    attach(button) {
      button.addEventListener('click', () => (open ? hide() : show()));
    },
  };
}
