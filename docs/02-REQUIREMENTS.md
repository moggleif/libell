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
- **Then** I see a top-down outline of the RV with a big arrow pointing toward the
  front, so I know how to place the phone — the arrow shape alone carries the
  direction, with no "Front" text label next to it (screen-cleanup follow-up: the
  shape already says it). The RV diagram is the focal element of the screen.

## R5 — Wheels that need raising are highlighted on the diagram

- **Given** the RV is not level
- **When** I look at the RV diagram
- **Then** each wheel is colored by what the ramp plan (R27) says about it: green when
  it ends within the tolerance with no ramp, orange when the plan says to drive it up
  on the shown step, red only when not even the highest step could fix that wheel by
  itself — move the vehicle instead — and toned-down gray (–) when it is low but gets
  no ramp: fewer ramps than low wheels, nothing to do at that wheel. A wheel a step
  could fix is never red, even while the global plan leaves it short. Colored wheels
  show their required lift in whole mm (muted for the gray state); the gray state's
  own step line reads "No ramp" (screen-cleanup follow-up) rather than sitting blank,
  so it reads as "nothing to do here", never as "level".

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

- **Given** I tap the gear icon
- **Then** in Modern, it opens straight to the Settings tabs (General/Kalibrering/
  Vehicle/Ramps/Targets, screen-cleanup follow-up — General and Kalibrering lead since
  they color how the rest of the screen reads and are the other must-do besides the
  vehicle's own measurements) as its own page with a ✕ to
  close — no drawer at all, same "icon opens tabs directly, ✕ to close" shape as the "?"
  page (R38). Classic (no tabs) keeps a small ☰ drawer instead, holding just
  Settings/Calibration/Targets — Diagnostics, the introduction relaunch and
  External sensor moved off it entirely (to the "?" page and the top-right sensor
  icon, both reachable from Classic too, R38) since Classic has no tabs to fold
  them into. Help/About/Feedback are not part of either — reached only from the
  bottom bar's "?" button. Classic's own flat form gets the same General grouping as
  a plain section further down the page (below "Level & display"), not a tab, since
  Classic has no tabs to begin with.
- **When** I edit Wheelbase (mm), Track width front (mm), Track width rear (mm), Ramp
  step heights
  (mm, semicolon-separated — a leveling ramp is a staircase, so every available height
  is listed, e.g. "20; 40; 60"), Number of ramps (R27), Waste-water drain (R27),
  Tolerance (mm a wheel may sit below the highest and
  still count as level), Stability (display hysteresis dead band in mm; 0 disables
  it), Response delay (ms a reading must hold before the shown mm figure/plan changes)
  and Response delay while adjusting (ms, #183: a shorter delay used only for a wheel's
  live mm figure right after a change has just been adopted and a further change keeps
  the same direction — e.g. still driving up a ramp — never for the very first change or
  one reversing direction, so it can never weaken the noise guard above), display unit
  (R14), language (R13), theme (R15) or level chime (R16) and save
- **Then** the values persist across app restarts (`localStorage`) and immediately affect
  the calculation. The defaults are `DEFAULT_SETTINGS` in `src/domain/settings.ts` (see
  `docs/03-ARCHITECTURE.md` § Settings). Not the first-run wizard, which keeps its own
  Skip/Next flow — a successful Save here also returns to the main level screen (#159),
  so the effect is visible without an extra tap — regardless of which Modern tab
  (General/Kalibrering/Vehicle/Ramps/Targets) Save was tapped from.
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
- **When** I open "?" (Help, R38), switch to the Feedback tab, pick a category (Bug /
  Suggestion / Other), write a title and a description, and tap the button
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
- **Given** the Language field in Settings → General (Svenska / English / "Automatic
  (device language)", the last one being the default)
- **When** I pick a language other than the one currently in effect
- **Then** the choice is saved and the app reloads immediately — `t()` resolves its
  dictionary once at startup (not reactively), so a reload is the only way every
  already-built string picks up the change. Picking "Automatic" clears the stored
  override and reloads, going back to phone-locale detection.
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
- **Then** a brief full-screen ✓ overlay is shown and the phone vibrates; a chime also
  sounds unless the "Chime when level" setting has been explicitly turned off (on by
  default, #153 — audio is unlocked by the save gesture, satisfying autoplay
  policies). An install or settings blob that predates this default is treated the
  same as a fresh install: the chime is on unless the user has explicitly chosen off.
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

- **Given** I open Libell for the very first time, on a browser without Web Bluetooth
  support (R32's exact gate)
- **Then** a ten-step wizard runs: welcome (design review — what Libell is for, before
  any question), Language (skippable), Appearance — Theme + Appearance (skippable),
  Sound — Chime + Continuous audio guidance (skippable), which vehicle I'm leveling
  (motorhome or caravan — #184), how to place the phone and how to read the answer (the
  wheel-state legend and the bubble), vehicle measurements (skippable), ramp model/count
  (skippable), phone-sensor calibration (skippable), vehicle-zero position (skippable).
  It can be closed with ✕ at any point, warning lamps (R11) stay lit for whatever was
  skipped, and the "Show introduction" button at the top of the "?" page's Help tab
  (R28, screen-cleanup follow-up) reopens it any time.
- **Given** the welcome step (design review, always first)
- **Then** it shows what Libell does (the same one-line pitch the About page uses) and
  that the guide ahead is short and every step can be skipped and finished later. No
  form, no Skip control — there is nothing to configure here, only Next. No prior step
  used to explain why the following questions matter before asking them.
- **Given** the Language, Appearance and Sound steps (#189 introduced these as one
  combined "General" step; a later design review split it into one step per actual
  decision, not per what used to share a Settings section header)
- **Then** Language stands alone, right after welcome — it has to resolve before the
  rest of the guide is legible, a reason none of the other fields share (still applies
  via a full reload immediately on change, same as Settings). Theme and Appearance share
  a step, one "how it looks" decision. Chime and Continuous audio guidance share a step,
  one "what it sounds like" decision. All three reuse the exact fields/handlers Settings
  → General has. Each is skippable, using the shipped defaults; unlike the other
  skippable steps, skipping any of them never lights a warning lamp — the defaults are
  already a complete, valid choice.
- **Given** any step that embeds a real Settings form — Language, Appearance, Sound,
  measurements, ramps (design review)
- **Then** the embedded form shows only its fields — no Save/Undo/Reset row. A wizard
  step's Next already submits the form (see below), so a second, identically-styled
  "confirm" control next to Next no longer asks a first-time user to parse two
  different actions that do almost the same thing. Save/Undo/Reset are unaffected on
  the real, full Settings page — only the wizard's compact forms drop the row.
- **Given** the vehicle step (#184)
- **Then** it asks "What are you leveling?" with the same Motorhome/Caravan choice and
  labels Settings uses, pre-selected to whatever is already stored (not hardcoded to
  motorhome). Every later step reflects that choice: the placement and measurements
  illustrations draw the matching shape (a caravan gets its drawbar and jockey wheel,
  not a four-wheel box), the measurements step's field labels/visibility follow the same
  vehicle-aware rules the full Settings form already applies (axle-to-jockey distance,
  no front track width for a caravan), and the ramps step hides "Number of ramps" (a
  caravan ramps one wheel).
- **Given** the placement/legend step
- **Then** it does not repeat the opt-in "Continuous audio guidance" (R30) toggle or a
  tip about it — the Sound step a few steps before it already showed that exact toggle
  (#189, superseding #154's placement-step tip: pointing back at "Settings → General"
  for a setting the user could already see and flip a step earlier only re-raised the
  cognitive load #189 was trying to lower). The setting itself still stays off by
  default.
- **Given** the measurements step
- **Then** it shows only Wheelbase and Track width front/rear (#156) — the three
  numbers the step's own hint text says come from the registration document, labeled
  for whichever vehicle the vehicle step chose. Everything else the full Settings form
  has beyond what the Language/Appearance/Sound steps (#189) already covered (Rear axle
  — Vehicle tab; Tolerance, Stability — Advanced) is reachable from Settings afterward,
  not hidden from the app, just not shown on this reduced step. A short note on the
  step says so.
- **Given** the ramps step (design review: never had a wizard step before, despite
  being what the ramp catalog and per-wheel step guidance actually run on — arguably
  what most sets this app's leveling apart from a plain bubble-level or sensor-only
  competitor)
- **Then** it shows the same ready-made ramp model/custom step-height picker and ramp
  count Classic mode's own Ramps section uses — a single `<select>` + chip editor, not
  Modern's scrolling brand-filtered catalog grid, proportionate to a reduced first-run
  step either way. Drain position stays Advanced-tier, reachable from Settings
  afterward. Skippable, with the same warning-lamp consequence hint as measurements —
  skipping it leaves the shipped default ramp model in place, which may not match what
  the user actually owns.
- **Given** the phone-sensor calibration step and the vehicle-zero step (design review:
  split from one combined "Calibration" step into two)
- **Then** each embeds exactly one half of the exact same calibration UI Settings →
  Calibration shows — the sensor-calibration step gets flip-calibration/check/clear for
  the phone sensor, the vehicle-zero step gets set/check/clear for the vehicle zero
  position, never a reduced rendering of either that could drift from the real one
  (#184). Splitting halves how many buttons either screen shows at once, and the step
  order itself (sensor first, then vehicle zero) replaces the ordering hint a combined
  step used to need. Both remain independently skippable.
- **Given** Web Bluetooth support exists (an external sensor is actually a real option)
- **Then** the wizard opens with one extra step, "How do you want to measure?", right
  after the Sound step, offering "This phone" (pre-selected) or "External sensor" — the
  same name and wording the sensor-status icon and its page use (R32) elsewhere, never
  a separate "Libell Sensor" product name, which was never real; every other browser
  gets exactly the ten-step flow above, with no added step and no dead radio button
  (#135). The vehicle step always follows immediately after this one, so it is answered
  before either device path continues.
- **Given** the source step, with "This phone" left selected (the default)
- **Then** the rest of the wizard is the unchanged phone flow above (vehicle,
  placement, measurements, ramps, sensor calibration, vehicle zero).
- **Given** the source step, with the external sensor selected instead
- **Then** the wizard asks the vehicle step, then branches to the external sensor's own
  connect flow — the same External sensor page R32/R34 already describe, embedded
  whole rather than duplicated, which doubles as this path's calibration step (its own
  "Set vehicle level" installation offset, R34) — skippable on the same terms as the
  phone calibration steps it replaces, then rejoins the shared vehicle-measurements and
  ramps steps before finishing. No phone-placement step and no phone calibration steps
  are shown on this path.
- **Given** the source step is left unanswered (closed via ✕, or the wizard is never
  reopened)
- **Then** the app defaults to the phone sensor — the source step itself never writes
  any state, so an interrupted wizard can never leave the active source ambiguous.
- **Given** the source step, with the external sensor picked instead of "This phone"
  (style-consistency review follow-up)
- **Then** the "n / total" step count updates immediately, on the source step itself —
  not only once "Next" is pressed — since the external path has fewer steps than the
  phone path; the total shown must never be one a later choice on the same screen then
  falsifies.
- **Given** any step after the first (#189: a usability review of R18 for less
  tech-savvy users, e.g. seniors leveling their first motorhome)
- **Then** a "Back" button returns to the previous step without losing any choice
  already made — vehicle type, sensor source, and any measurements already entered in
  the settings step. A wrong tap no longer requires finishing the wizard and correcting
  it in Settings, or closing and restarting from step 1.
- **Given** the measurements step, with the vehicle's Wheelbase/Track width filled in
- **Then** tapping "Next" saves those values before advancing — the only way to persist
  them, since the step shows no separate Save button (see above).
- **Given** a skippable step (measurements, ramps, sensor calibration, vehicle zero,
  connect)
- **Then** its Skip control is paired with a one-line note that a warning lamp (R11)
  will remind the user later if they skip — not just "Skip" with no stated consequence.
  Its button reads plain "Skip", since skipping any of these does light that lamp; only
  the Language/Appearance/Sound steps' Skip reads "Skip — use defaults", since those are
  the skippable steps with no such consequence (style-consistency review follow-up).
- **Given** Modern appearance
- **Then** the step progress shows a visible "n / total" text next to the bars, not
  only an `aria-label` on them — legible at a glance, including for low-vision users.

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
- **Given** the "About" / "Om Libell" tab on the "?" page (R38)
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
- **When** the user opens the External sensor page and taps "Connect
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
- **When** its BLE connection is lost (out of range, powered off) while the app stays
  open
- **Then** the main screen shows that the connection was lost instead of freezing on
  the last reading, and the menu's "Connect" action offers to reconnect — during a live
  session this is always a fresh gesture-triggered pairing prompt (see #130 below for
  what "reconnect" means the next time the app is opened instead).
- **Given** the EasyLevel box is the active source and connected
- **Then** the top bar shows only a small, distinctly-colored connection-state dot —
  no numbers, no clutter (#129). While the phone's own sensor is active instead, the
  same dot stays visible but in a third, neutral "tap to connect" look rather than
  disappearing (screen-cleanup follow-up: it is now the only way to reach the
  External sensor page at all, R38) — visible whenever Web Bluetooth exists in this
  browser, hidden only when it doesn't. Tapping the dot opens the External sensor
  page, the same "tap the indicator to jump to its own page" pattern the R11 warning
  lamps use.
- **Given** the box disconnects, or its data goes stale
- **Then** the main-screen dot switches to a clearly different (warning) look — this
  dot is the visible half of the "never leave apparently-live instructions on screen"
  guarantee; the freeze/stale-data logic that backs it is separate (#132).
- **Given** the External sensor page, whether connected or disconnected
- **Then** it spells out the connection state in full, and shows battery and
  temperature as real decoded values once the first `faf52c22-...` status
  notification has arrived — "not available yet" only in the brief window before
  that, or before EasyLevel has ever connected (#123). Signal strength shows "not
  available yet" always: there is no reliable, cross-browser way to read RSSI from
  Web Bluetooth, and this page must never fabricate a number for it.
- **Given** the box's `faf52c21-...` notification payload (6× signed int16,
  little-endian: accelX/Y/Z, then optionally gyroX/Y/Z)
- **Then** only the accelerometer triplet is used, mapped directly into a
  `GravityVector` at whatever scale the box reports it — deliberately not
  reimplementing the box's own onboard filter, since the app's existing
  `atan2`-based roll/pitch math only depends on the ratio between the axes, not their
  absolute unit (see `src/sensor/easyLevelProtocol.ts`).
- **Given** the box's `faf52c22-...` status payload (#123, decoded from the official
  app's decompiled bytecode)
- **Then** bytes 2–3 (little-endian uint16 `rawMv`) give battery via
  `clamp(rawMv × 0.1 − 200, 0, 100)`; byte 7 gives the firmware tier (thresholds at
  32/48/64/80/96/112 → tiers 1–7) and selects the temperature formula — tier 1
  (byte7 < 32): `clamp(byte[0] / 16 + 25, −40, 80)`; tier 2+ (byte7 ≥ 32):
  `clamp(int16LE(bytes[0..1]) / 100, −40, 80)`. Bytes 8–19 (six little-endian int16
  zero/calibration values, tier ≥ 3 only) are unrelated to battery/temperature and
  were already read and used in the leveling math since #116. This characteristic is
  still read best-effort and never required for leveling to work.
- **Given** the EasyLevel box is the active source and its battery is low
- **When** its reported battery percentage drops below a threshold (20%, with a few
  percentage points of hysteresis so it doesn't flicker right at the line — see
  `easyLevelProtocol.ts`'s `isLowBattery`)
- **Then** a warning is shown on the External sensor page, never as
  a leveling-screen interruption — the main leveling view is unaffected either way.

## R33 — EasyLevel box: remember the selection and auto-reconnect on open (#130)

This requirement is scoped strictly to the PWA / Web Bluetooth path (#116's
implementation). A future iOS native bridge (#119) and any future Android native app
implement their own platform-appropriate reconnect behavior against this same
cross-platform goal — they are not this app's code and are not covered here.

- **Given** the user has successfully connected to an EasyLevel box at least once
- **Then** the app remembers that specific box's identity (its Web Bluetooth device id,
  `libell.easyLevelDeviceId`) and that EasyLevel was the active source
  (`sensorSource` in `libell.settings`), not merely "an EasyLevel box was used once" —
  both survive closing and reopening the app.
- **Given** a browser that implements Web Bluetooth's persistent-permissions API
  (`navigator.bluetooth.getDevices()` — Chrome/Android today) and a remembered box
- **When** the app is opened
- **Then** it reattaches to that same previously-authorized box (`getDevices()` to find
  it, `device.gatt.connect()` to reconnect) automatically, with **no** device picker and
  **no** user gesture — the ordinary use becomes open app → sensor reconnects → level,
  never a repeated pairing dance.
- **Given** the same situation, but the box is out of range, powered off, or its GATT
  connect otherwise fails
- **Then** the attempt fails cleanly — no retry loop, no repeated prompts — and the app
  honestly shows the box as the active-but-disconnected source via the same
  connection-lost UI a live drop uses (R32 above): the main-screen dot and the "External
  sensor" menu page, both offering the existing one-tap manual reconnect. The app never
  silently falls back to the phone's own sensor on the user's behalf — that is the
  user's own explicit "Disconnect" action, same as ever.
- **Given** a browser without `getDevices()` (Web Bluetooth's persistent-permissions API
  is not implemented everywhere `navigator.bluetooth` itself is) — or without Web
  Bluetooth at all
- **Then** silent auto-reconnect is not attempted (a browser without Web Bluetooth never
  had an EasyLevel box to remember in the first place, per R32); the box, if remembered,
  surfaces exactly as "connection lost" above, and a manual reconnect through the
  existing "Connect EasyLevel sensor" button still works — it just necessarily needs its
  own user gesture, since that is what a fresh `requestDevice()` picker always requires.
  This is a genuine platform ceiling, not a bug: the app never pretends a browser can
  auto-reconnect when it can't.
- **Given** the user taps "Disconnect" on the External sensor page
- **Then** the box stays remembered (its device id is not forgotten), but
  `sensorSource` reverts to `'phone'` — the next app open does not attempt to
  auto-reconnect until the user connects again, honoring an explicit "not right now"
  without an explicit "forget this box".

## R34 — EasyLevel box: installation calibration ("Set vehicle level")

- **Given** a permanently-mounted EasyLevel box, wired into the vehicle rather than
  laid flat like the phone
- **Then** the app does not ask for "place it flat" (R2's phone pose) — it asks the
  installer to level the _vehicle_ once and capture that as the box's own
  installation offset (ADR 0014's three-way calibration split), after which the
  box's physical orientation inside its enclosure stops mattering.
- **Given** the External sensor page, once EasyLevel is (or was) the active
  source
- **When** the vehicle stands verifiably level (spirit level, or after leveling with
  the ramps) and I tap "Set vehicle level"
- **Then** the app stores the current reading as the box's installation offset, and
  every subsequent reading from the box is corrected by it — the same "capture the
  current tilt as zero" mechanism R24 already gives the phone's vehicle zero, applied
  to this source instead.
- **Given** the capture looks like more than placement tilt (>15°)
- **Then** it is rejected with an explanation, the same guard R11/R24 already use.
- **Given** a stored installation offset
- **Then** its status line shows how old it is, reusing R26's "(14 days ago)" age
  display and Check verdict wording exactly, and a Clear button removes it.
- **Given** the phone's own sensor calibration and vehicle zero (R24), and the
  EasyLevel box's installation offset above
- **Then** they are stored completely independently (`libell.vehicleCalibration` vs.
  `libell.easyLevelInstallCalibration`): clearing or redoing one never touches, and is
  never touched by, the other, and switching the active source between the phone and
  the box switches which pair of offsets "level" is measured against without losing
  or corrupting either — mirroring how a target preset (R31) is never conflated with
  either calibration layer.
- The amber calibration lamp (R11) follows the same rule: it checks the phone's pair
  while the phone is active, or just the box's installation offset while EasyLevel
  is — never both pairs at once.
- This installation-offset step lives on the External sensor page (#116, R32),
  not inside the Calibration menu section, since it only makes sense once an external
  source exists to calibrate.

## R35 — Stale sensor data is never shown as live (#132)

A disconnected or stalled sensor silently freezing on its last reading while the app
keeps showing "drive forward" is actively dangerous — P0. This is a third, distinct
safety state: never R17's "wrong phone pose" overlay (the phone is flat, but the
_data itself_ can no longer be trusted), never R25's "Measuring…" (that needs new,
noisy samples to arrive; this fires when no new samples arrive at all).

- **Given** the active sensor (phone or EasyLevel box) has not delivered a fresh
  reading within its timeout — 2 seconds for the continuously-sampling phone sensor,
  4 seconds for the event-driven EasyLevel BLE box, whose notifications can
  legitimately have larger natural gaps — while `getGravity()` still returns its last
  non-null value
- **When** I look at the main screen
- **Then** the wheel/ramp guidance is hidden behind a clearly worded "no new sensor
  data" overlay instead of continuing to display the last reading as if it were live;
  the level celebration cannot fire while this overlay is shown.
- **Given** the EasyLevel box's GATT connection stays technically open but its
  notifications have simply stopped arriving
- **Then** this is caught the same way as an outright disconnect going unnoticed —
  staleness is judged purely by "time since the last real sample", never by
  connection state alone.
- **Given** fresh data resumes (the tab regains focus and `devicemotion` starts
  firing again, a stalled BLE box starts notifying again, ...)
- **Then** the overlay clears automatically the moment the next sample arrives — no
  manual action is needed purely to clear it. (Reconnecting a sensor that actually
  disconnected is a separate action, R33's job, not this one's.)
- The staleness check itself is one pure function shared by every
  `OrientationSensor` implementation (`domain/staleness.ts`): given the timestamp of
  the last real sample and the current time, has more than the timeout passed? Time
  is always a parameter, never read from the wall clock inside it, so it is fully
  unit-testable without real timers — the same discipline R25's stillness detector
  and the display stabilizer's dwell timers already follow.

## R36 — Sensor diagnostics page for development/support (#133)

A deeper, technical view of what the active sensor is actually doing — for
development and bug reports, never part of everyday leveling. It also absorbs the
earlier separate "angle/engineering detail view" idea: raw vs. calibrated roll/pitch
is a subset of what this page already shows, so it never became a second screen.
R8's always-visible main-screen degree readout is unaffected.

- **Given** I want to inspect what the app is actually measuring (development, or a
  bug report)
- **When** I open "?" (R38) and switch to the Diagnostics tab (screen-cleanup
  follow-up: to the right of Feedback, no longer behind the ☰ menu)
- **Then** a dedicated tab shows: the active sensor source (phone / EasyLevel) and
  its connection state (R32/R33), sample rate, time since the last sample, raw
  (uncalibrated) roll/pitch, calibrated roll/pitch (the same effective calibration —
  sensor bias + vehicle zero + active target, R24/R31 — the leveling math itself
  uses), the effective target preset's name or "Normal" (R31), battery/temperature/
  signal strength when available, and the running app version (R28's About page
  value, reused, not recomputed).
- **Given** I have never connected an external sensor
- **Then** every external-only field (battery, temperature, signal strength) reads
  "—" — never a broken or undefined display — and the page works entirely from the
  phone sensor.
- **Given** I want to report a problem
- **When** I tap "Copy diagnostics"
- **Then** a plain-text summary of everything on the page is copied to the clipboard,
  confirmed with a brief toast, ready to paste into a bug report — no network call of
  its own (R12's no-backend philosophy, the same one the Feedback form already
  follows).
- **Given** this page is never shown during normal leveling
- **Then** it is reachable only through the deliberate menu entry above — never a
  main-screen element, never opened automatically.
- Sample rate is reported, not measured: the phone sensor's `devicemotion`/
  `deviceorientation` events fire continuously once granted (tens of Hz), so it is
  described as "continuous (~60 Hz)"; the EasyLevel BLE box's notifications are
  event-driven with no fixed clock (R32/R35), so it is described as such rather than
  given a fabricated precise number — an honest approximation, not a live
  measurement, for a support-only page that is opened rarely and briefly.
- Battery/temperature show the same real decoded values R32 shows on the "External
  sensor" page (#123), read from the identical seam so the two pages can never
  disagree. Signal strength reuses R32's exact "not available yet" wording — never a
  second, slightly different phrasing, and never relaxed into a fabricated value.

## R37 — Sensor unavailable: an explicit Retry / "Use phone sensor" prompt (#134)

R32/R33 already report a lost or unreachable EasyLevel connection honestly (the
main-screen dot, the External sensor page, a failed silent reconnect at open).
This requirement makes that moment actionable instead of a dead end the user can only
fix by opening the menu — and, per ADR 0014, never by switching source on its own:
phone and EasyLevel keep independent calibration references, so an automatic,
unannounced switch could show a plausible-looking but wrong reading.

- **Given** EasyLevel is the active source and it cannot be reached — a live GATT
  disconnect, or a failed silent reconnect attempt at app open (R33) that never
  recovered
- **When** I look at the main screen
- **Then** instead of the plain "no reading yet" hint, a clear, non-blocking prompt is
  shown: "External sensor unavailable." with two actions, "Retry" and "Use phone
  sensor" — never a frozen or ambiguous screen.
- **Given** the fallback prompt is shown
- **When** I tap "Retry"
- **Then** the app makes exactly one silent reconnect attempt against the remembered
  box (the same `EasyLevelSensor.reconnect()` R33's own auto-reconnect uses, not a
  duplicate implementation) — no retry loop, no backoff. On success the prompt clears
  and leveling resumes on the external source; on failure the prompt simply stays (or
  reappears on the next frame), with nothing further attempted automatically.
- **Given** the fallback prompt is shown
- **When** I tap "Use phone sensor"
- **Then** the app switches the active source to the phone sensor via the exact same
  explicit switch the External sensor page's own "Disconnect" action already performs (never a
  parallel code path), and the prompt itself says plainly, before I tap, that this
  is not a like-for-like swap: the phone sensor needs the phone lying flat inside the
  vehicle (R1/R17), unlike a permanently-mounted box. If the phone is not already
  lying flat, R17's existing wrong-pose overlay reinforces the same point right after
  the switch — reused as-is, not duplicated here.
- **Given** I have switched to the phone sensor from this prompt
- **Then** nothing about EasyLevel's calibration (its own installation offset, R34) is
  reused or assumed for the phone — the phone's own calibration/vehicle-zero pair
  (R24) is what "level" means from this point on, per ADR 0014's three-way split.
- This prompt is deliberately not a second "sensor is down" surface: it is the
  actionable form of the same `!gravity`/`'disconnected'` case R32's connection-lost
  hint already covered, and it is distinct from R35's stale-data overlay (data still
  arriving, just old) — that overlay is unaffected and keeps clearing itself
  automatically the moment fresh samples resume.

## R38 — Bottom action bar: settings, sound, help (#161)

- **Given** the app loads, on any screen width
- **Then** the top bar shows only identity on the left (logo, title, share) and the
  indicators cluster on the right (warning lamps, target badge, sensor status) — no
  menu button there. The install prompt (R20) is unaffected, still using the
  `#install-hint` banner under the top bar. The sensor-status icon (R32/R33,
  screen-cleanup follow-up) is now the _only_ way to reach External sensor — it
  stays visible whenever Web Bluetooth exists at all (a neutral "tap to connect"
  look while the phone's own sensor is active, not just once EasyLevel is
  connected), opening its own page with a ✕ to close.
- **Given** the app loads
- **Then** a bottom action bar shows exactly three controls, spread across the bar
  (settings at the left edge, sound centered, help at the right edge — screen-cleanup
  follow-up: not clustered together in the middle): settings (a gear icon, R9 —
  Help/About/Feedback are not part of this menu at all), sound (visually larger —
  the primary, most-reached-for control), help ("?", opens its own page with Help
  (R28, "Show introduction" at the top of that tab), About (R28), Feedback (R12) and
  Diagnostics (R36) as tabs, in that order — a fully independent component from the
  Settings page/menu, never routed through its drawer or sharing its back-navigation
  state, so its close (✕) can never reveal the Settings drawer underneath).
- **Given** I tap the sound button while "Chime when level" (R16) and/or "Continuous
  audio guidance" (R30) are on
- **Then** both turn off together and the button shows a muted state.
- **Given** I tap the sound button again while muted
- **Then** both settings return to exactly the values they held before muting — muting
  never forces a setting back on that was already off before I muted.
- **Given** I mute or unmute from the bottom bar, then later open Settings
- **Then** the Chime/Continuous-audio-guidance checkboxes there reflect the change —
  never a stale display that could silently undo the mute on an unrelated Save.
