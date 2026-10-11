/**
 * The way out of a rejected box password (#367), built in Libell rather
 * than sending the user to the vendor app: what happened, a field for the
 * box's four-digit code, and one button to try it. Hidden the rest of the
 * time, which is nearly always — only a box whose code was changed
 * elsewhere ever rejects the factory one Libell offers.
 *
 * Used twice from the same options: on the box's card (the list page and
 * the first-run wizard) and on the box's own page, so wherever the user
 * sees that the box said no, the fix is right there.
 */
import { t } from './i18n';

export interface BoxPasswordOptions {
  /** True while the box has rejected the code it was last offered. */
  isRejected(): boolean;
  /**
   * Store `code` as the box's password and offer it on the live link.
   * Resolves with the box's verdict: true accepted, false rejected, null
   * when it could not be asked (no box connected, or no answer in time) —
   * the code is kept either way and offered on the next connect.
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
    // Said, never refused silently: the user sees what a code looks like.
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
