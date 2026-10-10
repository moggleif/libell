import { describe, expect, it } from 'vitest';
import { lacksSilentReconnect } from './silentReconnect';

describe('lacksSilentReconnect (#310)', () => {
  it('is true for Web Bluetooth without getDevices, as on Chrome for Android by default', () => {
    expect(lacksSilentReconnect({ bluetooth: {} })).toBe(true);
  });

  it('is false once the browser offers getDevices', () => {
    expect(lacksSilentReconnect({ bluetooth: { getDevices: () => Promise.resolve([]) } })).toBe(
      false,
    );
  });

  it('is false with no Web Bluetooth at all, where the tip could not help', () => {
    expect(lacksSilentReconnect({})).toBe(false);
    expect(lacksSilentReconnect(undefined)).toBe(false);
  });
});
