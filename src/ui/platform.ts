/** iOS has no install-prompt API and no Web Bluetooth. */
export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
