import { afterEach, describe, expect, it, vi } from 'vitest';
import { isIos } from './platform';

function setUserAgent(ua: string): void {
  vi.stubGlobal('navigator', { ...navigator, userAgent: ua });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isIos', () => {
  it('is true for iPhone/iPad/iPod user agents', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)');
    expect(isIos()).toBe(true);
    setUserAgent('Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X)');
    expect(isIos()).toBe(true);
  });

  it('is false for Android/desktop user agents', () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8)');
    expect(isIos()).toBe(false);
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(isIos()).toBe(false);
  });
});
