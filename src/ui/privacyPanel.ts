/**
 * The Privacy tab (#678): what Libell has stored on this phone, in plain
 * words and, for the curious, exactly as stored; and "Delete all Libell
 * data" at the bottom, after one confirmation.
 */
import { maskSecrets, type StoredEntry } from '../data/storedData';
import { createCountingSection, type CountingChoice } from './countingSection';
import { createElement } from './dom';
import { t } from './i18n';
import { storedRows } from './storedDataText';

export interface PrivacyPanelOptions {
  read(): StoredEntry[];
  /** Removes everything and starts the app again as on first run. */
  deleteAll(): void;
  /** "Reset only the settings": opens the place where that button is. */
  openSettings?(): void;
  /** Anonymous counting's switch, shown under the stored data (#674). */
  counting: CountingChoice;
}

export interface PrivacyPanel {
  element: HTMLElement;
  /** Reads the storage again and folds the confirmation away. */
  refresh(): void;
}

function textElement(
  tag: keyof HTMLElementTagNameMap,
  className: string,
  content: string,
): HTMLElement {
  const element = createElement(tag, className);
  element.textContent = content;
  return element;
}

function button(className: string, label: string, onClick: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  element.addEventListener('click', onClick);
  return element;
}

function fillSummary(list: HTMLElement, entries: StoredEntry[]): void {
  const rows = storedRows(entries);
  if (rows.length === 0) {
    list.replaceChildren(textElement('p', 'menu__text', t('privacy.stored.empty')));
    return;
  }
  list.replaceChildren(
    ...rows.map(({ label, detail }) => {
      const row = createElement('div', 'stored-data__row');
      row.append(
        textElement('dt', 'stored-data__label', label),
        textElement('dd', 'stored-data__detail', detail),
      );
      return row;
    }),
  );
}

/** Every key and its value as stored, the password masked, by key. */
function fillRaw(list: HTMLElement, entries: StoredEntry[]): void {
  const sorted = [...entries].sort((a, b) => a.key.localeCompare(b.key, 'en'));
  list.replaceChildren(
    ...sorted.map(({ key, value }) => {
      const item = createElement('li', 'stored-data__raw-item');
      item.append(
        textElement('code', 'stored-data__raw-key', key),
        textElement('pre', 'stored-data__raw-value', maskSecrets(value)),
      );
      return item;
    }),
  );
}

function createRaw(): { element: HTMLElement; list: HTMLElement } {
  const element = createElement('details', 'settings__advanced stored-data__raw');
  const list = createElement('ul', 'stored-data__raw-list');
  element.append(
    textElement('summary', 'settings__advanced-summary', t('privacy.raw')),
    textElement('p', 'settings__hint', t('privacy.raw.hint')),
    list,
  );
  return { element, list };
}

/** "Delete all Libell data", then a question with Yes and Cancel; nothing
 * is removed until Yes. */
function createDelete(deleteAll: () => void): { elements: HTMLElement[]; reset(): void } {
  const ask = button('menu__action menu__action--danger', t('privacy.deleteAll'), () => show(true));
  const question = textElement(
    'p',
    'menu__text menu__text--status',
    t('privacy.deleteAll.confirm'),
  );
  const yes = button('menu__action menu__action--danger', t('privacy.deleteAll.yes'), deleteAll);
  const cancel = button('menu__action menu__action--secondary', t('privacy.deleteAll.cancel'), () =>
    show(false),
  );
  const confirm = createElement('div', 'stored-data__confirm');
  confirm.setAttribute('role', 'group');
  confirm.append(question, yes, cancel);
  function show(asking: boolean): void {
    ask.hidden = asking;
    confirm.hidden = !asking;
    if (asking) yes.focus();
    else ask.focus();
  }
  const reset = () => {
    ask.hidden = false;
    confirm.hidden = true;
  };
  reset();
  return { elements: [ask, confirm], reset };
}

export function createPrivacyPanel(options: PrivacyPanelOptions): PrivacyPanel {
  const element = createElement('div', 'stored-data');
  const summary = createElement('dl', 'stored-data__list');
  const raw = createRaw();
  const remove = createDelete(options.deleteAll);
  element.append(
    textElement('p', 'menu__text', t('about.privacy')),
    textElement('h3', 'stored-data__heading', t('privacy.stored.h')),
    summary,
    raw.element,
    textElement('h3', 'stored-data__heading', t('counting.title')),
    // Switching stores the choice, so the list above reads the storage again.
    createCountingSection({
      isOn: options.counting.isOn,
      setOn(on) {
        options.counting.setOn(on);
        refresh();
      },
    }),
  );
  const { openSettings } = options;
  if (openSettings) {
    element.append(
      button('menu__action menu__action--secondary', t('privacy.resetSettings'), openSettings),
    );
  }
  element.append(...remove.elements);

  function refresh(): void {
    const entries = options.read();
    fillSummary(summary, entries);
    fillRaw(raw.list, entries);
    remove.reset();
  }
  refresh();
  return { element, refresh };
}
