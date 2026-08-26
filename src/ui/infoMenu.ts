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
  calibrationIllustration,
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';
import type { VehicleType } from '../domain/settings';

export interface InfoPageOptions {
  /** Relaunch the first-run wizard — the button at the top of the Help tab. */
  openOnboarding(): void;
  /**
   * True once the wizard has actually been stepped through to the end —
   * distinct from merely having been opened and dismissed early (design
   * review, follow-up). Decides whether "Show introduction" still reads
   * as an unfinished first-run task (green, `false`) or a plain
   * re-launch (secondary, `true`) — see `buildIntroButton` below.
   */
  hasDoneOnboarding(): boolean;
}

export interface InfoPage {
  element: HTMLElement;
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
}

type InfoTab = 'help' | 'about' | 'feedback';

// Design review: 'help.what.h' ("What Libell does") used to be paired with
// 'help.what.t' — actually placement instructions, not a value pitch, so
// the heading promised one thing and delivered another. Split in two:
// this row now pairs the heading with the real pitch ('about.text', the
// same one the About tab and the onboarding wizard's welcome step use);
// the placement instructions moved to their own row below, titled with
// the wizard's own step heading for the same content ('onboard.step1.h').
// A Ramps row was added too (reusing 'settings.tab.ramps', the same
// heading the wizard step and the Settings tab use) — it used to be one
// sentence inside "The measurements", the only place in the app that
// still didn't give ramp configuration its own topic.
const HELP: {
  h: MessageKey;
  text: MessageKey;
  illustration?: (label: string) => SVGSVGElement;
  /** Motorhome + caravan side by side, one per vehicle type (design
   * review, follow-up): this static Help tab isn't tied to any
   * particular user's vehicle (see `helpIllustrations.ts`'s file
   * comment) — it used to default to just showing the motorhome, as if
   * a caravan owner's measurements didn't exist. Only "The measurements"
   * needs this: it's the one topic whose picture and text actually
   * differ by vehicle type (axle-to-jockey vs. front/rear axles, one
   * track width vs. two) — every other illustrated topic (placement,
   * the screen legend, calibration) looks and reads the same either way. */
  vehiclePair?: boolean;
}[] = [
  { h: 'help.what.h', text: 'about.text' },
  { h: 'onboard.step1.h', text: 'help.what.t', illustration: placementIllustration },
  { h: 'help.first.h', text: 'help.first.t' },
  { h: 'help.screen.h', text: 'help.screen.t', illustration: legendIllustration },
  { h: 'help.settings.h', text: 'help.settings.t', vehiclePair: true },
  { h: 'settings.tab.ramps', text: 'help.ramps.t' },
  { h: 'help.calibration.h', text: 'help.calibration.t', illustration: calibrationIllustration },
  { h: 'help.notes.h', text: 'help.notes.t' },
];

/** The introduction relaunch, at the top of the Help tab (screen-cleanup
 * follow-up) — the same action the old ☰ menu's "Show introduction" row
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
 * small caption — see `vehiclePair` on `HELP` above. */
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

function buildHelpPanel(introButton: HTMLButtonElement): HTMLElement {
  const panel = document.createElement('div');
  panel.append(introButton);
  for (const { h, text, illustration, vehiclePair } of HELP) {
    const heading = document.createElement('h3');
    heading.className = 'menu__heading';
    heading.textContent = t(h);
    panel.append(heading);
    if (vehiclePair) panel.append(buildVehiclePair(t(h)));
    else if (illustration) panel.append(illustration(t(h)));
    const p = document.createElement('p');
    p.className = 'menu__text';
    p.textContent = t(text);
    panel.append(p);
  }
  return panel;
}

export function createInfoPage(options: InfoPageOptions): InfoPage {
  // Assigned below, once `buildIntroButton` runs — referenced here only
  // inside a callback that fires on a later reopen, well after that.
  let refreshIntroButton: () => void = () => {};
  const page = createStandalonePage(t('menu.help'), () => {
    selectTab('help');
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
  addTab('help', buildHelpPanel(introButton.element));
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
