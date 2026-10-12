// @vitest-environment happy-dom
//
// Pins the box password block (#367, #417) through its options and the
// DOM it builds: hidden unless the box rejected its code, the four-digit
// check, and the message each verdict leaves.
import { describe, expect, it, vi } from 'vitest';
import { createBoxPasswordBlock } from './boxPasswordBlock';
import { setLanguage, t } from './i18n';

setLanguage('en');

function build(rejected = true) {
  let isRejected = rejected;
  let answer: (verdict: boolean | null) => void = () => {};
  const tryPassword = vi.fn(
    (_code: string) =>
      new Promise<boolean | null>((resolve) => {
        answer = (verdict) => {
          if (verdict === true) isRejected = false;
          resolve(verdict);
        };
      }),
  );
  const block = createBoxPasswordBlock(
    { isRejected: () => isRejected, tryPassword },
    'Xparkle RVS01',
  );
  const { element } = block;
  const input = element.querySelector<HTMLInputElement>('input')!;
  const button = element.querySelector<HTMLButtonElement>('button')!;
  const status = element.querySelector<HTMLElement>('.box-password__status')!;
  return {
    block,
    element,
    input,
    button,
    status,
    tryPassword,
    answer: async (verdict: boolean | null) => {
      answer(verdict);
      await Promise.resolve();
      await Promise.resolve();
    },
    setRejected: (value: boolean) => {
      isRejected = value;
    },
  };
}

function enter(input: HTMLInputElement, button: HTMLButtonElement, code: string): void {
  input.value = code;
  button.click();
}

describe('createBoxPasswordBlock', () => {
  it('is hidden while the box has not rejected its code', () => {
    expect(build(false).element.hidden).toBe(true);
  });

  it('shows what happened, a four-digit code field and Try again when rejected', () => {
    const { element, input, button, status } = build();
    expect(element.hidden).toBe(false);
    expect(element.querySelector('.menu__text--warning')!.textContent).toBe(
      t('sensorSource.err.password', { name: 'Xparkle RVS01' }),
    );
    expect(element.querySelector('.box-password__field > span')!.textContent).toBe(
      t('box.password.label'),
    );
    expect(input.inputMode).toBe('numeric');
    expect(input.maxLength).toBe(4);
    expect(input.autocomplete).toBe('off');
    expect(button.textContent).toBe(t('box.password.retry'));
    expect(button.disabled).toBe(false);
    expect(status.hidden).toBe(true);
  });

  it('follows the box on refresh', () => {
    const { block, setRejected } = build(false);
    setRejected(true);
    block.refresh();
    expect(block.element.hidden).toBe(false);
    setRejected(false);
    block.refresh();
    expect(block.element.hidden).toBe(true);
  });

  it('says what a code looks like instead of trying anything that is not four digits', () => {
    const { input, button, status, tryPassword } = build();
    for (const code of ['', '123', '12345', 'abcd']) {
      enter(input, button, code);
      expect(status.hidden).toBe(false);
      expect(status.textContent).toBe(t('box.password.invalid'));
    }
    expect(tryPassword).not.toHaveBeenCalled();
  });

  it('trims the code, says it is trying and disables the button meanwhile', () => {
    const { input, button, status, tryPassword } = build();
    enter(input, button, ' 1234 ');
    expect(tryPassword).toHaveBeenCalledExactlyOnceWith('1234');
    expect(status.textContent).toBe(t('box.password.checking'));
    expect(button.disabled).toBe(true);
  });

  it('an accepted code clears the field and the block hides', async () => {
    const { element, input, button, status, answer } = build();
    enter(input, button, '1234');
    await answer(true);
    expect(input.value).toBe('');
    expect(status.hidden).toBe(true);
    expect(button.disabled).toBe(false);
    expect(element.hidden).toBe(true);
  });

  it('a rejected code says so and keeps what was typed', async () => {
    const { element, input, button, status, answer } = build();
    enter(input, button, '9999');
    await answer(false);
    expect(status.textContent).toBe(t('box.password.wrong'));
    expect(input.value).toBe('9999');
    expect(button.disabled).toBe(false);
    expect(element.hidden).toBe(false);
  });

  it('no answer says so, and stays shown even if the box is no longer rejecting', async () => {
    const { block, input, button, status, answer, setRejected } = build();
    enter(input, button, '1234');
    setRejected(false);
    await answer(null);
    expect(status.textContent).toBe(t('box.password.noAnswer'));
    block.refresh();
    expect(block.element.hidden).toBe(false);
  });
});
