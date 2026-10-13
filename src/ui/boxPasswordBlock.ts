/**
 * The way out of a rejected box password, in Libell rather than the vendor
 * app. Hidden nearly always: only a box whose code was changed elsewhere
 * rejects the factory one Libell offers.
 */
import { t } from './i18n';
import { createElement } from './dom';

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

/** The block's elements and whether a try is out; the functions below work
 * on one. */
interface PasswordBlock {
  readonly options: BoxPasswordOptions;
  readonly view: ReturnType<typeof createView>;
  trying: boolean;
}

export function createBoxPasswordBlock(
  options: BoxPasswordOptions,
  name: string,
): BoxPasswordBlock {
  const block: PasswordBlock = { options, view: createView(name), trying: false };
  block.view.button.addEventListener('click', () => tryCode(block));
  refresh(block);
  return { element: block.view.element, refresh: () => refresh(block) };
}

function createView(name: string) {
  const element = createElement('div', 'box-password');
  element.hidden = true;
  const message = createElement('p', 'menu__text menu__text--warning');
  message.textContent = t('sensorSource.err.password', { name });
  const { field, input } = createCodeField();
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu__action';
  button.textContent = t('box.password.retry');
  const status = createElement('p', 'menu__text box-password__status');
  status.hidden = true;
  element.append(message, field, button, status);
  return { element, input, button, status };
}

function createCodeField() {
  const field = createElement('label', 'settings__field box-password__field');
  const caption = document.createElement('span');
  caption.textContent = t('box.password.label');
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'numeric';
  input.autocomplete = 'off';
  input.maxLength = 4;
  input.className = 'box-password__input';
  field.append(caption, input);
  return { field, input };
}

function say(block: PasswordBlock, text: string | null): void {
  const { status } = block.view;
  status.hidden = text === null;
  status.textContent = text ?? '';
}

function refresh(block: PasswordBlock): void {
  const { element, button, status } = block.view;
  // Kept open while a verdict is on its way or still being shown, so the
  // answer to a tap never vanishes before it is read.
  element.hidden = !block.options.isRejected() && !block.trying && status.hidden;
  button.disabled = block.trying;
}

function tryCode(block: PasswordBlock): void {
  const { input } = block.view;
  const code = input.value.trim();
  if (!/^\d{4}$/.test(code)) {
    say(block, t('box.password.invalid'));
    refresh(block);
    return;
  }
  block.trying = true;
  say(block, t('box.password.checking'));
  refresh(block);
  void block.options.tryPassword(code).then((verdict) => {
    block.trying = false;
    if (verdict === true) {
      input.value = '';
      say(block, null);
    } else {
      say(block, t(verdict === false ? 'box.password.wrong' : 'box.password.noAnswer'));
    }
    refresh(block);
  });
}
