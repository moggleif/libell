/**
 * Info page (screen-cleanup follow-up): the bottom bar's "?" button opens
 * exactly one page — Help / About / Feedback / Diagnostics as tabs, the
 * same tab pattern the Settings page already uses for Vehicle/Ramps/
 * Kalibrering/Targets (`.settings__tabs`) — instead of the old ☰ Settings
 * menu's drawer-then-page navigation, which Diagnostics and the
 * introduction relaunch used to live behind.
 *
 * This page owns no shared navigation state (`standalonePage.ts`): a
 * previous version reused the ☰ menu's own history depth so this page
 * could be opened directly, but that meant its back button popped through
 * the SAME depth counter the ☰ menu itself used — from this page, back
 * could land one level up, silently revealing the Settings drawer
 * underneath, a menu the user never opened. Tabs have no navigation depth
 * at all: switching tabs is local UI state, not a history entry, so there
 * is nothing to leak into — and this page's own single history entry
 * (`createStandalonePage`) can only ever close itself.
 */
import { createAboutSection } from './about';
import { createFeedbackSection } from './feedback';
import { createDiagnosticsSection, type DiagnosticsOptions } from './diagnosticsSection';
import { createStandalonePage, type StandalonePage } from './standalonePage';
import { t, type MessageKey } from './i18n';
import {
  calibrationIllustration,
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';

export interface InfoPageOptions {
  diagnostics: DiagnosticsOptions;
  /** Relaunch the first-run wizard — the button at the top of the Help tab. */
  openOnboarding(): void;
}

export interface InfoPage {
  element: HTMLElement;
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
}

type InfoTab = 'help' | 'about' | 'feedback' | 'diagnostics';

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

/** The introduction relaunch, at the top of the Help tab (screen-cleanup
 * follow-up) — the same action the old ☰ menu's "Show introduction" row
 * performed, closing this page first so the wizard isn't shown behind it. */
function buildIntroButton(page: StandalonePage, openOnboarding: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu__action menu__action--secondary';
  button.textContent = t('menu.intro');
  button.addEventListener('click', () => {
    page.close();
    openOnboarding();
  });
  return button;
}

function buildHelpPanel(introButton: HTMLButtonElement): HTMLElement {
  const panel = document.createElement('div');
  panel.append(introButton);
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

export function createInfoPage(options: InfoPageOptions): InfoPage {
  const page = createStandalonePage(t('menu.help'), () => {
    selectTab('help');
    diagnosticsSection.refresh();
  });

  const tabsBar = document.createElement('div');
  tabsBar.className = 'settings__tabs';
  tabsBar.setAttribute('role', 'tablist');

  const TAB_LABELS: Record<InfoTab, string> = {
    help: t('menu.help'),
    about: t('menu.about.tab'),
    feedback: t('menu.feedback'),
    diagnostics: t('menu.diagnostics'),
  };
  // The header title spells out the full section name (About Libell, not
  // just the tab's short "About") — reused verbatim, not a new string.
  const TAB_TITLES: Record<InfoTab, string> = {
    help: t('menu.help'),
    about: t('menu.about'),
    feedback: t('menu.feedback'),
    diagnostics: t('menu.diagnostics'),
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

  const introButton = buildIntroButton(page, options.openOnboarding);
  addTab('help', buildHelpPanel(introButton));
  addTab('about', createAboutSection());
  addTab('feedback', createFeedbackSection());
  // Diagnostics (#133, R36): to the right of Feedback (screen-cleanup
  // follow-up) — dev/support detail, no longer behind the deleted ☰ menu.
  const diagnosticsSection = createDiagnosticsSection(options.diagnostics);
  addTab('diagnostics', diagnosticsSection.element);

  function selectTab(id: InfoTab): void {
    for (const [tid, btn] of tabButtons) btn.setAttribute('aria-selected', String(tid === id));
    for (const [tid, panel] of tabPanels) panel.hidden = tid !== id;
    page.setTitle(TAB_TITLES[id]);
    if (id === 'diagnostics') diagnosticsSection.refresh();
  }
  selectTab('help');

  page.body.append(tabsBar);
  for (const panel of tabPanels.values()) page.body.append(panel);

  return {
    element: page.element,
    isOpen: page.isOpen,
    attach: page.attach,
  };
}
