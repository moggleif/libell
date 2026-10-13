// @vitest-environment happy-dom
//
// The Install button (#512): Chromium's deferred prompt is replayed on tap;
// iOS, which has no prompt, toggles the "Add to Home Screen" hint instead.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ ios: false }));
vi.mock('./platform', () => ({ isIos: () => platform.ios }));

const { setupInstallButton } = await import('./install');

function standalone(matches: boolean): void {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as MediaQueryList);
}

function setup() {
  const button = document.createElement('button');
  const hint = document.createElement('p');
  button.hidden = true;
  hint.hidden = true;
  const add = vi.spyOn(window, 'addEventListener');
  setupInstallButton(button, hint);
  const fire = (type: string, event: Event = new Event(type)) => {
    for (const [name, listener] of add.mock.calls) {
      if (name === type) (listener as EventListener)(event);
    }
  };
  return { button, hint, fire };
}

function installPrompt() {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  return Object.assign(event, {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  });
}

beforeEach(() => {
  platform.ios = false;
  standalone(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('setupInstallButton', () => {
  it('shows the button once the browser offers to install, and replays that offer on tap', () => {
    const { button, fire } = setup();
    expect(button.hidden).toBe(true);
    const event = installPrompt();
    fire('beforeinstallprompt', event);
    expect(event.defaultPrevented).toBe(true);
    expect(button.hidden).toBe(false);
    button.click();
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(button.hidden).toBe(true);
  });

  it('on iOS shows the button and toggles the Add to Home Screen hint', () => {
    platform.ios = true;
    const { button, hint } = setup();
    expect(button.hidden).toBe(false);
    button.click();
    expect(hint.hidden).toBe(false);
    button.click();
    expect(hint.hidden).toBe(true);
  });

  it('hides the button and the hint once the app is installed', () => {
    platform.ios = true;
    const { button, hint, fire } = setup();
    button.click();
    fire('appinstalled');
    expect(button.hidden).toBe(true);
    expect(hint.hidden).toBe(true);
  });

  it('offers nothing when already running as the installed app', () => {
    platform.ios = true;
    standalone(true);
    const { button } = setup();
    expect(button.hidden).toBe(true);
  });
});
