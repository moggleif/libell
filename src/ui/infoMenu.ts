/**
 * Info page behind the "?" button: Help / About / Feedback as tabs.
 *
 * It owns no shared navigation state: sharing the menu's history depth let
 * back land one level up, revealing a Settings drawer the user never opened.
 * Switching tabs is local UI state, not a history entry, and the page's own
 * single history entry can only ever close itself.
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
import { createElement } from './dom';

/** `main.ts` maps each to the right Settings tab or the sensor page. */
export type HelpTarget = 'vehicle' | 'ramps' | 'calibration' | 'targets' | 'sensor';

export interface InfoPageOptions {
  openOnboarding(): void;
  /**
   * True once the wizard was stepped through to the end, not merely opened
   * and dismissed early.
   */
  hasDoneOnboarding(): boolean;
  /** Called after this page has closed. Without it, topics show no buttons. */
  openTarget?(target: HelpTarget): void;
}

export interface InfoPage {
  element: HTMLElement;
  isOpen(): boolean;
  attach(button: HTMLButtonElement): void;
}

type InfoTab = 'help' | 'about' | 'feedback';

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
  /** A line for what only applies to a caravan. */
  caravanLine?: MessageKey;
  /** A last line, after the caravan line. */
  closing?: MessageKey;
  picture?: (label: string) => Element;
  go?: { label: () => string; target: HelpTarget | 'feedback' };
}

const openTab = (tab: MessageKey) => () => t('help.open', { name: t(tab) });

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
    const caption = createElement('p', 'illu-pair__caption');
    caption.textContent = t(labelKey);
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
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'help-topic__toggle';
  button.textContent = t(topic.h);
  button.setAttribute('aria-controls', body.id);
  return button;
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
  body.append(textLine(topic.text));
  if (topic.caravanLine) body.append(textLine(topic.caravanLine));
  if (topic.closing) body.append(textLine(topic.closing));
  if (topic.go && hasTarget(topic.go.target)) {
    const target = topic.go.target;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'menu__action menu__action--secondary help-topic__go';
    action.textContent = topic.go.label();
    action.addEventListener('click', () => go(target));
    body.append(action);
  }
  return body;
}

function textLine(key: MessageKey): HTMLParagraphElement {
  const line = createElement('p', 'menu__text');
  line.textContent = t(key);
  return line;
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
  tabs.add('feedback', createFeedbackSection());
  tabs.select('help');

  page.body.append(tabs.bar, ...tabs.panels.values());
  return {
    element: page.element,
    isOpen: page.isOpen,
    attach: page.attach,
  };
}

/** Help, About and Feedback as tabs; selecting one also retitles the page. */
function createInfoTabs(page: StandalonePage) {
  const bar = createElement('div', 'settings__tabs');
  bar.setAttribute('role', 'tablist');
  const labels: Record<InfoTab, string> = {
    help: t('menu.help'),
    about: t('menu.about.tab'),
    feedback: t('menu.feedback'),
  };
  // The header spells out the full name ("About Libell", not "About").
  const titles: Record<InfoTab, string> = {
    help: t('menu.help'),
    about: t('menu.about'),
    feedback: t('menu.feedback'),
  };
  const buttons = new Map<InfoTab, HTMLButtonElement>();
  const panels = new Map<InfoTab, HTMLElement>();

  function select(id: InfoTab): void {
    for (const [tid, btn] of buttons) btn.setAttribute('aria-selected', String(tid === id));
    for (const [tid, panel] of panels) panel.hidden = tid !== id;
    page.setTitle(titles[id]);
  }
  function add(id: InfoTab, panel: HTMLElement): void {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'settings__tab';
    btn.setAttribute('role', 'tab');
    btn.dataset.tab = id;
    btn.textContent = labels[id];
    btn.addEventListener('click', () => select(id));
    bar.append(btn);
    buttons.set(id, btn);
    panel.classList.add('settings__tabpanel');
    panels.set(id, panel);
  }
  return { bar, panels, add, select };
}
