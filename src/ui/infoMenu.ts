/**
 * Info page behind the "?" button: Help / About / Feedback / Privacy as tabs.
 *
 * It owns no shared navigation state: sharing the menu's history depth let
 * back land one level up, revealing a Settings drawer the user never opened.
 * Switching tabs is local UI state, not a history entry, and the page's own
 * single history entry can only ever close itself.
 */
import { createAboutSection } from './about';
import { createFeedbackSection } from './feedback';
import { createPrivacyPanel, type PrivacyPanelOptions } from './privacyPanel';
import { createStandalonePage, type StandalonePage } from './standalonePage';
import { t, type MessageKey } from './i18n';
import {
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';
import type { VehicleType } from '../domain/settings';
import { EXTERNAL_SENSORS } from '../sensor/boxes';
import { RAMP_MODELS } from '../domain/ramps';
import { button, createElement, paragraph } from './dom';

/** `main.ts` maps each to the right Settings tab or the sensor page. */
export type HelpTarget = 'general' | 'vehicle' | 'ramps' | 'calibration' | 'targets' | 'sensor';

export interface InfoPageOptions {
  openOnboarding(): void;
  /**
   * True once the wizard was stepped through to the end, not merely opened
   * and dismissed early.
   */
  hasDoneOnboarding(): boolean;
  /** Called after this page has closed. Without it, topics show no buttons. */
  openTarget?(target: HelpTarget): void;
  /** What the Privacy tab lists and deletes (#678). */
  storedData: Pick<PrivacyPanelOptions, 'read' | 'deleteAll' | 'counting'>;
  /** The feedback form opened GitHub's new-issue page. */
  onFeedbackSent?(): void;
}

export interface InfoPage {
  element: HTMLElement;
  isOpen(): boolean;
  open(): void;
  attach(button: HTMLButtonElement): void;
}

type InfoTab = 'help' | 'about' | 'feedback' | 'privacy';

/** The Help tab's topics (R28). "Reading the screen" opens first: it is what
 * people come back for. */
type TopicId =
  'screen' | 'place' | 'measures' | 'ramps' | 'calibration' | 'sensor' | 'targets' | 'trouble';

interface Topic {
  id: TopicId;
  h: MessageKey;
  /** A first line, above the picture, saying what the topic is for. */
  lead?: MessageKey;
  text: MessageKey;
  /** Values for the text's placeholders, read when the topic is built. */
  textVars?: () => Record<string, string>;
  /** A line for what only applies to a caravan. */
  caravanLine?: MessageKey;
  /** A last line, after the caravan line. */
  closing?: MessageKey;
  picture?: (label: string) => Element;
  go?: { label: () => string; target: HelpTarget | 'feedback' };
}

const openTab = (tab: MessageKey) => () => t('help.open', { name: t(tab) });

/** The box names for the Sensorbox topic, grouped by how each is mounted.
 * Brands never live in a catalogue (#267), so they are filled in here. */
function boxNamesByMounting(): Record<string, string> {
  const names = (upright: boolean) =>
    EXTERNAL_SENSORS.filter((box) => box.capabilities.upright === upright)
      .map((box) => box.displayName)
      .join(', ');
  return { upright: names(true), flat: names(false) };
}

/** The adjustable klossar by name for the Ramps topic; like the boxes, a
 * catalog name is filled in, never translated (#712). */
function adjustableRampNames(): Record<string, string> {
  const names = RAMP_MODELS.filter((model) => model.adjustable).map((model) => model.name);
  return { adjustable: names.join(', ') };
}

const TOPICS: Topic[] = [
  {
    id: 'screen',
    h: 'help.screen.h',
    lead: 'help.screen.lead',
    text: 'help.screen.t',
    caravanLine: 'help.screen.caravan',
    closing: 'help.screen.routine',
    picture: legendIllustration,
  },
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
    textVars: adjustableRampNames,
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
    textVars: boxNamesByMounting,
    go: { label: () => t('help.open.sensor'), target: 'sensor' },
  },
  {
    id: 'targets',
    h: 'help.targets.h',
    text: 'help.targets.t',
    go: { label: openTab('settings.tab.level'), target: 'targets' },
  },
  {
    id: 'trouble',
    h: 'help.trouble.h',
    text: 'help.trouble.t',
    go: { label: () => t('help.open.feedback'), target: 'feedback' },
  },
];
const FIRST_OPEN: TopicId = 'screen';

/** Closes this page first so the wizard isn't shown behind it. Styled
 * primary until the wizard has been completed once; `refresh()` re-checks
 * the stored flag. */
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

/** Both vehicles side by side: this static tab isn't tied to the user's
 * vehicle. */
function buildVehiclePair(heading: string): HTMLElement {
  const row = createElement('div', 'illu-pair');
  const variants: [VehicleType, MessageKey][] = [
    ['motorhome', 'vehicle.motorhome'],
    ['caravan', 'vehicle.caravan'],
  ];
  for (const [vehicleType, labelKey] of variants) {
    const item = createElement('div', 'illu-pair__item');
    const caption = paragraph('illu-pair__caption', t(labelKey));
    item.append(caption, measuresIllustration(`${heading} – ${t(labelKey)}`, vehicleType));
    row.append(item);
  }
  return row;
}

