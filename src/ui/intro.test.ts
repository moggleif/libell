// @vitest-environment happy-dom
//
// The first-visit intro (#691): what Libell is and what you do with it,
// before the guide, with Install when the browser offers it and a way past
// the guide altogether.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLanguage, t } from './i18n';
import type { InstallKind, InstallOffer } from './install';
import { showIntro } from './intro';

setLanguage('en');

function fakeOffer(initial: InstallKind | null) {
  let kind = initial;
  const listeners: (() => void)[] = [];
  const offer: InstallOffer = {
    kind: () => kind,
    install: vi.fn(() => kind),
    onChange: (listener) => void listeners.push(listener),
  };
  const change = (next: InstallKind | null) => {
    kind = next;
    listeners.forEach((listener) => listener());
  };
  return { offer, change };
}

function open(kind: InstallKind | null = null) {
  const { offer, change } = fakeOffer(kind);
  const onStart = vi.fn();
  const onLookAround = vi.fn();
  showIntro({ install: offer, onStart, onLookAround });
  return { offer, change, onStart, onLookAround };
}

const intro = () => document.querySelector<HTMLElement>('.intro');

function button(label: string): HTMLButtonElement | undefined {
  return [...intro()!.querySelectorAll('button')].find((b) => b.textContent === label);
}

const installButton = () => button(t('topbar.install'))!;
const hint = () => intro()!.querySelector<HTMLElement>('.intro__hint')!;

afterEach(() => {
  document.body.replaceChildren();
});

describe('showIntro', () => {
  it('says what Libell is and what you do with it, as a labelled dialog with focus on its heading', () => {
    open();
    const dialog = intro()!;
    expect(dialog.getAttribute('role')).toBe('dialog');
    const heading = dialog.querySelector('#intro-heading')!;
    expect(dialog.getAttribute('aria-labelledby')).toBe('intro-heading');
    expect(heading.textContent).toBe(t('intro.h'));
    expect(document.activeElement).toBe(heading);
    expect(dialog.textContent).toContain(t('about.text'));
    expect(dialog.textContent).toContain(t('intro.how'));
    // No step counter: this is not a guide step.
    expect(dialog.textContent).not.toMatch(/\d+ \/ \d+/);
  });

  it('"Get started" closes the intro and hands over to the guide', () => {
    const { onStart, onLookAround } = open();
    button(t('intro.start'))!.click();
    expect(intro()).toBeNull();
    expect(onStart).toHaveBeenCalledOnce();
    expect(onLookAround).not.toHaveBeenCalled();
  });

  it('"Look around first" closes the intro without the guide', () => {
    const { onStart, onLookAround } = open();
    button(t('intro.later'))!.click();
    expect(intro()).toBeNull();
    expect(onLookAround).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('keeps the rest of the page out of reach while open, and gives it back on close', () => {
    const behind = document.createElement('main');
    document.body.append(behind);
    open();
    expect(behind.hasAttribute('inert')).toBe(true);
    button(t('intro.start'))!.click();
    expect(behind.hasAttribute('inert')).toBe(false);
  });

  it('hides Install while the browser offers nothing, and shows it once the offer arrives', () => {
    const { change } = open(null);
    expect(installButton().hidden).toBe(true);
    change('prompt');
    expect(installButton().hidden).toBe(false);
  });

  it('Install replays the browser offer', () => {
    const { offer } = open('prompt');
    installButton().click();
    expect(offer.install).toHaveBeenCalledOnce();
    expect(hint().hidden).toBe(true);
  });

  it('on iOS, Install toggles the Add to Home Screen hint', () => {
    open('hint');
    expect(hint().hidden).toBe(true);
    expect(hint().textContent).toBe(t('install.hint'));
    installButton().click();
    expect(hint().hidden).toBe(false);
    installButton().click();
    expect(hint().hidden).toBe(true);
  });

  it('drops Install and its hint once the app is installed', () => {
    const { change } = open('hint');
    installButton().click();
    change(null);
    expect(installButton().hidden).toBe(true);
    expect(hint().hidden).toBe(true);
  });
});
