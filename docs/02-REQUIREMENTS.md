# Requirements (behaviors)

These are written as **desired-state user behaviors** with Given/When/Then acceptance
criteria. Each maps to a GitHub issue. They describe how the finished system works — not
"changes". The implementation order is tracked in the MVP tracking issue.

## Audience & purpose

Libell helps a motorhome/RV owner level their vehicle on a pitch. The user lays the
phone flat inside the RV (on a table or floor) with the **top edge of the phone pointing
toward the front of the vehicle**. The app tells them which wheels to raise and by how
much, turned into a concrete plan for the ramps they actually own rather than a per-wheel
number in isolation (R21, R27), and shows a live level. There is **no account**. An
optional phone calibration cancels phone/case bias; without it the raw sensor is used.

Libell is an installable web app (PWA), so it runs on any modern phone from a single
URL and must keep working with no signal.

## R1 — The app is ready to use the moment it opens

- **Given** I open Libell
- **When** the page loads
- **Then** the title "Libell" is shown, the layout is usable with the phone lying flat,
  and the screen is kept awake via the Screen Wake Lock API while the app is in front.
- **Given** I am on iOS, where motion access requires a user gesture
- **When** the app opens
- **Then** a single clear "Start" button is shown, and one tap grants motion access and
  reveals the level. On Android no prompt appears at all.
- **Given** motion access is denied or the page is served over plain HTTP
- **Then** the app explains why it cannot read the tilt instead of showing a frozen level.

## R2 — The app senses how the vehicle is tilted

- **Given** the phone lies flat inside the RV, top edge toward the front
- **When** the vehicle (and phone) is tilted
- **Then** the app derives side/side (roll) and front/back (pitch) tilt from gravity,
  preferring `DeviceMotionEvent.accelerationIncludingGravity` and falling back to
  `DeviceOrientationEvent`, and the reading is smoothed so it does not jitter.

## R3 — The app computes how much to raise each wheel

- **Given** a known wheelbase, front and rear track width (mm) and the available ramp
  step heights (mm)
- **When** the vehicle is tilted by roll and pitch
- **Then** each wheel's required lift is `max(z) − z_i` (≥ 0) where
  `z_i = x_i·tan(roll) + y_i·tan(pitch)`, expressed in mm together with the available
  ramp step height closest to the lift ("no step" is a candidate too).
- Acceptance cases (these become unit tests):
  - **Flat** (gravity straight down) → every wheel lift is 0 and the RV is reported level.
  - **Pure roll** (tilted side to side) → the wheels on the lower side need lifting; the
    higher side is the reference (lift 0).
  - **Pure pitch** (tilted front to back) → the wheels on the lower end need lifting; the
    higher end is the reference (lift 0).
  - **Combined roll + pitch** → exactly three wheels need lifting; the single highest
    corner is the reference (lift 0).
  - **Step recommendation** → the recommended step is the configured height closest to
    the lift; a lift below half the smallest step recommends no step.

## R4 — A top-down RV view orients the user (UI hero)

- **Given** I am on the main screen
- **When** I look at the RV diagram
- **Then** I see a top-down outline of the RV with a big arrow labeled "Front", so I
  know how to place the phone (the arrow graphic alone carries the direction — the
  label has no arrow character of its own). The RV diagram is the focal element of
  the screen.

## R5 — Wheels that need raising are highlighted on the diagram

- **Given** the RV is not level
- **When** I look at the RV diagram
- **Then** each wheel is colored by what the ramp plan (R27) says about it: green when
  it ends within the tolerance with no ramp, orange when the plan says to drive it up
  on the shown step, red only when not even the highest step could fix that wheel by
  itself — move the vehicle instead — and toned-down gray (–) when it is low but gets
  no ramp: fewer ramps than low wheels, nothing to do at that wheel. A wheel a step
  could fix is never red, even while the global plan leaves it short. Colored wheels
  show their required lift in whole mm (muted for the gray state).

## R6 — Per-wheel readouts on the diagram and a clear "level" confirmation

- **Given** the RV is not level
- **Then** each wheel needing a lift shows, on the diagram itself, which ramp step to
  drive up onto above the wheel ("Step 2") with the step's height parenthesized and
  smaller, and the missing height in whole mm below the wheel; wheels within
  tolerance are green and unlabeled.