interface HelpPanel {
  element: HTMLElement;
  /** Fold every topic but the first one. */
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
    const body = buildTopicBody(topic, go, hasTarget);
    const button = buildTopicToggle(topic, body);
    button.addEventListener('click', () => show(body.hidden ? topic.id : null));
    const heading = createElement('h3', 'help-topic__heading');
    heading.append(button);
    const section = createElement('section', 'help-topic');
    section.dataset.topic = topic.id;
    section.append(heading, body);
    panel.append(section);
    toggles.set(topic.id, { button, body });
  }
  panel.append(introButton);

  const reset = () => show(FIRST_OPEN);
  reset();
  return { element: panel, reset };
}

function buildTopicToggle(topic: Topic, body: HTMLElement): HTMLButtonElement {
  const toggle = button('help-topic__toggle', t(topic.h));
  toggle.setAttribute('aria-controls', body.id);
  return toggle;
}

/** The lead, the picture, the text, the caravan line, the closing line and
 * the button to the setting, each only where the topic has one. */
function buildTopicBody(
  topic: Topic,
  go: (target: HelpTarget | 'feedback') => void,
  hasTarget: (target: HelpTarget | 'feedback') => boolean,
): HTMLElement {
  const body = createElement('div', 'help-topic__body');
  body.id = `help-topic-${topic.id}`;
  if (topic.lead) body.append(textLine(topic.lead));
  if (topic.picture) body.append(topic.picture(t(topic.h)));
  body.append(textLine(topic.text, topic.textVars?.()));
  if (topic.caravanLine) body.append(textLine(topic.caravanLine));
  if (topic.closing) body.append(textLine(topic.closing));
  if (topic.go && hasTarget(topic.go.target)) {
    const target = topic.go.target;
    const secondary = 'menu__action menu__action--secondary help-topic__go';
    body.append(button(secondary, topic.go.label(), () => go(target)));
  }
  return body;
}

function textLine(key: MessageKey, vars?: Record<string, string>): HTMLParagraphElement {
  return paragraph('menu__text', t(key, vars));
}

export function createInfoPage(options: InfoPageOptions): InfoPage {
  // Assigned below; only called from a later reopen.
  let refreshIntroButton: () => void = () => {};
  let resetHelp: () => void = () => {};
  const page = createStandalonePage(t('menu.help'), () => {
    tabs.select('help');
    resetHelp();
    // The wizard may have been completed since this page was last open.
    refreshIntroButton();
  });
  const tabs = createInfoTabs(page);

  const introButton = buildIntroButton(page, options.openOnboarding, options.hasDoneOnboarding);
  refreshIntroButton = introButton.refresh;
  const helpPanel = buildHelpPanel(
    introButton.element,
    (target) => {
      // Other targets are pages, opened once this one's close has landed.
      if (target === 'feedback') tabs.select('feedback');
      else page.close(() => options.openTarget?.(target));
    },
    (target) => target === 'feedback' || options.openTarget !== undefined,
  );
  resetHelp = helpPanel.reset;
  tabs.add('help', helpPanel.element);
  tabs.add('about', createAboutSection());
  tabs.add('feedback', createFeedbackSection(options.onFeedbackSent));
  const privacy = createPrivacy(page, options);
  tabs.add('privacy', privacy.element, privacy.refresh);
  tabs.select('help');

  page.body.append(tabs.bar, ...tabs.panels.values());
  return {
    element: page.element,
    isOpen: page.isOpen,
    open: page.open,
    attach: page.attach,
  };
}

/** "Reset only the settings" opens General, where that button is, once this
 * page has closed. */
function createPrivacy(page: StandalonePage, options: InfoPageOptions) {
  const { openTarget } = options;
  return createPrivacyPanel({
    ...options.storedData,
    openSettings: openTarget && (() => page.close(() => openTarget('general'))),
  });
}

/** The tabs; selecting one also retitles the page, and refreshes a panel
 * that shows live state. */
function createInfoTabs(page: StandalonePage) {
  const bar = createElement('div', 'settings__tabs');
  bar.setAttribute('role', 'tablist');
  const labels: Record<InfoTab, string> = {
    help: t('menu.help'),
    about: t('menu.about.tab'),
    feedback: t('menu.feedback'),
    privacy: t('menu.privacy.tab'),
  };
  // The header spells out the full name ("About Libell", not "About").
  const titles: Record<InfoTab, string> = {
    help: t('menu.help'),
    about: t('menu.about'),
    feedback: t('menu.feedback'),
    privacy: t('menu.privacy'),
  };
  const buttons = new Map<InfoTab, HTMLButtonElement>();
  const panels = new Map<InfoTab, HTMLElement>();
  const onSelect = new Map<InfoTab, () => void>();

  function select(id: InfoTab): void {
    for (const [tid, btn] of buttons) btn.setAttribute('aria-selected', String(tid === id));
    for (const [tid, panel] of panels) panel.hidden = tid !== id;
    page.setTitle(titles[id]);
    onSelect.get(id)?.();
  }
  function add(id: InfoTab, panel: HTMLElement, refresh?: () => void): void {
    if (refresh) onSelect.set(id, refresh);
    const btn = button('settings__tab', labels[id], () => select(id));
    btn.setAttribute('role', 'tab');
    btn.dataset.tab = id;
    bar.append(btn);
    buttons.set(id, btn);
    panel.classList.add('settings__tabpanel');
    panels.set(id, panel);
  }
  return { bar, panels, add, select };
}
