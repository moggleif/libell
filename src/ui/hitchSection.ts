/**
 * The caravan's hitch height (#598), under the saved targets: save it while
 * the caravan still sits on the tow ball, then "Back to hitch height" lets
 * the jockey wheel lead back to it. Hidden for a motorhome. With nothing
 * saved, only the save button is offered: there is nothing to go back to.
 */
import { createElement } from './dom';
import { t } from './i18n';

export interface HitchOptions {
  isCaravan(): boolean;
  /** Null when none is saved. */
  savedPitch(): number | null;
  /** Null when saved, or the message to show instead. */
  save(): string | null;
  isActive(): boolean;
  start(): void;
  stop(): void;
}

export interface HitchSection {
  element: HTMLElement;
  refresh(): void;
}

function actionButton(text: string, className = 'menu__action'): HTMLButtonElement {
  const button = createElement('button', className);
  button.type = 'button';
  button.textContent = text;
  return button;
}

export function createHitchSection(options: HitchOptions): HitchSection {
  const element = createElement('div', 'hitch');
  const heading = createElement('p', 'settings__section');
  heading.textContent = t('hitch.title');
  const hint = createElement('p', 'menu__text');
  hint.textContent = t('hitch.hint');
  const status = createElement('p', 'menu__text menu__text--status');
  status.setAttribute('aria-live', 'polite');
  const save = actionButton(t('hitch.save'), 'menu__action menu__action--secondary');
  const go = actionButton(t('hitch.go'));
  const done = actionButton(t('hitch.done'));
  element.append(heading, hint, status, go, done, save);

  function refresh(message?: string): void {
    element.hidden = !options.isCaravan();
    const saved = options.savedPitch() !== null;
    const active = options.isActive();
    status.textContent = message ?? statusText(saved, active);
    go.hidden = !saved || active;
    done.hidden = !active;
  }
  save.addEventListener('click', () => refresh(options.save() ?? t('hitch.savedNow')));
  go.addEventListener('click', () => {
    options.start();
    refresh();
  });
  done.addEventListener('click', () => {
    options.stop();
    refresh();
  });
  refresh();
  return { element, refresh: () => refresh() };
}

function statusText(saved: boolean, active: boolean): string {
  if (active) return t('hitch.status.active');
  return t(saved ? 'hitch.status.saved' : 'hitch.status.none');
}
