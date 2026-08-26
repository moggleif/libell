# Architecture

## Stack

- TypeScript (strict) + Vite, no UI framework — plain DOM and inline SVG
- Vitest (unit tests), Prettier (formatting)
- `vite-plugin-pwa` / Workbox — web app manifest + offline service worker
- Static site on GitHub Pages, base path `/libell/` (override with `BASE_PATH`)

## Layers

```
src/
├── main.ts        # entry point; requests wake lock; wires sensor → state → render
├── domain/        # PURE TypeScript (no browser APIs) — unit-testable
│   ├── leveling.ts   # computeLeveling(gravity, settings, calibration) -> LevelingResult
│   ├── rampPlan.ts   # planRamps(lifts, settings) -> which wheels get the owned ramps
│   ├── stability.ts  # display hysteresis: values change only past a dead band
│   └── settings.ts   # LevelSettings + Calibration (validation, legacy migrations)
├── data/          # settingsStore.ts (settings + calibration), easyLevelDeviceStore.ts
│                  # (remembered EasyLevel device id, #130) — localStorage read/write
├── sensor/        # orientation.ts (phone), easyLevelSensor.ts (BLE box, #116) — gravity vector as a subscription
└── ui/            # render functions, SVG components, styles.css
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
step_i = the configured ramp step height (mm) closest to lift_i (0 = no step)
isLevel = max(lift) <= toleranceMm                      # height-based, default 20 mm
```

