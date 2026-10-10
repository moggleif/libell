import { describe, expect, it } from 'vitest';
import { offersSilentReconnectTip } from './silentReconnect';

const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const IPHONE_BLUEFY =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1';

describe('offersSilentReconnectTip (#310)', () => {
  it('is true for Chrome with Web Bluetooth but no getDevices, as on Android by default', () => {
    expect(offersSilentReconnectTip({ bluetooth: {}, userAgent: ANDROID_CHROME })).toBe(true);
  });

  it('is false once the browser offers getDevices', () => {
    expect(
      offersSilentReconnectTip({
        bluetooth: { getDevices: () => Promise.resolve([]) },
        userAgent: ANDROID_CHROME,
      }),
    ).toBe(false);
  });

  it('is false with no Web Bluetooth at all, where the tip could not help', () => {
    expect(offersSilentReconnectTip({ userAgent: ANDROID_CHROME })).toBe(false);
    expect(offersSilentReconnectTip(undefined)).toBe(false);
  });

  it('is false on iPhone and iPad, where chrome://flags does not exist — Bluefy included', () => {
    expect(offersSilentReconnectTip({ bluetooth: {}, userAgent: IPHONE_BLUEFY })).toBe(false);
    expect(offersSilentReconnectTip({ bluetooth: {}, userAgent: IPHONE_CHROME })).toBe(false);
  });
});
