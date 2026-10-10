/**
 * Whether this browser has Web Bluetooth but cannot reconnect to a box
 * silently after a restart (#310). Silent reconnect needs
 * `navigator.bluetooth.getDevices()`, which Chrome on Android keeps behind
 * `chrome://flags` ("Use the new permissions backend for Web Bluetooth");
 * with the flag on, Libell reconnects on its own — found on hardware. A
 * browser with no Web Bluetooth at all gets false: the tip could not help.
 */
export function lacksSilentReconnect(
  nav: { bluetooth?: { getDevices?: unknown } } | undefined = typeof navigator === 'undefined'
    ? undefined
    : (navigator as { bluetooth?: { getDevices?: unknown } }),
): boolean {
  const bluetooth = nav?.bluetooth;
  return bluetooth !== undefined && typeof bluetooth.getDevices !== 'function';
}

/** The address the tip points at; a page cannot link to it, only copy it. */
export const CHROME_FLAGS_ADDRESS = 'chrome://flags';