The highest wheel is always the reference. Calibration is two-layered (ADR 0010): the
sensor offset (phone bias) and the vehicle zero (the phone spot's own tilt, captured
with the vehicle verifiably level, stored sensor-corrected) are kept separately and
their sum is subtracted from every reading. Output: per-wheel
`{liftMm, stepMm}`, plus `rollDeg`, `pitchDeg`, `isLevel`. The UI renders through the
display stabilizer in `stability.ts`, which applies the configurable hysteresis dead
band ("Stability") to the shown mm figure and, on the motorhome screen, to which
ramp plan is shown, each held for `dwellRestMs` (default 600) before it changes.
Wheel color/glyph and `isLevel` are deliberately _not_ a third value with its own dead
band and dwell: they are recomputed every frame straight from that tick's
already-stabilized mm figure and plan, so the color can never lag or lead the numbers
it is describing (field regression, screenshot v1.0.0-CR180 — "0 mm" next to a red "no
ramp reaches this wheel"). A wheel's live mm figure (and the caravan jockey's signed
mm) additionally gets an adaptive dwell (#183, `stabilizeNumber`): once a change has
just been adopted, a further change in the _same direction_ — driving up a ramp,
cranking the jockey — only needs the much shorter `dwellMotionMs` (default 150)
instead of paying the full rest dwell on every intermediate reading; a fresh
direction, or one reversing the last, still pays `dwellRestMs`, so oscillating noise
(which never holds one direction twice) can't borrow the fast path. The ramp
plan/step keeps the fixed rest dwell throughout — a discrete recommendation, not a
live readout, so it shouldn't change mid-climb. Both dwell figures are `LevelSettings`
fields, editable under Settings → Advanced.

The steps the motorhome screen actually shows come from `rampPlan.ts` (ADR 0011): an
exhaustive search assigns the owned ramps (`rampCount`, a boggie pair costs two) to
wheels so the vehicle ends as close to level as the set allows, preferring — in
order — reaching the tolerance, fewer ramps, the waste-water drain side lowest
(`drainPosition`), levelness, lowest climb. The stabilizer adopts a differing fresh
plan only when it is clearly better under the current lifts, and wheel colors follow
the plan: red means the owned ramps cannot bring that wheel within tolerance.

Caravan mode (`vehicleType: 'caravan'`, ADR 0008) uses `src/domain/caravan.ts`
instead: the single axle (track = `trackWidthRearMm`) is the reference plane, roll
drives the ramp recommendation for the low axle wheel, and pitch drives a signed
jockey-wheel correction over the `wheelbaseMm` axle-to-jockey distance — positive =
crank up. The shared `stabilizeLift` core provides the same hysteresis; `main.ts`
selects the compute → stabilize → render pipeline per vehicle type and rebuilds the
level screen when it changes. A boggie (`rearAxle: 'boggie'`, ADR 0009) is one
leveling axle at its midpoint: the math is untouched and the diagrams draw wheel
pairs sharing one recommendation.

## Sensor (`src/sensor/orientation.ts`)

Prefer `DeviceMotionEvent` and read `accelerationIncludingGravity` — this is the gravity
vector, the direct equivalent of Android's `TYPE_GRAVITY`. Fall back to
`DeviceOrientationEvent`, where `beta` is the front/back angle and `gamma` the side/side
angle, converting back into an equivalent gravity vector. Either way, apply an exponential
moving average to suppress jitter.

### Permission model

| Platform                | Behavior                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Android (Chrome, HTTPS) | Events fire after `addEventListener`, no prompt                                                              |
| iOS 13+ (Safari, HTTPS) | `DeviceMotionEvent.requestPermission()` **must** be called from a user gesture; returns `granted` / `denied` |
| Insecure origin         | Events never fire — the app must say so rather than showing a frozen level                                   |

The sensor module exposes an explicit state (`unsupported`, `needs-permission`, `granted`,
`denied`) so the UI can render a "Start" button on iOS and an explanation elsewhere.

`OrientationSensor` is the multi-source seam (#128, ADR 0014): `start()/getState()/
getGravity()/getSource()/getLastSampleAt()` is the whole contract every gravity source
implements — the
phone sensor above, the fixed-tilt `?demo` stand-in in `main.ts`, and
`src/sensor/easyLevelSensor.ts` (#116, R32: the EasyLevel BLE box, opt-in via the menu's
"External sensor" page, only shown when `navigator.bluetooth` exists). `main.ts` selects
between implementations at one `let sensor` binding; `domain/` never learns which one is
active. `easyLevelSensor.ts` keeps Web Bluetooth GATT transport separate from payload
parsing (`easyLevelProtocol.ts`, unit-tested with synthetic bytes — no hardware or
`navigator.bluetooth` needed); `easyLevelSimulator.ts` (#220, R44) plugs a simulated
box into that same transport seam behind the `?easylevel-sim` query flag, emitting
real-wire-format payloads on timers so the whole EasyLevel flow runs hardware-free in
any browser (`isEasyLevelAvailable()` is the shared availability gate: real Web
Bluetooth, or the flag). `easyLevelSensor.ts` maps the box's raw accelerometer int16 triplet directly
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

Remember-and-auto-reconnect (#130, R33): `EasyLevelSensor` gains a `reconnect(deviceId)`
alongside `start()` — it tries Web Bluetooth's persistent-permissions API
(`navigator.bluetooth.getDevices()` + `device.gatt.connect()`), which needs no device
picker and no user gesture, and resolves `'granted'`/`'disconnected'`/`'unsupported'`
without ever falling back to `start()`'s gesture-triggered `requestDevice()` picker
itself (that fallback would be pointless with no gesture to spend, and wrong if one were
available — see the module doc comment). `main.ts` calls `reconnect()` once at startup
when `libell.settings`' `sensorSource` was last `'easylevel'` and a device id is
remembered (`easyLevelDeviceStore.ts`); on any failure it still adopts
`easyLevelSensor` as the active sensor so the existing `'disconnected'` UI (this
section's paragraph above) is what the user sees, rather than a second, parallel
"couldn't auto-reconnect" message. `sensorSource` flips between `'phone'`/`'easylevel'`
on every explicit connect/disconnect; the remembered device id is written on a
successful connect and deliberately left alone on disconnect ("not right now", not
"forget this box") — the next connect can only ever overwrite it with the same or a
newer id, never leave it stale in a way that matters.
This is the PWA/Web-Bluetooth half of #130's ask; iOS reaches this same code through
Bluefy (R39) rather than a native codebase, so its auto-reconnect depends on whether
Bluefy itself implements `getDevices()` — degrading honestly to one manual reconnect
tap there when it doesn't, the same `'disconnected'` UI already described above.
Calibration is correspondingly split three ways —
sensor bias (R11, source-specific), installation/placement offset (R24's vehicle zero,
ADR 0010, generalizable per source), and the desired vehicle target (ADR 0013,
source-independent) — see ADR 0014 for the full rule.

Installation calibration for a mounted external sensor (#131, R34) fills in the
concrete storage shape ADR 0014 deferred: `settingsStore.ts` gains
`loadEasyLevelCalibration`/`saveEasyLevelCalibration`/`clearEasyLevelCalibration`
under their own `libell.easyLevelInstallCalibration` key — the same shape and
`>15°` implausible-capture guard as `libell.vehicleCalibration`, just never the same
key, so the two can never be conflated. `main.ts`'s `zeroCalibration()` picks which
pair to sum from the ACTIVE `sensor.getSource()`: the phone's sensor calibration +
vehicle zero while the phone is active, or just the EasyLevel installation offset
while it is — there is no separate EasyLevel hardware-bias layer yet, so
`vehicleZeroFromReading(reading, null)` (unmodified from R24) is reused directly for
the capture. The UI lives in `sensorSourceSection.ts`'s "External sensor" page (not
inside `calibrationSection.ts`), visible whenever EasyLevel is the active source,
reusing `calibrationAge.ts`'s shared `ageText()` (factored out of
`calibrationSection.ts` by this change) and the `calibration.check.*`/`calibration.age.*`
i18n keys for the Check/age copy rather than re-deriving that wording.

Stale-data safety state (#132, R35): every `OrientationSensor` implementation stamps
`getLastSampleAt()` (`performance.now()`) on each _real_ accepted sample — the phone
sensor's `accept()`, the EasyLevel sensor's accel-notification handler — never on
"listener attached" or "GATT still open", so a stalled stream (a backgrounded tab's
throttled `devicemotion`, a BLE box whose notifications silently stopped while its
connection stayed open) is visible even though `getGravity()` still returns its last
non-null value. `domain/staleness.ts`'s `isSensorStale(lastSampleAtMs, nowMs,
timeoutMs)` is the one pure predicate both sources share — time is always a parameter,
matching R25's stillness detector and the display stabilizer's dwell timers, so it is
unit-tested without real timers. `main.ts`'s frame loop checks it every frame with a
per-source timeout (2s phone, continuously sampling; 4s EasyLevel, whose event-driven
BLE notifications can have larger natural gaps) and, while stale, shows a dedicated
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

The entry point subscribes to the sensor, reads settings from the store, runs
`computeLeveling`, and hands the resulting `LevelingResult` to the render functions in
`ui/`. Rendering is driven by `requestAnimationFrame` so sensor events do not force a
layout on every tick.

## Settings (`src/data/settingsStore.ts`)

`localStorage`, JSON-encoded under a single key, with validation on read so a corrupt or
outdated value falls back to defaults. The default values live in one place —
`DEFAULT_SETTINGS` in `src/domain/settings.ts` (wheelbase 3800 mm, track width
1810/1980 mm front/rear, the Thule Levelers steps 44/78/112 mm, two ramps, no drain
preference, tolerance 20 mm,
stability 3 mm); update that constant, not prose copies of it. Legacy cm values
migrate on read (×10): wheelbase, track widths (including a single `trackWidthCm` for
both axles) and step heights.

## Offline

Workbox precaches every build asset (`js`, `css`, `html`, `svg`, `png`), so once the app
has been opened with a connection it works with no signal at all. `registerType:
'autoUpdate'` means a new deployment is picked up on the next launch.

## UI

The RV top-down diagram is the hero element (see `docs/02-REQUIREMENTS.md` R4–R6) with
the bubble level embedded at its center; per-wheel readouts sit directly at the wheels
(step name above with its height parenthesized small, lift in whole mm below). Everything is inline SVG, sized in viewport units so the
diagram stays legible on a phone lying on a table. Settings, Calibration and Help live
in the full-width hamburger menu; amber warning lamps in the top bar point to unsaved
settings or a missing calibration. All user-facing strings go through the i18n dictionaries (sv/en) in `src/ui/i18n.ts`.

Top bar / bottom action bar split (#161): the top bar holds only identity (logo, title,
share) on the left and the indicators cluster (warning lamps, target badge, sensor
status) on the right — no menu button there. A bottom action bar (`.bottombar`) holds
three controls instead: settings (opens the same hamburger menu as before, just moved),
sound (center, visually larger — a single mute/unmute toggle for `soundOnLevel` +
`soundGuidance` together, restoring their exact prior values on unmute rather than
forcing either back on), and help (opens the menu directly on its Help section). The
install prompt is unaffected — it still renders via the `#install-hint` banner under the
top bar. Because mute can change the two sound settings while the menu is closed, the
Settings page's own checkboxes resync from the live values (`SettingsFormElement.
resyncSoundFields`) every time the menu reopens, so a stale checkbox state can never
silently overwrite a mute on the next unrelated Save.

## Build / CI notes

The repository is text-only: PWA icons are rendered from `public/icons/icon.svg` by
`scripts/generate-icons.mjs` during `npm run build` and are gitignored. The `?demo`
flag replaces the sensor with a fixed tilt **and presents the app as configured** (no
warning lamps, in memory only), so screenshots and demos show the product rather than
the first-run state. The `?easylevel-sim` flag (R44) is its EasyLevel sibling: a
simulated BLE box behind the transport seam, for exercising the external-sensor flow
on machines (and CI screenshots) with no hardware. CI runs
`format:check`, `typecheck`, `test` and `build` on every branch; pushes to `main` deploy
`dist/` to GitHub Pages.
