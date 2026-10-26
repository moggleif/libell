// @vitest-environment happy-dom
//
// The share button's fallback chain (#512): share sheet, else clipboard
// with a toast, else the address itself in a toast.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLanguage, t } from './i18n';
import { appUrl, setupShareButton, shareOrCopyLink } from './share';

setLanguage('en');

const URL_ = 'https://example.test/libell/';

function useNavigator(value: Partial<Navigator>): void {
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true });
}

function toasts(): string[] {
  return [...document.querySelectorAll('.toast')].map((e) => e.textContent ?? '');
}

const realNavigator = globalThis.navigator;

beforeEach(() => {
  document.body.replaceChildren();
});

afterEach(() => {
  Object.defineProperty(globalThis, 'navigator', { value: realNavigator, configurable: true });
});

describe('shareOrCopyLink', () => {
  it('opens the share sheet with the address where there is one', async () => {
    const share = vi.fn(() => Promise.resolve());
    const writeText = vi.fn(() => Promise.resolve());
    useNavigator({ share, clipboard: { writeText } as unknown as Clipboard });
    await shareOrCopyLink(URL_, 'Level your RV');
    expect(share).toHaveBeenCalledWith({ title: 'Libell', text: 'Level your RV', url: URL_ });
    expect(writeText).not.toHaveBeenCalled();
    expect(toasts()).toEqual([]);
  });

  it('does nothing more when the user closes the share sheet', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    useNavigator({
      share: vi.fn(() => Promise.reject(new DOMException('cancelled', 'AbortError'))),
      clipboard: { writeText } as unknown as Clipboard,
    });
    await shareOrCopyLink(URL_, 'Level your RV');
    expect(writeText).not.toHaveBeenCalled();
    expect(toasts()).toEqual([]);
  });

  it('copies the address and says so where there is no share sheet', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    useNavigator({ clipboard: { writeText } as unknown as Clipboard });
    await shareOrCopyLink(URL_, 'Level your RV');
    expect(writeText).toHaveBeenCalledWith(URL_);
    expect(toasts()).toEqual([t('share.copied')]);
  });

  it('shows the address itself when the clipboard refuses too', async () => {
    useNavigator({
      clipboard: { writeText: () => Promise.reject(new Error('denied')) } as unknown as Clipboard,
    });
    await shareOrCopyLink(URL_, 'Level your RV');
    expect(toasts()).toEqual([URL_]);
  });
});

describe('setupShareButton (#713)', () => {
  it('names the button and shares the app address with the share text', async () => {
    const share = vi.fn(() => Promise.resolve());
    useNavigator({ share });
    const button = document.createElement('button');
    setupShareButton(button);
    expect(button.getAttribute('aria-label')).toBe(t('topbar.share'));
    expect(button.title).toBe(t('topbar.share'));
    button.click();
    await Promise.resolve();
    expect(share).toHaveBeenCalledWith({ title: 'Libell', text: t('share.text'), url: appUrl() });
  });
});
