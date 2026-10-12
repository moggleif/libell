/**
 * The way out of a rejected box password, in Libell rather than the vendor
 * app. Hidden nearly always: only a box whose code was changed elsewhere
 * rejects the factory one Libell offers.
 */
import { t } from './i18n';

export interface BoxPasswordOptions {
  isRejected(): boolean;
  /**
   * Stores `code` and offers it on the live link. Resolves true accepted,
   * false rejected, null when the box could not be asked; the code is kept
   * either way and offered on the next connect.
   */
  tryPassword(code: string): Promise<boolean | null>;
}

export interface BoxPasswordBlock {
  element: HTMLElement;
  refresh(): void;
}

export function createBoxPasswordBlock(
  options: BoxPasswordOptions,
  name: string,
): BoxPasswordBlock {
  const element = document.createElement('div');
  element.className = 'box-password';
  element.hidden = true;

  const message = document.createElement('p');
  message.className = 'menu__text menu__text--warning';
  message.textContent = t('sensorSource.err.password', { name });

  const field = document.createElement('label');
  field.className = 'settings__field box-password__field';
  const caption = document.createElement('span');
  caption.textContent = t('box.password.label');
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'numeric';
  input.autocomplete = 'off';
  input.maxLength = 4;
  input.className = 'box-password__input';
  field.append(caption, input);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu__action';
  button.textContent = t('box.password.retry');

  const status = document.createElement('p');
  status.className = 'menu__text box-password__status';
  status.hidden = true;

  element.append(message, field, button, status);

  let trying = false;

  function say(text: string | null): void {
    status.hidden = text === null;
    status.textContent = text ?? '';
  }

  function refresh(): void {
    // Kept open while a verdict is on its way or still being shown, so the
    // answer to a tap never vanishes before it is read.
    element.hidden = !options.isRejected() && !trying && status.hidden;
    button.disabled = trying;
  }

  button.addEventListener('click', () => {
    const code = input.value.trim();
    if (!/^\d{4}$/.test(code)) {
      say(t('box.password.invalid'));
      refresh();
      return;
    }
    trying = true;
    say(t('box.password.checking'));
    refresh();
    void options.tryPassword(code).then((verdict) => {
      trying = false;
      if (verdict === true) {
        input.value = '';
        say(null);
      } else {
        say(t(verdict === false ? 'box.password.wrong' : 'box.password.noAnswer'));
      }
      refresh();
    });
  });

  refresh();
  return { element, refresh };
}
