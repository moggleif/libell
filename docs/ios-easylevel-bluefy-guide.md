# Using a Sensorbox on iPhone (via Bluefy)

Libell's Sensorbox support — the EasyLevel box (R32/R33) and the Xparkle RVS01 (R49) —
is built on the standard Web Bluetooth API. Safari's
WebKit engine does not implement Web Bluetooth and Apple has no plans to
([webkit.org/status](https://webkit.org/status/) lists it as "no signal"), so a regular
iPhone can never connect directly, in any browser (all of them use WebKit) — this is
expected, not a bug.

Rather than build and maintain a separate native iOS app (see the discussion closing
#119), the supported route on iPhone is to run Libell inside **Bluefy**, a third-party
browser that adds a Web Bluetooth implementation to iOS. Libell's code needs no changes
for this — `easyLevelSensor.ts` and `xparkleSensor.ts` talk to whatever
`navigator.bluetooth` the browser provides, exactly as they already do on Chrome/Android.

This same guide is also shown in-app (R39): on iOS without Web Bluetooth, the top-bar
sensor-status dot stays visible instead of hidden, and opens a condensed version of the
steps below (`src/ui/iosSensorGuidePage.ts`). This document is the long-form reference
those in-app strings are kept consistent with.

## Steps

1. Install **Bluefy – Web Bluetooth Browser** from the App Store.
2. Open Bluefy and allow the Bluetooth permission prompt.
3. In Bluefy's address bar, go to <https://libell.app/>.
4. Turn on the box (an EasyLevel box's name starts with "CARATI").
5. Tap the sensor icon at the top right to open the **Sensor box** page, tap
   **Connect EasyLevel sensor** or **Connect Xparkle RVS01 sensor**, then pick the box from the
   pairing prompt.
6. The wheel/bubble UI now reads from the box, and the box's page guides you through its
   position, direction and zero. **Disconnect** on that page returns to the phone's own
   sensor at any time.

## Known limitations of this route

- **Not a home-screen PWA in the usual sense.** "Add to Home Screen" from Safari does
  not carry Bluefy's Bluetooth support; the app must be opened inside Bluefy each time
  BLE is needed.
- **Silent auto-reconnect (R33) may not apply.** That behavior depends on the browser
  implementing `navigator.bluetooth.getDevices()`; if Bluefy doesn't, reconnecting after
  closing and reopening the app needs one manual tap on **Reconnect**, same as the
  first-connect gesture — the app degrades to this honestly rather than failing
  silently (R33's documented fallback).
- **Third-party dependency.** Bluefy is not built or maintained by this project; a
  future Bluefy or iOS update could change or break this path without notice from us.
- **Signal strength never shows a value**, on this route or any other Web Bluetooth
  browser (R32): there is no reliable, cross-browser way to read RSSI.

This guide is the resolution for #119 — no native "Libell Sensor" iOS app is planned.
