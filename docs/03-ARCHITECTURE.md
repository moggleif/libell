# Architecture

## Stack

- TypeScript (strict) + Vite, no UI framework — plain DOM and inline SVG
- Vitest (unit tests), Prettier (formatting)
- `vite-plugin-pwa` / Workbox — web app manifest + offline service worker
- Static site on GitHub Pages at the root of `https://libell.app/` (ADR 0020); the base path
  is `/` unless `BASE_PATH` says otherwise (`scripts/basePath.ts`)

## Layers

```
src/
├── main.ts        # entry point: only creates the app/ modules and connects them (#392)
├── app/           # the modules main.ts composes (#374, #392), each with its own tests:
│                  # core.ts (settings, sensors and calibration layers), pages.ts
│                  # (the pages over the main screen), mainScreen.ts (mute, indicators,
│                  # level screen) — the three steps main.ts runs (#484),
│                  # boxWiring.ts (box adapters, health, learn guide, password),
│                  # installOffsets.ts (each box's zero), boxZero.ts (zeroing a box),
│                  # phoneCalibration.ts (bias + vehicle zero), targets.ts (target presets),
│                  # hitchHeight.ts (a caravan's saved hitch height, #598),
│                  # vehicles.ts (several vehicles: add, rename, remove, switch, #599),
│                  # tiltReading.ts (sensor tilt in degrees), demoSensor.ts (?demo's tilt),
│                  # menuOptionParts.ts + menuOptions.ts (the options bags),
│                  # onboardingLauncher.ts, settingsAdoption.ts (what a save reaches),
│                  # settingsSurface.ts, sensorPages.ts, navigation.ts (where shortcuts lead),
│                  # indicatorState.ts + indicatorWiring.ts (lamps, badges, sensor icon),
│                  # levelEngine.ts, levelScreenView.ts, levelFrame.ts, levelScreen.ts
│                  # (the level screen), sound.ts (chime, guidance pulse, mute),
│                  # topBar.ts, frameGuard.ts, startupMigrations.ts, incomingSetup.ts,
│                  # sensorStartup.ts (start-up), appSettings.ts (the app's one copy
│                  # of the settings), sensorStaleness.ts (when a source is stale),
│                  # usage.ts and countingGate.ts (anonymous counting, ADR 0021/0022)
├── domain/        # PURE TypeScript (no browser APIs) — unit-testable, among them:
│   ├── leveling.ts   # computeLeveling(gravity, settings, calibration) -> LevelingResult
│   ├── caravan.ts    # the caravan's axle + jockey-wheel math (ADR 0008)
│   ├── hitchHeight.ts  # going back to a saved hitch height on that same math (#598)
│   ├── vehicles.ts   # which settings and stored values belong to one vehicle (#599)
│   ├── rampPlan.ts   # planRamps(lifts, settings) -> which wheels get the owned ramps
│   ├── stability.ts  # display hysteresis: values change only past a dead band
│   ├── calibration.ts, targetPresets.ts  # the three calibration terms (ADR 0010/0013/0014)
│   ├── pose.ts, stillness.ts, staleness.ts  # when a reading can be trusted
│   ├── usage.ts      # the only names anonymous counting may send (ADR 0021)
│   ├── settings.ts   # LevelSettings and DEFAULT_SETTINGS; settingsParsing.ts reads a
│   │                 # stored blob back (validation, legacy migrations)
│   └── sensorDeviceSettings.ts  # typed per-box settings inside sensorDevices
├── data/          # settingsStore.ts (settings, first-run flags), calibrationStore.ts
│                  # (the calibration layers), sensorDeviceStore.ts (each box's
│                  # remembered device id, #130), vehicleStore.ts (the waiting
│                  # vehicles, #599), countingStore.ts (the counting choice,
│                  # #674, #699) — localStorage read/write, on the
│                  # shared guarded helpers in keyValueStorage.ts; storedData.ts
│                  # gathers every store's keys for the Privacy tab (#678)
├── sensor/        # every gravity source behind one seam: orientation.ts (the phone),
│                  # boxes.ts (the registry), boxController.ts
│                  # (connect, reconnect, fallback), easyLevel*.ts and xparkle*.ts (each
│                  # box's adapter, protocol and simulator), sensorFallback.ts,
│                  # silentReconnect.ts
└── ui/            # render functions, SVG components, styles.css, i18n + messages/
```

Rule: `domain/` never touches `window`, `document`, `navigator` or `localStorage`. All
sensor, storage and DOM concerns live outside it, so the leveling math is trivially
testable in a plain Node environment.

## Leveling math (`src/domain/leveling.ts`)

Input: gravity vector `(gx, gy, gz)` in device coordinates (x = right, y = up-screen =
toward the front of the vehicle, z = out of the screen) and `LevelSettings`. All lengths
in **millimetres**.

```
roll  = atan2(gx, gz)        # side/side
pitch = atan2(gy, gz)        # front/back

# wheel positions (x = right, y = front), L = wheelbase,
# Wf/Wr = front/rear track width (axles may differ)
FL(-Wf/2, +L/2)  FR(+Wf/2, +L/2)
RL(-Wr/2, -L/2)  RR(+Wr/2, -L/2)

z_i    = x_i*tan(roll) + y_i*tan(pitch)
lift_i = max(z) - z_i          # >= 0, because blocks only go under wheels
step_i = rampHeightFor(lift_i): the configured step (mm) closest to lift_i (0 = no step),
         or on a stepless wedge lift_i itself up to its maximum (ADR 0018)
isLevel = max(lift) <= toleranceMm                      # height-based
```

