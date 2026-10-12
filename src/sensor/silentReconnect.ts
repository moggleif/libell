/**
 * Whether to offer the tip for turning on silent reconnect: a Chromium
 * browser that has Web Bluetooth but no `navigator.bluetooth.getDevices()`,
 * which Chrome on Android keeps behind `chrome://flags` ("Use the new
 * permissions backend for Web Bluetooth"). Never on iPhone or iPad: every
 * browser there (Bluefy too) is WebKit and has no `chrome://flags`. A
 * browser with no Web Bluetooth at all gets false: the tip could not help.
 */
export function offersSilentReconnectTip(
  nav:
    { bluetooth?: { getDevices?: unknown }; userAgent?: string } | undefined = typeof navigator ===
  'undefined'
    ? undefined
    : (navigator as { bluetooth?: { getDevices?: unknown }; userAgent?: string }),
): boolean {
  const bluetooth = nav?.bluetooth;
  const userAgent = nav?.userAgent ?? '';
  const chromium = /Chrome\//.test(userAgent) && !/iphone|ipad|ipod/i.test(userAgent);
  return chromium && bluetooth !== undefined && typeof bluetooth.getDevices !== 'function';
}

/** The address the tip points at; a page cannot link to it, only copy it. */
export const CHROME_FLAGS_ADDRESS = 'chrome://flags';
