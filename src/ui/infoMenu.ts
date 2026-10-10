/**
 * Info page (screen-cleanup follow-up): the bottom bar's "?" button opens
 * exactly one page — Help / About / Feedback as tabs, the same tab pattern
 * the Settings page already uses for Vehicle/Ramps/Kalibrering/Targets
 * (`.settings__tabs`) — instead of the old ☰ Settings menu's drawer-then-
 * page navigation, which the introduction relaunch used to live behind.
 *
 * Diagnostics (#133, R36) used to be a fourth tab here — removed (design
 * review): its generic phone-or-EasyLevel framing didn't earn its keep.
 * Whatever EasyLevel-specific troubleshooting value it had now lives in
 * `easyLevelStatusPage.ts`'s own "Debug info" disclosure instead, reading
 * raw values straight off the box rather than a generic sensor snapshot.
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
import { createStandalonePage, type StandalonePage } from './standalonePage';
import { t, type MessageKey } from './i18n';
import {
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';
import type { VehicleType } from '../domain/settings';

/** Where a Help topic's button leads (#326) — `main.ts` maps each to the
 * right Settings tab (Classic: ☰ section) or the sensor page. */
export type HelpTarget = 'vehicle' | 'ramps' | 'calibration' | 'targets' | 'sensor';

export interface InfoPageOptions {
  /** Relaunch the first-run wizard — the button at the bottom of the Help tab. */
  openOnboarding(): void;
  /**
   * True once the wizard has actually been stepped through to the end —
   * distinct from merely having been opened and dismissed early (design
   * review, follow-up). Decides whether "Show introduction" still reads
   * as an unfinished first-run task (green, `false`) or a plain
   * re-launch (secondary, `true`) — see `buildIntroButton` below.
   */
  hasDoneOnboarding(): boolean;
  /** Open the place a Help topic talks about (#326). Called after this
   * page has closed. Without it, topics show no buttons. */
  openTarget?(target: HelpTarget): void;
  /** False where the app has no sensor page at all (no Web Bluetooth and
   * not iOS) — the Sensor box topic then explains without a button. */
  hasSensorPage?: boolean;
}

export interface InfoPage {
  element: HTMLElement;
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
}

type InfoTab = 'help' | 'about' | 'feedback';

/** The Help tab's topics (#326, R28): fold-out, one open at a time, each a
 * few lines (one fact per line) ending in a button to the place it talks
 * about. Help says what and where; the screens themselves say how. What
 * the About tab says (the pitch, offline) and what Feedback already sends
 * (the version) is not repeated here. "Reading the screen" opens first:
 * it is what people come back for. */
type TopicId =
  'screen' | 'place' | 'measures' | 'ramps' | 'calibration' | 'sensor' | 'targets' | 'trouble';

interface Topic {
  id: TopicId;
  h: MessageKey;
  text: MessageKey;
  picture?: (label: string) => Element;
  go?: { label: () => string; target: HelpTarget | 'feedback' };
}

const openTab = (tab: MessageKey) => () => t('help.open', { name: t(tab) });

const TOPICS: Topic[] = [
  { id: 'screen', h: 'help.screen.h', text: 'help.screen.t', picture: legendIllustration },
  { id: 'place', h: 'onboard.step1.h', text: 'help.what.t', picture: placementIllustration },
  {
    id: 'measures',
    h: 'help.measures.h',
    text: 'help.settings.t',
    picture: buildVehiclePair,
    go: { label: openTab('settings.tab.vehicle'), target: 'vehicle' },
  },
  {
    id: 'ramps',
    h: 'settings.tab.ramps',
    text: 'help.ramps.t',
    go: { label: openTab('settings.tab.ramps'), target: 'ramps' },
  },
  {
    id: 'calibration',
    h: 'help.calibration.h',
    text: 'help.calibration.t',
    go: { label: openTab('menu.calibration'), target: 'calibration' },
  },
  {
    id: 'sensor',
    h: 'help.sensor.h',
    text: 'help.sensor.t',
    go: { label: () => t('help.open.sensor'), target: 'sensor' },
  },
  {
    id: 'targets',
    h: 'help.targets.h',
    text: 'help.targets.t',
    go: { label: openTab('menu.targets'), target: 'targets' },
  },
  {
    id: 'trouble',
    h: 'help.trouble.h',
    text: 'help.trouble.t',
    go: { label: () => t('help.open.feedback'), target: 'feedback' },
  },
];
const FIRST_OPEN: TopicId = 'screen';

/** The introduction relaunch, at the bottom of the Help tab (screen-cleanup
 * follow-up; moved from the top in #326) — the same action the old ☰ menu's "Show introduction" row
 * performed, closing this page first so the wizard isn't shown behind it.
 *
 * Styled green (the "still an open first-run task" look, same as the
 * "not calibrated"/"settings not saved" lamps) until the wizard has
 * actually been completed once — not merely opened and dismissed early,
 * see `hasDoneOnboarding` (design review, follow-up: it used to be
 * permanently secondary-styled, as if re-launching it were never more
 * than an optional extra). `refresh()` re-checks the stored flag — call
 * it whenever it might have changed underneath this button (the page
 * reopening; the wizard just finished). */
