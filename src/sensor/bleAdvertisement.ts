/**
 * Waiting to hear a Web Bluetooth box advertise before connecting to it.
 *
 * A Web Bluetooth property, not one box's quirk: `gatt.connect()` on a
 * device from `getDevices()` (or one picked earlier this page session)
 * frequently fails while the box is in range if no scan has seen it since
 * the link dropped.
 */

/**
 * How long a silent reconnect waits to hear the box advertise before it
 * tries to connect anyway. Shorter than the background auto-retry
 * interval, so attempts never queue behind each other.
 */
export const BLE_ADVERTISEMENT_WAIT_MS = 4000;

/**
 * Wait until the browser has seen `device` advertise, or until
 * `BLE_ADVERTISEMENT_WAIT_MS` has passed — Chrome's documented pattern for
 * a device from `getDevices()`. The picker path does not need it: the
 * picker is itself a scan.
 *
 * Never decides anything: whatever happens here (heard it, timed out,
 * `watchAdvertisements()` missing or refused) the caller still tries the
 * connect, so a browser where this does not work loses nothing.
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
