/**
 * Tiny platform-sniffing helpers shared by a few UI modules that need to
 * special-case iOS: `install.ts` (no install-prompt API there) and
 * `iosSensorGuidePage.ts` (no Web Bluetooth there either, R39).
 */
export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