The highest wheel is always the reference. Calibration is two-layered (ADR 0010): the
sensor offset (phone bias) and the vehicle zero (the phone spot's own tilt, captured
with the vehicle verifiably level, stored sensor-corrected) are kept separately and
their sum is subtracted from every reading. Output: per-wheel
`{liftMm, stepMm}`, plus `rollDeg`, `pitchDeg`, `isLevel`. The UI renders through the
display stabilizer in `stability.ts`, which applies the configurable hysteresis dead
band ("Stability") to the shown mm figure and, on the motorhome screen, to which
ramp plan is shown, each held for `dwellRestMs` before it changes.
Wheel color/glyph and `isLevel` are deliberately _not_ a third value with its own dead
band and dwell: they are recomputed every frame straight from that tick's
already-stabilized mm figure and plan, so the color can never lag or lead the numbers
it is describing (field regression, screenshot v1.0.0-CR180 — "0 mm" next to a red "no
ramp reaches this wheel"). A wheel's live mm figure (and the caravan jockey's signed
mm) additionally gets an adaptive dwell (#183, `stabilizeNumber`): once a change has
just been adopted, a further change in the _same direction_ — driving up a ramp,
cranking the jockey — only needs the much shorter `dwellMotionMs`
instead of paying the full rest dwell on every intermediate reading; a fresh
direction, or one reversing the last, still pays `dwellRestMs`, so oscillating noise
(which never holds one direction twice) can't borrow the fast path. The ramp
plan/step keeps the fixed rest dwell throughout — a discrete recommendation, not a
live readout, so it shouldn't change mid-climb. Both dwell figures are `LevelSettings`
fields, editable under Settings → General › More › Fine-tuning.

The steps the motorhome screen actually shows come from `rampPlan.ts` (ADR 0011): an
exhaustive search assigns the owned ramps (`rampCount`, a boggie pair costs two) to
wheels so the vehicle ends as close to level as the set allows, preferring — in
order — reaching the tolerance, fewer ramps, the waste-water drain side lowest
(`drainPosition`), levelness, lowest climb. The stabilizer adopts a differing fresh
plan only when it is clearly better under the current lifts, and wheel colors follow
the plan: red means the owned ramps cannot bring that wheel within tolerance. A
stepless wedge (`rampStepless`, ADR 0018) gives each wheel one candidate height, its
lift up to the wedge's maximum, and its cards name no step (`numberedSteps` is empty).
An adjustable kloss (`adjustable` in `RAMP_MODELS`, ADR 0019) keeps the same plan; the
motorhome engine adds one line above the vehicle from `src/domain/adjustableGuide.ts`,
which tells "set the kloss, then drive up" from "driven up, still not level: drive off"
by how far the largest lift falls after the vehicle has moved and stopped.

Caravan mode (`vehicleType: 'caravan'`, ADR 0008) uses `src/domain/caravan.ts`
instead: the single axle (track = `trackWidthRearMm`) is the reference plane, roll
drives the ramp recommendation for the low axle wheel, and pitch drives a signed
jockey-wheel correction over the `wheelbaseMm` axle-to-jockey distance — positive =
crank up. The shared `stabilizeLift` core provides the same hysteresis;
`src/app/levelEngine.ts` selects the compute → stabilize pipeline per vehicle type and
`src/app/levelScreen.ts` rebuilds the level screen when it changes. A boggie (`rearAxle: 'boggie'`, ADR 0009) is one
leveling axle at its midpoint: the math is untouched and the diagrams draw wheel
pairs sharing one recommendation.

## Sensor (`src/sensor/orientation.ts`)

Prefer `DeviceMotionEvent` and read `accelerationIncludingGravity` — this is the gravity
vector, the direct equivalent of Android's `TYPE_GRAVITY`. Fall back to
`DeviceOrientationEvent`, where `beta` is the front/back angle and `gamma` the side/side
angle, converting back into an equivalent gravity vector. Either way, apply an exponential
moving average to suppress jitter.

A Sensorbox delivers far fewer samples, raw (the Xparkle is polled twice a second), so
its reading is smoothed on the level screen instead: `src/app/levelFrame.ts` runs it
through a time-based low-pass (`src/domain/boxSmoothing.ts`) on every frame, so the
screen glides between two samples rather than jumping once per sample (#457). A new
source or a lost reading starts it afresh. The box's own page and box zeroing read the
raw values.

### Permission model

| Platform                | Behavior                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Android (Chrome, HTTPS) | Events fire after `addEventListener`, no prompt                                                              |
| iOS 13+ (Safari, HTTPS) | `DeviceMotionEvent.requestPermission()` **must** be called from a user gesture; returns `granted` / `denied` |
| Chromium 153+ (HTTPS)   | Offers `requestPermission()` too but fires events without it; told apart by `navigator.userAgentData` (#410) |
| Insecure origin         | Events never fire — the app must say so rather than showing a frozen level                                   |

The sensor module exposes an explicit state (`unsupported`, `needs-permission`, `granted`,
`denied`) so the UI can render a "Start" button on iOS and an explanation elsewhere.

`OrientationSensor` is the multi-source seam (#128, ADR 0014): `start()/getState()/
getGravity()/getSource()/getLastSampleAt()` is the whole contract every gravity source
implements — the
phone sensor above, the fixed-tilt `?demo` stand-in in `src/app/demoSensor.ts`, and
the two Sensorbox adapters: `src/sensor/easyLevelSensor.ts` (#116, R32) and
`src/sensor/xparkleSensor.ts` (#270, R49), opt-in from the top bar's sensor icon (R9),
only offered when `navigator.bluetooth` exists. `src/app/core.ts` selects
between implementations through the external-sensor controller's active sensor; `domain/` never learns which one is
active. `easyLevelSensor.ts` is the `OrientationSensor` face; one live link (status
before accel, the calibration gate, the silence watch) runs in `easyLevelLink.ts`, the
Web Bluetooth GATT transport sits in `easyLevelTransport.ts`, and payload parsing in
`easyLevelProtocol.ts` (unit-tested with synthetic bytes — no hardware or
`navigator.bluetooth` needed); `easyLevelSimulator.ts` (#220, R44) plugs a simulated
box into that same transport seam behind the `?easylevel-sim` query flag, emitting
real-wire-format payloads on timers so the whole EasyLevel flow runs hardware-free in
any browser (`isEasyLevelAvailable()` is that adapter's own availability rule: real Web
Bluetooth, or the flag). **The pages** (`src/ui/sensorPage.ts`, #268) are a list, not a device: one section and
one device page per available descriptor, built from the same components parameterised
by that source's descriptor. Which rows and controls a device page draws comes from that
descriptor's `capabilities` — battery, temperature, firmware, mounting picker,
installation offset, debug bytes — so a box that reports no temperature has no
temperature row, rather than one permanently reading "not available yet" (#228). The UI
imports no protocol module: each adapter's own struct is mapped in
`src/app/boxWiring.ts` into the source-neutral `BoxHealth`.

**The controller** (`src/sensor/boxController.ts`, #265) owns the
external-sensor lifecycle for every source: lazy adapter construction, connect and
disconnect, the silent auto-reconnect at app open (#130), the background auto-retry
(#211) and the "use phone sensor" escape hatch (#134). `src/app/core.ts` holds no device-named
closure of its own — it supplies the adapter factory (`createBox` in
`src/app/boxWiring.ts`) and three callbacks (build the
level screen, refresh the indicators, refresh the status row) and reads
`getActiveSensor()` fresh on every use. ADR 0014's "never silently switch source" rule
is enforced by one `adopt()`/`switchToPhone()` pair rather than by a dozen call sites,
and connecting a second source disconnects the first rather than leaving two adapters
delivering samples. Everything is injected, so the whole state machine is unit-tested
with fake adapters and fake time.

Settings that belong to one source rather than to the app or the vehicle live in
`LevelSettings.sensorDevices`, keyed by source id (#264): an untyped bag so an entry for
a source this build does not know survives a load/save round trip, read through typed
accessors (`easyLevelSettings`, `withEasyLevelSettings` in
`src/domain/sensorDeviceSettings.ts`) that validate field by field at
the point of use. `parseSettings` migrates #212/#217's flat `easyLevel*` fields into it
once.

`src/sensor/xparkleSensor.ts` (#270, R49) is the second adapter: the Xparkle RVS01,
whose protocol (`xparkleProtocol.ts`) differs from EasyLevel's in two ways that shape the
code — it is **polled** (a read of `fff2` twice a second, where EasyLevel is notify-driven)
and it is **written to** (a password and a parameter query on connect, where EasyLevel
never writes at all). It reports finished angles rather than accelerometer axes, so the
adapter synthesizes the `GravityVector` the seam takes; it applies its own stored mounting
orientation, so Libell applies none. The adapter is the `OrientationSensor` face only:
`xparkleLink.ts` runs one live link (handshake, poll loop, command replies, and one
best-effort `fff1` serial-number read after the first reading, inside the poll's
in-flight guard so it never overlaps another GATT operation, #597) and
`xparkleTransport.ts` is the transport seam with its Web Bluetooth link, where
`xparkleSimulator.ts` (#271, R48) plugs in a simulated box behind `?xparkle-sim`.

**The Web Bluetooth link** (`src/sensor/webBluetoothLink.ts`, #418) is the connect,
teardown, retry and silent-reconnect code a real BLE box needs, written once. An adapter
gives it only its scan filter and a `wire(server)` that opens the box's own service and
characteristics. Both the Xparkle and the EasyLevel transport are built on it, and the two
simulators share `src/sensor/simulatedLink.ts` (fixed id, drop, outage) the same way.

**A rejected Xparkle password is fixed in Libell (#367).** What Libell can do about it,
weighed against the protocol (`docs/competitor-notes.md`):

- _Offer the factory code_ (`"0000"`): already what every connect does first.
- _Let the user type the box's code_: what the vendor app itself does when the box
  rejects the stored one. Chosen. The code lives in `XparkleSettings.password`
  (`domain/sensorDeviceSettings.ts`, four digits or the factory code), is offered on every connect,
  and "Try again" offers it at once on the live link (`XparkleSensor.verifyPassword()`)
  and waits a bounded time for the verdict — no reconnect, since readings keep flowing
  either way (the box does not gate `fff2` on the password, #273).
- _Change the password_ (command `4`, mode `1`): needs the old code, which is exactly
  what the user does not know, and Libell does not change box passwords (Morgan,
  2026-10-11). A forgotten code is changed in the Xparkle app; the message says so.
- _Factory reset_ (command `1`): wipes everything the box stores, and whether a box
  accepts it without the right password is unknown. Under R49's rule that Libell never
  rewrites the box's stored state, it is not offered.

`boxPasswordBlock.ts` renders the message, the field and the one button, on the box's
card and on its own page; while the box rejects its code neither says "Connected".

**Vocabulary** (#520): in code a Sensorbox is a _box_ (`Box`, `BoxDescriptor`,
`boxes.ts`, `boxController.ts`, `boxWiring.ts`) and the phone's own sensor is the
_phone_; identifiers never say "external sensor".

**The registry** (`src/sensor/boxes.ts`, #262, ADR 0016) is what everything
above the seam asks instead of naming a device: each external source publishes a
descriptor with its `id` (the `SensorSource` member, and the key its storage and
settings are filed under), its `displayName` (the product name — never translated), its
`isAvailable()` and its `capabilities` (which rows its own page has something to put
in). `hasAvailableBox()` is the single gate for "should the external-sensor
UI exist here at all", used by `src/app/sensorPages.ts` and the onboarding wizard. The descriptor is
data only: connecting and reconnecting belong elsewhere, and `domain/` never sees any of
it — it keeps just the `SensorSource` union (ADR 0002).

`easyLevelSensor.ts` maps the box's raw accelerometer int16 triplet directly
into a `GravityVector` at whatever scale it reports, deliberately not reimplementing the
box's own onboard filter: the app's `atan2`-based roll/pitch only depends on axis ratios,
not absolute units. iOS gets no second `OrientationSensor` implementation (#119, closed
in favor of R39 below): Safari's WebKit has no Web Bluetooth and Apple has no plans to
add it, so instead of a native CoreBluetooth bridge, `src/ui/iosSensorGuidePage.ts`
guides the user to Bluefy — a third-party Web Bluetooth browser — which makes
`easyLevelSensor.ts` above work completely unchanged once Libell is opened inside it.
`src/ui/platform.ts`'s `isIos()` (shared with the install-button hint) gates this: shown
only when Web Bluetooth is absent _and_ the phone is iOS, so other unsupported browsers
still get R32's plain hidden case.

Remember-and-auto-reconnect (#130, R33): each box adapter has a `reconnect(deviceId)`
alongside `start()` — it tries Web Bluetooth's persistent-permissions API
(`navigator.bluetooth.getDevices()` + `device.gatt.connect()`), which needs no device
picker and no user gesture, and resolves `'granted'`/`'disconnected'`/`'unsupported'`
without ever falling back to `start()`'s gesture-triggered `requestDevice()` picker
itself (that fallback would be pointless with no gesture to spend, and wrong if one were
available — see the module doc comment). At start-up `src/app/sensorStartup.ts` asks
the controller to call `reconnect()` once when `libell.settings`' `sensorSource` was
last a box and a device id is remembered for it (`sensorDeviceStore.ts`); on any
failure it still adopts that box as the active sensor so the existing
`'disconnected'` UI (this section's paragraph above) is what the user sees, rather than
a second, parallel "couldn't auto-reconnect" message. `sensorSource` flips between
`'phone'` and the box's id on every explicit connect/disconnect; the remembered device id is written on a
successful connect and deliberately left alone on disconnect ("not right now", not
"forget this box") — the next connect can only ever overwrite it with the same or a
newer id, never leave it stale in a way that matters.
This is the PWA/Web-Bluetooth half of #130's ask; iOS reaches this same code through
Bluefy (R39) rather than a native codebase, so its auto-reconnect depends on whether
Bluefy itself implements `getDevices()` — degrading honestly to one manual reconnect
tap there when it doesn't, the same `'disconnected'` UI already described above.
Chrome on Android also keeps `getDevices()` behind a `chrome://flags` switch, so
`src/sensor/silentReconnect.ts` (#310) decides when the box's page offers an
"Advanced" tip for turning it on: a Chromium browser with Web Bluetooth but no
`getDevices()`, never iOS.
Calibration is correspondingly split three ways —
sensor bias (R11, source-specific), installation/placement offset (R24's vehicle zero,
ADR 0010, generalizable per source), and the desired vehicle target (ADR 0013,
source-independent) — see ADR 0014 for the full rule.

Installation calibration for a mounted external sensor (#131, R34) fills in the
concrete storage shape ADR 0014 deferred, keyed per source by #263 (ADR 0016):
`calibrationStore.ts`'s `loadInstallCalibration`/`saveInstallCalibration`/
`clearInstallCalibration` all take a `SensorSource` and file it under
`libell.installCalibration.<source>` — the same shape as `libell.vehicleCalibration`,
just never the same key, so no two sources (and never a source and the phone) can be
conflated. All three read back up to `MAX_TILT_DEG` rather than the 15° capture limit,
since a capture above 15° is stored with a warning and an undo (#411, #425, #624). `sensorDeviceStore.ts` keys the
remembered device id the same way (`libell.sensorDevice.<source>`). Both carry a
one-shot migration from the device-named keys #130/#131 used, which copies rather than
moves, so a rolled-back build still finds the user's pairing and offset. `src/app/core.ts`'s `zeroCalibration()` picks which
pair to sum from the ACTIVE `sensor.getSource()`: the phone's sensor calibration +
vehicle zero (`src/app/phoneCalibration.ts`) while the phone is active, or just the
active box's installation offset (`src/app/installOffsets.ts`) while a box is — there
is no separate hardware-bias layer for a box, so `src/app/boxZero.ts` reuses
`vehicleZeroFromReading(reading, null)` (unmodified from R24) directly for the
capture. The UI is built by `sensorSourceSection.ts` (not inside `calibrationSection.ts`) and,
since #226, placed by `sensorPage.ts` on the sensor's own page
(`boxStatusPage.ts`'s `settingsSlot`) rather than on the External sensor list
page — that section returns its `connectElement`/`installElement` halves separately
precisely so each caller can place them where they belong (the onboarding wizard puts
them on separate steps). Visible whenever a box is the active source,
reusing `calibrationAge.ts`'s shared `ageText()` (factored out of
`calibrationSection.ts` by this change) and the `calibration.age.*` i18n keys for the age
copy rather than re-deriving that wording. A box has no Check (R34, #343).

Each source's fine adjustment of its zero (#596, R24) is a fourth, small term on top
of that source's zero: `libell.zeroTrim.<source>` (the phone included), loaded by
`src/app/zeroTrims.ts` and added by `trimmedZero` (`src/domain/zeroTrim.ts`) inside
`zeroCalibration()`, so the targets and the leveling math see the adjusted zero.
Taking or forgetting a zero resets its trim (`onVehicleZeroReplaced` in
`phoneCalibration.ts`, `onZeroReplaced` in `boxZero.ts`). The row itself is
`src/ui/zeroTrimRow.ts`, placed under the zero by `calibrationSection.ts` and
`boxSetupChecklist.ts`.

A caravan's hitch height (#598, R55) is a pitch saved relative to the zero, like a
target, under its own key `libell.hitchPitch` (`settingsStore.ts`), so redoing or
clearing the zero never moves it. Going back to it is a session-only mode in
`src/app/hitchHeight.ts`: while it is on, `core.ts`'s `effectiveCalibration()` is the
zero plus the saved pitch (`hitchCalibration` in `src/domain/hitchHeight.ts`) in place
of the target, so the ordinary `computeCaravanLeveling` jockey correction leads back to
it; `levelEngine.ts` then shows the result through `hitchDisplay` (the axle has nothing
to do) and says the crank in the status row. The main-screen badge
(`src/ui/hitchBadge.ts`, mounted with the vehicle and target badges) ends the mode, and
`src/ui/hitchOffer.ts` asks "Save the hitch height first?" while none is saved.

Several vehicles (#599, R56, ADR 0017): only the active vehicle lives in the ordinary
keys. The others wait as snapshots under `libell.vehicles` (`src/data/vehicleStore.ts`):
their `VEHICLE_FIELDS` (`src/domain/vehicles.ts`) and the raw values of the keys each
store lists as per-vehicle (`vehicleCalibrationKeys`, `vehicleFlagKeys`,
`rememberedDeviceKeys`). `src/app/vehicles.ts` swaps them and reloads the app, so a switch
starts every module, the box connection included, from the new vehicle as on open. The
picker is `src/ui/vehiclePicker.ts`, placed above the Vehicle fields by
`settingsLayout.ts`; its rows are `src/ui/choiceList.ts`, shared with the targets list
(#613).

Stale-data safety state (#132, R35): every `OrientationSensor` implementation stamps
`getLastSampleAt()` (`performance.now()`) on each _real_ accepted sample — the phone
sensor's `accept()`, the EasyLevel sensor's accel-notification handler, the Xparkle
sensor's poll — never on
"listener attached" or "GATT still open", so a stalled stream (a backgrounded tab's
throttled `devicemotion`, a BLE box whose notifications silently stopped while its
connection stayed open) is visible even though `getGravity()` still returns its last
non-null value. `domain/staleness.ts`'s `isSensorStale(lastSampleAtMs, nowMs,
timeoutMs)` is the one pure predicate both sources share — time is always a parameter,
matching R25's stillness detector and the display stabilizer's dwell timers, so it is
unit-tested without real timers. The frame loop (`src/app/levelFrame.ts`) checks it every frame with a
per-source timeout (2s phone, continuously sampling; for a box its descriptor's
`staleTimeoutMs`, since BLE readings can have larger natural gaps) and, while stale, shows a dedicated
overlay instead of the pose overlay or the diagram — a third state, never conflated
with R17's wrong-pose guard (checked after staleness: a reading too old to trust isn't
safe to judge the pose from either) or R25's "Measuring…" (which needs new, noisy
samples to compute anything, and so cannot by itself detect the sensor going silent).
Recovery is automatic: the overlay clears the instant a fresh sample updates
`getLastSampleAt()`, with no separate flag to reset.

## Screen wake

`navigator.wakeLock.request('screen')` keeps the display on while leveling (Chrome on
Android, Safari on iOS 16.4+). The lock is released automatically when the page is hidden
and must be re-acquired on `visibilitychange`. Where the API is missing, the app degrades
silently.

## Orientation

`screen.orientation.lock('portrait')` only works in fullscreen on Chrome for Android and is
unsupported in iOS Safari, so it is treated as a best-effort nicety. The layout is
responsive and must stay usable in landscape rather than relying on a hard lock.

## State (`src/main.ts`)

The entry point first fetches the one dictionary the language in use needs
(`startLanguage()` in `src/ui/i18n.ts`: the stored choice, else the phone's; English if
it cannot load), since nothing may show text before it is in (ADR 0024). Each language
is a file of its own; a language change reloads the app, which fetches the new one. It
then creates the `src/app/` modules and connects them, in three steps:
`src/app/core.ts` (the state and the sensors), `src/app/pages.ts` (the pages) and
`src/app/mainScreen.ts` (the main screen). The level screen
reads the active sensor, runs `computeLeveling` (or the caravan's) in
`src/app/levelEngine.ts`, and hands the result to the render functions in `ui/`.
Rendering is driven by `requestAnimationFrame` (`src/app/levelScreen.ts`) so sensor
events do not force a layout on every tick. What each frame shows (no data, stale, wrong
pose, the guidance) and when the level celebration, audio guidance and spoken guidance
fire is decided in `src/app/levelFrame.ts` (what to say and when: the pure
`src/domain/spokenGuidance.ts`; the words: `src/ui/spokenText.ts`; the phone's offline
voice: `src/app/speech.ts`); the screen's elements live behind its view in
`src/app/levelScreenView.ts`.

## Settings (`src/data/settingsStore.ts`)

`localStorage`, JSON-encoded under a single key, with validation on read so a corrupt or
outdated value falls back to defaults. The default values live in one place —
`DEFAULT_SETTINGS` in `src/domain/settings.ts`; update that constant, and never copy its
values into prose. Legacy cm values
migrate on read (×10): wheelbase, track widths (including a single `trackWidthCm` for
both axles) and step heights.

The Settings form (`src/ui/settingsPanel.ts`) writes each change as it is made (#328)
and has no Save button. Because the same blob also holds what other pages write while
Settings is open (the sensor source and `sensorDevices`, saved directly by the sensor
pages), the form never writes those from its own snapshot: each save reads them back
from storage first and only replaces the fields the form shows.

Each tab is its own module — `settingsVehicleTab.ts`, `settingsRampsTab.ts` (with
`rampChoice.ts` and `rampsPage.ts`), `settingsLevelTab.ts`, `settingsGeneralTab.ts` —
built from the shared field
helpers in `settingsFields.ts`. `settingsPanel.ts` owns what they share: the form state
and its values. Saving, Undo and the message for an unusable number are
`settingsAutoSave.ts`; the layout (Modern's tabs, Classic's ☰ pages, the wizard's
steps) is `settingsLayout.ts`, which also assembles the Calibration tab around
`calibrationSection.ts` (its controls and layouts are `calibrationControls.ts` and
`calibrationLayouts.ts`).

## Stored data (`src/data/storedData.ts`, #678)

Everything Libell stores is under keys starting with `libell.` (`LIBELL_PREFIX` in
`storedKeys.ts`): in `localStorage` through the stores above, plus the one
`sessionStorage` mark in `sessionKeys.ts` that reopens Settings after a reload. Each
store lists its own keys, with what each holds (`StoredKind`), in a `…StoredKeys()`
function; `storedData.ts` gathers them into one catalogue. `storedData.test.ts` scans
the source for `libell.` literals and fails on any key no store lists.

The Privacy tab (R58, `src/ui/privacyPanel.ts`) reads the storage itself rather than
the catalogue, so a key no store knows (say from a removed version) still shows, as
`other`; `src/ui/storedDataText.ts` turns the entries into plain-words rows, and
`maskSecrets` hides the box password at any depth in the raw view. "Delete all Libell
data" removes every `libell.*` key in both storages and reloads; first-run start-up
then writes its migration markers again, as on any fresh install.

## Offline

Workbox precaches every build asset (`js`, `css`, `html`, `svg`, `png`, `woff2`), so once the app
has been opened with a connection it works with no signal at all. Each file is precached
once: the manifest's icons are already in that glob (`includeManifestIcons: false`), and
the install-sheet screenshot, generated from the built app afterwards, is not precached. `registerType:
'autoUpdate'` lets a new worker activate on its own; `src/ui/appUpdate.ts` then reloads
an already-controlled page once on `controllerchange`, re-checks for a new worker when
the app returns to the foreground, and lets a tap on the top-bar name / version check on
demand (R50). The worker is registered with a deferred script, so it never holds up the
first render (ADR 0024).

## Loading after the first screen (`src/app/lazyPart.ts`, ADR 0024)

The entry file holds what the level screen needs; the dictionary in use is a file of its
own (State, above), and the parts below each load as a file of their own. `lazyPart()`
fetches a part once, however often it is asked for. `whenIdle()` asks for it when the
phone is idle after the first render (`requestIdleCallback`, at most two seconds; a short
timeout on Safari, which has none), so a first tap rarely waits. `lazyPage()` puts a page
behind its button: a tap before the page has loaded loads and opens it, and once loaded
the page's own `attach()` owns the button. Every part is precached, so a part that cannot
load means a newer version has replaced it: the app says it is updating and reloads, or,
offline, says it has no connection and tries again on the next use. The parts so far:

- the "?" page (`src/ui/infoMenu.ts`: help, About, feedback and the Privacy tab), behind
  the help button (`src/app/pages.ts`);
- Settings (`src/ui/settingsPage.ts`, or Classic's `src/ui/menu.ts`), behind the gear
  (`src/app/settingsSurface.ts`); the router's openers load it first, and a reload that
  asks to reopen a section loads it at once;
- the guide (`src/ui/onboarding.ts`) and the first-visit intro (`src/ui/intro.ts`), shown
  through `src/app/onboardingLauncher.ts` once their file is in (`src/app/pages.ts`). The
  launcher counts them open from the moment they are asked for, so the level screen
  pauses its guidance at once. Settings and the guide share the settings forms
  (`src/ui/settingsPanel.ts` and its tabs), which the build puts in a file of their own.

The build may also split modules the entry shares with these parts into a file the entry
preloads; that file loads at start too. The bundle guard's `startExcludes`
(`scripts/quality/bundle-budget.json`) lists the modules of every part, so a static
import that pulls one back into a file loaded at start fails CI.

## Anonymous counting (`src/app/usage.ts`, ADR 0021)

`main.ts` starts the counter with `browserUsageDeps` and counts the start (`countAppStart`:
open, version, language, the chosen sensor, and spoken or continuous audio guidance when
on); features call `countFeature(name)`, and a source switch calls `countSensor`. Every
path is built in `src/domain/usage.ts`, so nothing else can be sent. The counter sends each
path at most once per app start, as `GET https://libell.goatcounter.com/count?p=<path>&e=true`
with `fetch` (`no-cors`, `credentials: 'omit'`, `keepalive`, no referrer), and forgets
failures: nothing is queued or retried. `allowed()` is asked on every send: only on
`libell.app`, online, not in `?demo`, without Global Privacy Control or Do Not Track, and
with "Yes, count anonymously" chosen (`src/data/countingStore.ts`: `libell.counting` is `on` or `off`,
missing until chosen; blocked storage reads as not chosen, so nothing counts). Before
anything else `main.ts` runs `decideCountingFirst` (`src/app/countingGate.ts`, ADR 0022):
with no choice stored, no GPC/DNT and no `?demo`, it shows `src/ui/countingChoice.ts`,
stores the answer, and only then counts the start and opens the intro or an incoming
setup link. The choice screen and the Privacy tab (`privacyPanel.ts`, under the stored
data, with the switch) both show `countingSection.ts`; `countingStoredKeys()` puts the
choice in the stored-data catalogue (#678), and a start-up migration turns #674's
`libell.countingOff` into the choice "off".

## Static pages (`src/ui/staticPages.ts`, #675, #703)

The privacy policy (R60) and the language pages (R61) are not pages of the app but static
HTML the build writes: the `static-pages` plugin in `vite.config.ts` loads
`staticPages.ts` through Vite's `runnerImport` (it is app code, typed and tested with the
app) and emits what it returns. `src/ui/staticPage.ts` holds what they share: the
escaping every text goes through, the head with a `default-src 'none'; style-src 'self'`
CSP of its own, the list of the same page in the other languages, and the one stylesheet (`STATIC_CSS`), which
uses only the browser's system colours (`Canvas`, `CanvasText`, `LinkText`) under
`color-scheme: light dark`. No page has a script it runs. Text is looked up per language
with `translate()` from `translations.ts`, which holds every dictionary for the build; brands come from `boxNames()` (`boxNames.ts`), which
lists `EXTERNAL_SENSORS` the way the language joins things ("A and B", or "A or B"
where any one is meant), as the app's own counting block does (#709). The pages fall
under the precache glob, and `navigateFallbackDenylist` keeps the service worker from
answering them with the app.

- **Privacy policy** (`privacyPolicy.ts`): `privacy/<lang>/index.html` for every language
  in `LANGUAGES` and `privacy/index.html` in English. The text is the `policy.*` strings
  plus the counting block's own strings (`counting.sent`, `counting.notSent`,
  `counting.gpc`), with the in-app paths from the tab names. `POLICY_CHANGED` holds the
  date shown on the page.
- **Language pages** (`languagePages.ts`): `<lang>/index.html` for every language. The
  text is `seo.*`, `landing.*` and the About tab's offline and privacy sentences; the
  head carries the canonical address, `hreflang` alternates for every language with
  `x-default` on `en/`, the link-preview tags and schema.org `WebApplication` and
  `FAQPage` data in an `application/ld+json` block, which is data and never run. The
  preview tags and the `WebApplication` come from `previewMeta()` and `webApplication()`
  in `findability.ts`, so the app's head and every language page say the same (#709).

## Findability (`src/ui/findability.ts`, #701)

What a search engine or AI assistant reads (R61). The `findability` plugin in
`vite.config.ts` loads `findability.ts` through Vite's `runnerImport` (it is app code,
typed and tested with the app) and uses it twice: `transformIndexHtml` adds the title,
description, canonical link, the Open Graph and Twitter card tags of the link preview
(#702) and a `application/ld+json` data block to `index.html` (a
data block is never run, so the CSP stays as it is; `<` in it is escaped), and a
`generateBundle` hook ordered `post` writes `robots.txt`, `llms.txt` and `sitemap.xml`,
the sitemap from every `index.html` in the bundle so pages other plugins write are listed
too, the static pages above among them. The text is the `seo.*` keys and the About
strings in English, and `llms.txt` links every language page and the privacy policy; addresses come from
`SITE_ORIGIN` and `REPO_URL` in `src/domain/site.ts` plus the build's base path. None of
the three files is precached. The preview image, `preview.png` (1200×630), is drawn from
`art/preview.svg` by `scripts/generate-icons.mjs` with the icons, gitignored like them
and left out of the precache (`globIgnores`).

## UI

The RV top-down diagram is the hero element (see `docs/02-REQUIREMENTS.md` R4–R6) with
the bubble level embedded at its center; per-wheel readouts sit directly at the wheels
(the step name and one height, the lift in whole mm — R6), drawn on the SVG in Classic and on floating wheel cards in Modern, for the motorhome and the caravan alike (`stepAndLiftText` in `src/ui/diagramParts.ts`). Everything is inline SVG, sized in viewport units so the
diagram stays legible on a phone lying on a table. Settings open from the bottom action
bar's gear: in Modern a page with one tab per section, in Classic the ☰ drawer with one page per section (`src/app/settingsSurface.ts`).
Help is its own page behind "?", with Help, About, Feedback and Privacy tabs (`src/ui/infoMenu.ts`,
R12, R38). The Sensorbox is reached from the sensor icon in the top bar's corner (R9);
no menu entry leads there. Amber warning lamps in the top bar point to missing
measurements, a missing calibration or a missing zero. All user-facing strings go through `t()` in `src/ui/i18n.ts`, backed by one dictionary per language in `LANGUAGES` in `src/ui/messages/`, of which the app loads only the one in use (`src/ui/translations.ts` holds them all for the build and the tests), next to `context.ts` (what each string is for) and `glossary.ts` (the locked terms, #628).

Top bar / bottom action bar split (#161): the top bar holds only identity (logo, title,
share) on the left and the indicators cluster (warning lamps, sensor status) on the
right; the vehicle, target and hitch height badges sit under it in `#choices` (#616) — no menu button there. A bottom action bar (`.bottombar`) holds
three controls instead: settings (opens Settings as above),
sound (center, visually larger — a single mute/unmute toggle for `soundOnLevel` +
`soundGuidance` together, restoring their exact prior values on unmute rather than
forcing either back on), and help (opens the Help page on its Help tab). The
install prompt is unaffected — it still renders via the `#install-hint` banner under the
top bar. Because mute can change the two sound settings while the menu is closed, the
Settings page's own checkboxes resync from the live values (`SettingsFormElement.
resyncSoundFields`) every time Settings reopens, so a stale checkbox state can never
silently overwrite a mute on the next unrelated change.

## Build / CI notes

The repository is text-only: PWA icons are rendered from `public/icons/icon.svg`, and
the link preview from `art/preview.svg`, by `scripts/generate-icons.mjs` during
`npm run build`, and are gitignored. The `?demo`
flag replaces the sensor with a fixed tilt **and presents the app as configured** (no
warning lamps, in memory only), so screenshots and demos show the product rather than
the first-run state. The `?easylevel-sim` (R44) and `?xparkle-sim` (R48) flags are its
Sensorbox siblings: a simulated BLE box behind the transport seam, for exercising the external-sensor flow
on machines (and CI screenshots) with no hardware. CI runs
`format:check`, `typecheck`, `test:coverage` (the unit tests with a coverage floor,
including the quality guards in `scripts/quality/`, see `docs/01-CONTRIBUTING.md`) and
`build` on every pull request and every push
to `main` (once per PR push, not also on the branch push — #471), plus three Playwright
checks against the built app, `flows` and `fit` each in a parallel job of its own
(#473), `fit` further split into one job per appearance (#494): `smoke` (it renders at all), `flows` (the simulated
boxes, the wizard, the level screen, sound, navigation, settings saves and start-up
through the real wiring — #374, #392) and `fit` (every view fits a
phone screen — R4/#241, R18/#239 and R40/#243; the unit tests run in happy-dom, which
has no layout engine and measures every height as zero, so this is the only place a
too-tall or too-wide view can fail). `fit` also checks the stylesheet directly for the
one rule no browser in CI can reproduce — the iOS large-vs-small viewport, see
`docs/01-CONTRIBUTING.md`. After the build, `npm run bundle` checks what the files loaded at start hold, the gzip budget of each
file and that every file is precached (ADR 0024; see "Quality guards" in
`docs/01-CONTRIBUTING.md`). Pushes to `main` deploy `dist/` to GitHub Pages. The deploy
builds with the base path Pages reports, so a build fits the custom domain once it is set
and the project site before that, and it publishes a `.well-known` folder from the static files too (ADR 0020).
Dependabot's grouped patch and minor PRs merge themselves once that CI is green
(ADR 0023); such a merge does not start the deploy, so it ships with the next merge.
