/**
 * Waiting to hear a Web Bluetooth box advertise before connecting to it
 * (#288, shared by every BLE adapter since #356).
 *
 * Found on an Xparkle box, but a property of Web Bluetooth rather than of
 * one box: `gatt.connect()` on a device from `getDevices()` (or one picked
 * earlier this page session) frequently fails while the box is in range
 * if no scan has seen it since the link dropped. The EasyLevel box, a BLE
 * peripheral like any other, gets the same treatment.
 */

/**
 * How long a silent reconnect waits to hear the box advertise before it
 * tries to connect anyway (#288). Shorter than the background auto-retry's
 * own interval (#211), so attempts never queue behind each other.
 */
export const BLE_ADVERTISEMENT_WAIT_MS = 4000;

/**
 * Wait until the browser has seen `device` advertise, or until
 * `BLE_ADVERTISEMENT_WAIT_MS` has passed (#288). Chrome's documented
 * pattern for a device from `getDevices()`: without it, `gatt.connect()`
 * frequently fails for a box that is in range but that no scan has seen
 * since the link dropped — which is exactly what "Retry" is for. The picker
 * path never needed this because the picker is itself a scan.
 *
 * Never decides anything by itself: whatever happens here (heard it, timed
 * out, `watchAdvertisements()` missing or refused) the caller still tries
 * the connect, so a browser where this does not work behaves as before.
 */
export async function waitForAdvertisement(device: BluetoothDevice): Promise<void> {
  if (typeof device.watchAdvertisements !== 'function') return;
  const abort = new AbortController();
  let finish = () => {};
  const done = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const heard = () => finish();
  const timer = setTimeout(heard, BLE_ADVERTISEMENT_WAIT_MS);
  device.addEventListener('advertisementreceived', heard);
  try {
    device.watchAdvertisements({ signal: abort.signal }).catch(heard);
    await done;
  } finally {
    clearTimeout(timer);
    device.removeEventListener('advertisementreceived', heard);
    abort.abort();
  }
}