- **Given** all wheels are within tolerance
- **Then** a large green "Your RV is level!" message is shown under the diagram.

## R7 — A live bubble level (secondary)

- **Given** I am on the main screen
- **Then** a round bubble level in the middle of the RV diagram moves in real time with
  the tilt; it reads centered/green when within tolerance.

## R8 — The current tilt in degrees is visible

- **Given** I am on the main screen
- **Then** small gray text shows the current tilt in degrees as front/back and side/side.

## R9 — Vehicle parameters are configurable and persist

- **Given** I open Settings from the hamburger menu (which also holds Calibration and
  Help)
- **When** I edit Wheelbase (mm), Track width front (mm), Track width rear (mm), Ramp
  step heights
  (mm, semicolon-separated — a leveling ramp is a staircase, so every available height
  is listed, e.g. "20; 40; 60"), Number of ramps (R27), Waste-water drain (R27),
  Tolerance (mm a wheel may sit below the highest and
  still count as level), Stability (display hysteresis dead band in mm; 0 disables
  it), display unit (R14), theme (R15) or level chime (R16) and save
- **Then** the values persist across app restarts (`localStorage`) and immediately affect
  the calculation. The defaults are `DEFAULT_SETTINGS` in `src/domain/settings.ts` (see
  `docs/03-ARCHITECTURE.md` § Settings).
- **Given** the stored value is missing or corrupt
- **Then** the app falls back to the defaults rather than failing to start.
- **Given** the measurement fields (also in the wizard's measurements step, which
  reuses the same form)
- **Then** a short muted hint says where the numbers are found (registration document /
  handbook, or a tape measure — a few cm of error hardly matters).

## R10 — The app installs to the home screen and works offline

- **Given** I have opened Libell once with a connection
- **When** I later open it on a pitch with no signal
- **Then** the app loads and works fully offline.
- **Given** I am browsing Libell
- **When** I choose "Add to Home Screen" / "Install"
- **Then** it installs with its own Libell icon and opens standalone, without browser
  chrome.

## R11 — Phone calibration and dashboard warning lamps

- **Given** my phone or its case is not perfectly flat
- **When** I place the phone on a surface I know is level and tap "Calibrate now" in the
  menu
- **Then** the current tilt is stored (`localStorage`) as the zero point and subtracted
  from every reading; "Clear calibration" returns to the raw sensor. A reading that does
  not look flat (>15°) is rejected with an explanation.
- **Given** I have never saved vehicle settings, or never calibrated
- **Then** an amber warning lamp per item is shown in the top bar (like a car dashboard);
  tapping it opens the matching menu section, and it disappears once handled.

## R12 — Feedback without a backend

- **Given** I want to report a bug or suggest something
- **When** I open ☰ → Feedback, pick a category (Bug / Suggestion / Other), write a
  title and a description, and tap the button
- **Then** GitHub's new-issue page opens in a new tab, pre-filled with
  `[Feedback] {category}: {title}`, my description and app metadata (version, screen
  size, timestamp, user agent), and I post it under my own GitHub account.
- The submit button is disabled until both title and description are filled.
- Modeled on sbsommar's feedback feature (its 02-§73), adapted to a static site: no
  server, so no GitHub token ever ships in the client (ADR 0006).

## R13 — The app speaks Swedish and English

- **Given** my phone's language is any `sv*` locale
- **When** I open Libell
- **Then** every user-facing string is Swedish; any other locale gets English. A stored
  override (from settings) wins over auto-detection; an invalid stored value falls back
  to auto-detection.
- All strings go through `t()` in `src/ui/i18n.ts`; both dictionaries cover the same
  keys (enforced by a unit test).

## R14 — Lengths display in mm or cm

- **Given** I switch "Show lengths in" between mm and cm in Settings
- **Then** every displayed length (wheel lifts, step heights, settings chips) uses that
  unit — whole mm, or cm with at most one decimal — while storage and math stay mm.

## R15 — Theme follows the phone, or is forced

- **Given** the theme setting "Follow the phone" (default)
- **When** the phone switches between light and dark — even while the app is open
- **Then** the app follows, and the browser-chrome `theme-color` matches the palette in
  effect. Choosing Light or Dark forces that palette regardless of the phone.

