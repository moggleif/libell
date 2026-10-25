// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { showCountingChoice } from './countingChoice';
import { t } from './i18n';

const overlay = () => document.querySelector<HTMLElement>('.counting-choice');

function buttonLabelled(label: string): HTMLButtonElement {
  const found = [...overlay()!.querySelectorAll('button')].find((b) => b.textContent === label);
  if (!found) throw new Error(`no button "${label}"`);
  return found;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('showCountingChoice (#699)', () => {
  it('is one modal screen that asks, says what is counted, and has two equal choices', () => {
    showCountingChoice({ onChoose: vi.fn() });
    const screen = overlay()!;
    expect(screen.getAttribute('role')).toBe('dialog');
    expect(screen.getAttribute('aria-modal')).toBe('true');
    expect(screen.textContent).toContain(t('counting.sent.h'));
    expect(screen.textContent).toContain(t('counting.notSent.h'));
    expect(screen.querySelector('h2')?.textContent).toBe(t('counting.ask'));
    const yes = buttonLabelled(t('counting.yes'));
    const no = buttonLabelled(t('counting.no'));
    expect(yes.className).toBe(no.className);
    expect(screen.querySelector('input')).toBeNull();
  });

  it('keeps the rest of the app out of reach until a choice is made', () => {
    const app = document.createElement('main');
    document.body.append(app);
    showCountingChoice({ onChoose: vi.fn() });
    expect(app.hasAttribute('inert')).toBe(true);
    buttonLabelled(t('counting.no')).click();
    expect(app.hasAttribute('inert')).toBe(false);
  });

  it.each([
    ['counting.yes', true],
    ['counting.no', false],
  ] as const)('%s closes the screen and passes the choice on', (key, on) => {
    const onChoose = vi.fn();
    showCountingChoice({ onChoose });
    buttonLabelled(t(key)).click();
    expect(onChoose).toHaveBeenCalledExactlyOnceWith(on);
    expect(overlay()).toBeNull();
  });
});