function buildIntroButton(
  page: StandalonePage,
  openOnboarding: () => void,
  hasDoneOnboarding: () => boolean,
): { element: HTMLButtonElement; refresh(): void } {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = t('menu.intro');
  button.addEventListener('click', () => {
    page.close();
    openOnboarding();
  });
  function refresh(): void {
    button.className = hasDoneOnboarding()
      ? 'menu__action menu__action--secondary'
      : 'menu__action';
  }
  refresh();
  return { element: button, refresh };
}

/** Motorhome + caravan illustrations side by side, each with its own
 * small caption: this static tab isn't tied to the user's vehicle, and
 * the measurements are the one topic whose picture differs by type. */
function buildVehiclePair(heading: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'illu-pair';
  const variants: [VehicleType, MessageKey][] = [
    ['motorhome', 'vehicle.motorhome'],
    ['caravan', 'vehicle.caravan'],
  ];
  for (const [vehicleType, labelKey] of variants) {
    const item = document.createElement('div');
    item.className = 'illu-pair__item';
    const caption = document.createElement('p');
    caption.className = 'illu-pair__caption';
    caption.textContent = t(labelKey);
    item.append(caption, measuresIllustration(`${heading} – ${t(labelKey)}`, vehicleType));
    row.append(item);
  }
  return row;
}

interface HelpPanel {
  element: HTMLElement;
  /** Fold every topic but the first one — each time the page reopens. */
  reset(): void;
}

function buildHelpPanel(
  introButton: HTMLButtonElement,
  go: (target: HelpTarget | 'feedback') => void,
  hasTarget: (target: HelpTarget | 'feedback') => boolean,
): HelpPanel {
  const panel = document.createElement('div');
  const toggles = new Map<TopicId, { button: HTMLButtonElement; body: HTMLElement }>();

  function show(open: TopicId | null): void {
    for (const [id, { button, body }] of toggles) {
      button.setAttribute('aria-expanded', String(id === open));
      body.hidden = id !== open;
    }
  }

  for (const topic of TOPICS) {
    const section = document.createElement('section');
    section.className = 'help-topic';
    section.dataset.topic = topic.id;

    const heading = document.createElement('h3');
    heading.className = 'help-topic__heading';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'help-topic__toggle';
    button.textContent = t(topic.h);
    const body = document.createElement('div');
    body.className = 'help-topic__body';
    body.id = `help-topic-${topic.id}`;
    button.setAttribute('aria-controls', body.id);
    button.addEventListener('click', () => show(body.hidden ? topic.id : null));
    heading.append(button);

    if (topic.picture) body.append(topic.picture(t(topic.h)));
    const p = document.createElement('p');
    p.className = 'menu__text';
    p.textContent = t(topic.text);
    body.append(p);
    if (topic.go && hasTarget(topic.go.target)) {
      const target = topic.go.target;
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'menu__action menu__action--secondary help-topic__go';
      action.textContent = topic.go.label();
      action.addEventListener('click', () => go(target));
      body.append(action);
    }

    section.append(heading, body);
    panel.append(section);
    toggles.set(topic.id, { button, body });
  }
  panel.append(introButton);

  const reset = () => show(FIRST_OPEN);
  reset();
  return { element: panel, reset };
}

export function createInfoPage(options: InfoPageOptions): InfoPage {
  // Assigned below, once `buildIntroButton` runs — referenced here only
  // inside a callback that fires on a later reopen, well after that.
  let refreshIntroButton: () => void = () => {};
  let resetHelp: () => void = () => {};
  const page = createStandalonePage(t('menu.help'), () => {
    selectTab('help');
    resetHelp();
    // The wizard may have been completed (or not) since this page was
    // last open (design review, follow-up) — resync "Show introduction"'s
    // green/secondary look every reopen, same pattern as the mute
    // toggle resyncing Settings' own sound checkboxes.
    refreshIntroButton();
  });

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

  const introButton = buildIntroButton(page, options.openOnboarding, options.hasDoneOnboarding);
  refreshIntroButton = introButton.refresh;
  const helpPanel = buildHelpPanel(
    introButton.element,
    (target) => {
      // Feedback is a tab right here; everything else is another page,
      // opened once this one's close has landed (`StandalonePage.close`).
      if (target === 'feedback') selectTab('feedback');
      else page.close(() => options.openTarget?.(target));
    },
    (target) =>
      target === 'feedback' ||
      (options.openTarget !== undefined && (target !== 'sensor' || options.hasSensorPage === true)),
  );
  resetHelp = helpPanel.reset;
  addTab('help', helpPanel.element);
  addTab('about', createAboutSection());
  addTab('feedback', createFeedbackSection());

  function selectTab(id: InfoTab): void {
    for (const [tid, btn] of tabButtons) btn.setAttribute('aria-selected', String(tid === id));
    for (const [tid, panel] of tabPanels) panel.hidden = tid !== id;
    page.setTitle(TAB_TITLES[id]);
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