## R16 — Reaching level is celebrated exactly once

- **Given** the vehicle becomes level while I watch the screen
- **Then** a brief full-screen ✓ overlay is shown and the phone vibrates; a chime
  sounds only if the opt-in "Chime when level" setting is on (audio is unlocked by the
  save gesture, satisfying autoplay policies).
- **Given** the vehicle then jitters around the tolerance boundary
- **Then** no further celebration fires: the trigger re-arms only after the vehicle has
  been clearly un-level (well past the tolerance, sustained for seconds) and a cooldown
  has passed, and never while the menu or the wizard is open or the page is hidden.
- **Given** the OS `prefers-reduced-motion: reduce` setting
- **Then** the ✓ overlay still appears immediately and communicates "level reached"
  just as clearly, but without its animated fade/scale — an instant state change
  instead (#124). Without that preference, the overlay's fade/scale is unchanged.
  The overlay is also always withdrawn instantly, with no animation, the moment the
  vehicle stops being level or the menu/wizard opens (correctness, not a motion
  preference — an animated ✓ lingering after the state has genuinely changed would
  misinform).

## R17 — Wrong phone pose pauses the guidance instead of misleading

- **Given** the phone is not lying flat (total tilt past ~25°) or is held in landscape
- **When** I look at the screen
- **Then** an overlay says what to do ("lay the phone flat" / "turn to portrait")
  instead of showing wrong wheel guidance; the overlay clears with hysteresis (only
  once clearly flat again) so it cannot flicker at the boundary.

## R18 — A first-run introduction, skippable and reopenable

- **Given** I open Libell for the very first time
- **Then** a three-step wizard runs: how to place the phone and how to read the answer
  (the wheel-state legend and the bubble), vehicle measurements (skippable — "use
  defaults"), calibration (skippable). It can be closed with ✕ at any
  point, warning lamps (R11) stay lit for whatever was skipped, and ☰ → "Show
  introduction" reopens it any time.

## R19 — Share the app

- **Given** I tap the share button in the top bar
- **Then** the phone's native share sheet opens with the app's address (Web Share
  API); where the API is missing the address is copied to the clipboard and a toast
  confirms; without a clipboard the address itself is shown.

## R20 — Install affordance matching the platform

- **Given** the browser offers a real install prompt (Chromium's
  `beforeinstallprompt`)
- **Then** an "Install" button appears in the top bar and replays the deferred prompt
  when tapped. On iOS, which has no install API, the button toggles a hint describing
  Share → "Add to Home Screen". When the app already runs standalone, no install UI
  appears.

## R21 — Ready-made ramps by name

- **Given** the Settings form's "Ready-made ramp" picker
- **When** I choose a model sold in camping shops (Thule, Fiamma, Milenco, Froli,
  Biltema, …)
- **Then** its step heights fill in; editing the heights afterwards switches the picker
  to "Custom set". A set matching a catalog model shows the model's name regardless of
  entry order, preferring the already-selected model when two share the same steps.
- **Given** I explicitly choose "Custom set" in the picker
- **Then** the choice holds — even while the steps still match a catalog model — so I
  can start from a preset and edit freely; auto-matching resumes once a model is
  picked again (or the form is repopulated).

## R22 — Caravan mode: single axle + jockey wheel

- **Given** the Settings form's Vehicle choice is "Caravan" (default: Motorhome)
- **When** I look at the main screen
- **Then** the diagram shows a caravan from above — drawbar and jockey wheel at the
  front, one axle pair — and the guidance splits by mechanism: roll drives a ramp
  recommendation for the low axle wheel (step name, height, lift — as for the
  motorhome), while pitch drives a signed jockey correction ("Crank up"/"Crank down"
  with the amount in mm). The jockey is never red — any amount is crankable.
- **Given** the caravan's measurements
- **Then** the wheelbase field reads "Axle to jockey wheel", the front track width is
  hidden (one axle), and the axle uses the rear track width; switching vehicle type
  rebuilds the level screen on save.
- **Given** tolerance and stability settings
- **Then** they apply to both corrections: level when the axle lift and the jockey
  correction are both within tolerance, with the same hysteresis behavior as the
  motorhome display. Decision record: ADR 0008.

## R23 — Boggie (tandem) axles

- **Given** the Settings choice "Rear axle" (motorhome) / "Axle" (caravan): Single
  (default) or Boggie
- **When** Boggie is chosen
- **Then** the diagram draws a wheel pair per side at the axle position sharing one
  color, glyph and label set — the recommendation applies to **both** wheels of the
  pair with equal steps — and the measurement hint adds that wheelbase /
  axle-to-jockey is measured to the centre of the axle pair.
- **Given** the leveling math, tolerance and hysteresis
- **Then** they are unchanged: a boggie is modeled as one leveling axle at its
  midpoint (ADR 0009). Twin wheels (dual mounting) are out of scope — same plane
  position, no setting.
- The caravan's track width field is labeled plain "Track width" (no "rear" on a
  single-axle vehicle); stored settings from older versions parse with axle Single.

## R24 — Vehicle zero position: calibrate the phone's spot, not just the phone

- **Given** the sensor calibration (R11) zeroes the phone/case but not the spot where
  the phone lies (a table tilting 0.4° in a level vehicle reads as a tilted vehicle)
- **When** the vehicle stands verifiably level (spirit level, or after leveling with
  the ramps) and the phone lies in its normal place
- **Then** "Set current position as level" in the Calibration section stores that
  placement's roll/pitch as the vehicle zero, and every reading is corrected by the
  **sum** of the sensor offset and the vehicle zero — back in its spot, the phone
  shows level even on a tilting table.
- **Given** the capture looks like more than placement tilt (>15°)
- **Then** it is rejected with an explanation, like the sensor calibration.
- **Given** a later sensor recalibration or clear
- **Then** the vehicle zero stays valid: it is stored sensor-corrected — pure
  placement tilt (ADR 0010).
- The amber calibration lamp (R11) clears when at least one of the two calibrations
  exists; the Calibration section shows each one's status with its own clear button.

## R25 — A rocking vehicle shows "Measuring…" instead of flickering advice

- **Given** the readings vary more than a small threshold within a short window
  (people walking around inside, the vehicle being positioned, the phone handled)
- **When** I look at the main screen
- **Then** the status line reads "Measuring…" and the level celebration cannot fire —
  momentary advice is suppressed rather than flickered. The wheel diagram stays at
  full opacity; dimming it on top of the status text was itself distracting (#96).
- **Given** the reading has been calm for about 1.5 seconds
- **Then** normal guidance returns. The detector is pure domain code
  (`src/domain/stillness.ts`, peak-to-peak over a rolling window on the smoothed
  signal) and starts stable, so a calm app shows guidance immediately.

## R26 — Calibration age and check

- **Given** a stored sensor calibration or vehicle zero
- **Then** its status line shows how old it is ("(14 days ago)" / "(för 14 dagar
  sedan)"), from a capture timestamp stored with the offsets; calibrations saved
  before timestamps existed stay valid and show no age.
- **Given** the Check button next to a stored calibration
- **When** the phone lies on a level surface (sensor) or in its normal spot with the
  vehicle verifiably level (vehicle zero)
- **Then** the app compares the current reading against the calibration's promise of
  zero and answers plainly: "Still good — off by 0.1°." or "Off by 0.8° — consider
  recalibrating." (threshold 0.3°); the recalibrate buttons are right there.
- The timestamp never leaves the device.

## R27 — Only as many ramps as you own, placed where they help most

- **Given** the Settings choice "Number of ramps" (1–4; default 2 — ramps are sold in
  pairs), motorhome mode
- **When** a combined roll + pitch tilt leaves more wheels below the highest corner
  than I have ramps
- **Then** the diagram never asks me to ramp more wheels than that: the plan picks the
  combination of wheels and steps that leaves the vehicle closest to level (smallest
  remaining height deficit, ADR 0011), a low wheel that gets no ramp is toned down
  (gray –, R5) rather than alarmed — there is nothing to do at it — and the status
  line counts only the wheels the plan asks me to drive up — or says the
  ramps are not enough when no placement helps at all. A boggie pair consumes two
  ramps (both wheels of the pair drive up, R23).
- **Given** no placement of my ramps reaches the tolerance
- **Then** the "ramps are not enough" status also conveys a rough magnitude — "close"
  when the best plan's residual deficit is within twice the tolerance, "far" beyond
  that — derived only from that deficit, never implying which way to move the vehicle
  or where a better spot is (tilt alone cannot say that).
- **Given** every wheel can be brought within the tolerance
- **Then** the plan uses as few ramps as possible and the vehicle reports level once
  I have driven up.
- **Given** the Settings choice "Waste-water drain" (none / left / right / front /
  rear; default none)
- **When** several placements of my ramps level the vehicle within the tolerance
- **Then** the app prefers the one leaving the drain side lowest, so the drains keep
  working — sink and shower water runs toward the outlet instead of pooling — never
  choosing a worse-than-tolerance solution or extra ramps just for
  drainage.
- The per-wheel required lifts (R3) are unchanged — the plan only decides which steps
  are recommended. Caravan mode is unaffected (one axle wheel is ever ramped, R22);
  its form hides both fields. Display hysteresis (R25's calm-display rules and the
  Stability dead band) applies to the plan too: it may not flap at boundaries.

## R28 — Help reads one fact per line, and an About page

- **Given** a Help section whose text is a list of facts (the screen indicators, the
  measurements, the calibration layers, good to know)
- **Then** each fact starts on its own line — the indicator colors in "Reading the
  screen" (green ✓ / orange ↑ / red ✕ / gray –, R5) are never one running paragraph.
  The breaks live in the i18n strings and render as real line breaks
  (`white-space: pre-line`, no `innerHTML`); onboarding step 1 reuses the same
  caption and gets the same breaks.
- **Given** the menu item "About" / "Om Libell"
- **When** I open it
- **Then** I see, in my language: what Libell is, that it works fully offline and
  only uses the network to fetch updates of the app itself (R10), that all data
  stays on the phone, and a link to the source code and license (MIT) on GitHub —
  opened in a new tab with `noopener`, loading nothing remote. The app version comes
  last, in small muted type like the footer on the main screen, and is omitted when
  the build has none.

## R29 — Appearance preset, independent of light/dark theme

- **Given** the Settings form
- **When** I open the Appearance field
- **Then** I can choose "Modern" (the redesigned surfaces and screens, ADR 0012 —
  default) or "Classic" (today's original look, a permanent, fully-supported
  choice, not just kept around for migration), combined freely with the Theme
  field (R15) — choosing either does not change whether the app follows the
  phone's light/dark scheme or a forced choice, and vice versa.
- **Given** a choice is made and saved, or nothing has ever been chosen
- **Then** the choice persists like every other setting and is restored on next
  launch; a fresh install, and settings stored before this preset existed, both
  resolve to Modern (#136) — an explicit Classic choice is never overridden.
- **Given** Modern is the preset in effect when the first-run wizard (R18) opens
- **Then** every step shows a row of bars — one per step, the current step's bar
  filled — instead of the "n / total" text, and the step heading is larger; step
  1's wheel-state legend shows one color-swatch-and-glyph row per status (with its
  own short text) instead of the illustration and caption; and each step's primary
  action is a filled pill button with any skip action shown as plain text beneath
  it — the same skip/next behavior as Classic, only restyled. Whichever preset was
  in effect when the wizard opened is what it keeps for that run, even if Modern is
  turned on or off from the embedded Settings step meanwhile; the next time the
  wizard opens it picks up the current preset.

## R30 — Continuous audio leveling guidance (opt-in)

- **Given** the opt-in "Continuous audio guidance" setting is on, alongside and
  independent of "Chime when level" (R16)
- **When** the vehicle is not yet level
- **Then** a short pulse repeats, speeding up and rising in pitch the closer the
  STABILIZED distance from level gets — the same stabilized figure the diagram
  itself shows (`src/domain/stability.ts`'s `DisplayResult`, never a raw sensor
  reading) — so the audio can never chatter faster than the display changes.
- **Given** the vehicle's stabilized distance is clearly and sustainedly getting
  closer to level, or clearly and sustainedly getting further away
- **Then** the pulse carries a distinct, non-alarming "improving" or "worsening"
  glide; a reading that has not sustainedly cleared the Stability dead band (R25,
  R27) keeps the previous direction — raw jitter or a momentary stabilizer bounce
  can never flip it.
- **Given** the setting is off (the default), the vehicle is moving or being
  positioned (R25's stillness detector says so), or the vehicle has just reached
  level
- **Then** no guidance pulse plays — reaching level is announced once by the
  existing R16 chime/vibration/overlay instead, with its own re-arm/cooldown, and
  the next departure from level starts direction tracking fresh.
- **Given** iOS's autoplay restrictions
- **Then** guidance audio reuses the same `unlockAudio()` gesture-unlock as the
  R16 chime — the same Settings-save gesture that unlocks one unlocks both.

## R31 — Saved level targets: switch between more than one intentional tilt

- **Given** no target preset has ever been selected (the default, "Normal")
- **Then** the app behaves exactly as it does today: leveling targets true level, and
  the main screen shows nothing about targets at all (regression guard; ADR 0013).
- **Given** the Targets menu section (reached from the menu, or from the main-screen
  badge below once a target is active), listing "Normal" first and then any saved
  presets
- **When** I tap "Save current tilt as new target" and type a name
- **Then** the current tilt — relative to whatever the sensor calibration and vehicle
  zero (R11, R24) already define as level — is captured and stored as a new preset
  under that name; a capture reading more than 15° from that zero is rejected, the
  same implausible-capture guard R24 already uses.
- **Given** a saved preset
- **When** I tap it in the Targets section
- **Then** it becomes the active target: every reading on the main screen is now
  measured against that preset's tilt instead of true level — a THIRD offset summed
  on top of the sensor calibration + vehicle zero sum (R24), never stored in the same
  field as either and never touched by redoing or clearing them (ADR 0013). A small
  badge appears on the main screen reading "Target: {name}" — the only thing the
  main screen ever shows about targets, and gone the instant "Normal" is picked
  again.
- **Given** a preset I no longer want
- **Then** its ✕ button deletes it; deleting the active one falls back to Normal
  automatically. "Normal" itself has no delete button and can never be selected away
  from existing — it is not a stored preset, so it can never be lost.
- **Given** the app is reloaded
- **Then** the saved presets and whichever one was active both survive, independent
  of sensor calibration and the vehicle zero — either of those can be redone or
  cleared without affecting a saved preset or which one is active.
- This is unrelated to the drain-side ramp tie-break (#93, R27, ADR 0011), which only
  chooses between placements already within tolerance and never deliberately
  overshoots it; a target preset here can deliberately aim for a non-level position.
  Everything is stored in `localStorage` only — no account, no backend.

## R32 — EasyLevel BLE box as an alternative measurement source (opt-in)

- **Given** a phone with Chrome/Android and Web Bluetooth support
- **When** the user opens the menu's "External sensor" page and taps "Connect
  EasyLevel sensor"
- **Then** the app pairs with the box over its `faf52c20-...` GATT service and the
  wheel/bubble UI updates from the box's readings exactly as it does from the phone's
  own sensor — same math, same diagram, same tolerance (ADR 0014's seam:
  `OrientationSensor.getGravity()` returns one shape regardless of source). The phone's
  own sensor is never replaced automatically; connecting is always an explicit,
  reversible choice.
- **Given** a browser without Web Bluetooth (e.g. Safari/iOS, most desktop browsers)
- **When** the user opens the menu
- **Then** the "External sensor" page is not shown at all — never a silent failure or a
  button that does nothing when tapped.
- **Given** the EasyLevel box is the active source
- **When** its BLE connection is lost (out of range, powered off)
- **Then** the main screen shows that the connection was lost instead of freezing on
  the last reading, and the menu's "Connect" action offers to reconnect (a new pairing
  gesture — Web Bluetooth has no silent background reconnect).
- **Given** the box's `faf52c21-...` notification payload (6× signed int16,
  little-endian: accelX/Y/Z, then optionally gyroX/Y/Z)
- **Then** only the accelerometer triplet is used, mapped directly into a
  `GravityVector` at whatever scale the box reports it — deliberately not
  reimplementing the box's own onboard filter, since the app's existing
  `atan2`-based roll/pitch math only depends on the ratio between the axes, not their
  absolute unit (see `src/sensor/easyLevelProtocol.ts`). The `faf52c22-...`
  characteristic (firmware version, temperature, calibration bytes) is read
  best-effort and not required for leveling to work; its exact layout beyond the
  firmware-version byte is undecoded and out of scope here.
