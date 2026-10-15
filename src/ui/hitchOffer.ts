/**
 * "Save the hitch height first?" (#598): one quiet line on a caravan's
 * main screen while none is saved, since forgetting to save it before
 * unhitching is how hitch memory usually fails. It never blocks leveling,
 * and goes away once saved or dismissed.
 */
import { createElement } from './dom';
import { t } from './i18n';
import { showToast } from './toast';

export interface HitchOfferOptions {
  isDue(): boolean;
  /** Null when saved, or the message to show instead. */
  save(): string | null;
  dismiss(): void;
}

export interface HitchOffer {
  element: HTMLElement;
  refresh(): void;
}

function linkButton(text: string, onClick: () => void): HTMLButtonElement {
  const button = createElement('button', 'link-button');
  button.type = 'button';
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

export function createHitchOffer(options: HitchOfferOptions): HitchOffer {
  const element = createElement('p', 'hitch-offer');
  const text = createElement('span', 'hitch-offer__text');
  text.textContent = t('hitch.offer');
  const refresh = () => void (element.hidden = !options.isDue());
  const save = linkButton(t('hitch.offer.save'), () => {
    showToast(options.save() ?? t('hitch.savedNow'));
    refresh();
  });
  const dismiss = linkButton(t('hitch.offer.dismiss'), () => {
    options.dismiss();
    refresh();
  });
  element.append(text, save, dismiss);
  refresh();
  return { element, refresh };
}
