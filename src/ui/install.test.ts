// @vitest-environment happy-dom
//
// Installing the app (#512, #691): Chromium's deferred prompt is replayed on
// tap; iOS, which has no prompt, shows the "Add to Home Screen" hint instead.
// One offer serves both the intro and the install row under the top bar.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ ios: false }));
vi.mock('./platform', () => ({ isIos: () => platform.ios }));

const { createInstallOffer, setupInstallRow } = await import('./install');

function standalone(matches: boolean): void {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as MediaQueryList);
}

function offer() {
  const add = vi.spyOn(window, 'addEventListener');
  const created = createInstallOffer();
  const fire = (type: string, event: Event = new Event(type)) => {
    for (const [name, listener] of add.mock.calls) {
      if (name === type) (listener as EventListener)(event);
    }
  };
  return { offer: created, fire };
}

function installPrompt() {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  return Object.assign(event, {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  });
}

function row() {
  const els = {
    row: document.createElement('div'),
    button: document.createElement('button'),
    hint: document.createElement('p'),
    close: document.createElement('button'),
  };
  els.row.hidden = true;
  els.hint.hidden = true;
  return els;
}

beforeEach(() => {
  platform.ios = false;
  standalone(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createInstallOffer', () => {
  it('offers nothing until the browser offers to install, then replays that offer once', () => {
    const { offer: install, fire } = offer();
    const changed = vi.fn();
    install.onChange(changed);
    expect(install.kind()).toBeNull();
    const event = installPrompt();
    fire('beforeinstallprompt', event);
    expect(event.defaultPrevented).toBe(true);
    expect(install.kind()).toBe('prompt');
    expect(changed).toHaveBeenCalledTimes(1);
    expect(install.install()).toBe('prompt');
    expect(event.prompt).toHaveBeenCalledOnce();
    // Single-use: Chromium refires the event if the dialog is dismissed.
    expect(install.kind()).toBeNull();
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('on iOS offers the Add to Home Screen hint', () => {
    platform.ios = true;
    const { offer: install } = offer();
    expect(install.kind()).toBe('hint');
    expect(install.install()).toBe('hint');
    expect(install.kind()).toBe('hint');
  });

  it('offers nothing once the app is installed', () => {
    platform.ios = true;
    const { offer: install, fire } = offer();
    const changed = vi.fn();
    install.onChange(changed);
    fire('appinstalled');
    expect(install.kind()).toBeNull();
    expect(changed).toHaveBeenCalledOnce();
  });

  it('offers nothing when already running as the installed app', () => {
    platform.ios = true;
    standalone(true);
    const { offer: install, fire } = offer();
    fire('beforeinstallprompt', installPrompt());
    expect(install.kind()).toBeNull();
    expect(install.install()).toBeNull();
  });
});

describe('setupInstallRow', () => {
  function dismissal(dismissed = false) {
    return { isDismissed: () => dismissed, dismiss: vi.fn() };
  }

  it('shows the row once the browser offers to install, and replays that offer on tap', () => {
    const { offer: install, fire } = offer();
    const els = row();
    setupInstallRow(els, install, dismissal());
    expect(els.row.hidden).toBe(true);
    const event = installPrompt();
    fire('beforeinstallprompt', event);
    expect(els.row.hidden).toBe(false);
    els.button.click();
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(els.row.hidden).toBe(true);
  });

  it('on iOS shows the row and toggles the Add to Home Screen hint', () => {
    platform.ios = true;
    const { offer: install } = offer();
    const els = row();
    setupInstallRow(els, install, dismissal());
    expect(els.row.hidden).toBe(false);
    els.button.click();
    expect(els.hint.hidden).toBe(false);
    els.button.click();
    expect(els.hint.hidden).toBe(true);
  });

  it('hides the row and the hint once the app is installed', () => {
    platform.ios = true;
    const { offer: install, fire } = offer();
    const els = row();
    setupInstallRow(els, install, dismissal());
    els.button.click();
    fire('appinstalled');
    expect(els.row.hidden).toBe(true);
    expect(els.hint.hidden).toBe(true);
  });

  it('✕ hides the row for good, and remembers it', () => {
    platform.ios = true;
    const { offer: install } = offer();
    const els = row();
    const remembered = dismissal();
    setupInstallRow(els, install, remembered);
    els.close.click();
    expect(els.row.hidden).toBe(true);
    expect(remembered.dismiss).toHaveBeenCalledOnce();
  });

  it('stays hidden after an earlier ✕, even when the browser offers to install', () => {
    const { offer: install, fire } = offer();
    const els = row();
    setupInstallRow(els, install, dismissal(true));
    fire('beforeinstallprompt', installPrompt());
    expect(els.row.hidden).toBe(true);
  });

  // A row that appears pushes the page down; behind the first-visit overlay
  // nobody sees it, but the page still moves (#730).
  it('waits while an overlay holds the page, then shows once it is released', async () => {
    const { offer: install, fire } = offer();
    const els = row();
    els.row.setAttribute('inert', '');
    setupInstallRow(els, install, dismissal());
    fire('beforeinstallprompt', installPrompt());
    expect(els.row.hidden).toBe(true);
    els.row.removeAttribute('inert');
    await Promise.resolve();
    expect(els.row.hidden).toBe(false);
  });

  it('stays shown when an overlay opens over it', async () => {
    platform.ios = true;
    const { offer: install } = offer();
    const els = row();
    setupInstallRow(els, install, dismissal());
    els.row.setAttribute('inert', '');
    await Promise.resolve();
    expect(els.row.hidden).toBe(false);
  });
});
