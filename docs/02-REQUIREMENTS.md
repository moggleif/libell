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
  reveals the level. On Android no prompt appears at all, even in Chrome 153+, which
  offers iOS's permission API too (#410).
- **Given** motion access is denied or the page is served over plain HTTP
- **Then** the app explains why it cannot read the tilt instead of showing a frozen level.

## R2 — The app senses how the vehicle is tilted

- **Given** the phone lies flat inside the RV, top edge toward the front
- **When** the vehicle (and phone) is tilted
- **Then** the app derives side/side (roll) and front/back (pitch) tilt from gravity,
  and the reading is smoothed so it does not jitter (which events are read and how:
  `docs/03-ARCHITECTURE.md` § Sensor).
- This describes the phone sensor. With an external sensor box (R33) the phone's own
  placement does not matter; the box is installed as R34 and R43 describe (#285).

## R3 — The app computes how much to raise each wheel

- **Given** a known wheelbase, front and rear track width (mm) and the available ramp
  step heights (mm)
- **When** the vehicle is tilted by roll and pitch
- **Then** each wheel's required lift is how far it sits below the highest wheel (≥ 0),
  expressed in mm together with the available ramp step height closest to the lift
  ("no step" is a candidate too). The formula is in `docs/03-ARCHITECTURE.md` § Leveling
  math; which steps the screen actually recommends is the ramp plan's call (R27).
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
- **Given** the level view on any phone from 375x553 CSS px upward, in either appearance
  and in every shipped language (#241 — reported from an iPhone, where the diagram was
  cut off mid-wheel and the action bar and footer were not visible at all)
- **Then** the top bar, the diagram, the status row when it has something to say, the
  tilt readout and the bottom action bar are all on screen at once and the page does not
  scroll. The version sits under the logo in the top bar (#251), not in a footer of its
  own beneath the action bar. The
  diagram is the elastic element: it takes the height the rest leaves and no more. The
  layout is sized to the _small_ viewport (the height with the browser's toolbars
  showing), so the action bar clears Safari's bottom bar and the home indicator.
- **Given** the diagram at any size it has been squeezed to
- **Then** it keeps the drawing's own proportions exactly — never stretched, never taller
  than the space it was given — and each floating wheel card still sits on the wheel it
  describes. The box around the drawing is deliberately wider than the drawing on Modern:
  that margin is where the wheel cards go, and they keep their readable width rather than
  narrowing or overlapping each other as the screen gets smaller.

## R5 — Wheels that need raising are highlighted on the diagram

- **Given** the RV is not level
- **When** I look at the RV diagram
- **Then** each wheel is colored by what the ramp plan (R27) says about it: green when
  it ends within the tolerance with no ramp, orange when the plan says to drive it up
  on the shown step, red only when not even the highest step could fix that wheel by
  itself — move the vehicle instead — and toned-down gray (–) when it is low but gets
  no ramp: fewer ramps than low wheels, nothing to do at that wheel. A wheel a step
  could fix is never red, even while the global plan leaves it short. Orange, red and
  gray wheels show their required lift (whole mm, or cm per R14). The gray wheel keeps
  its figure (#459, reversing #368) because the user may still put a board or similar
  under it; its step line reads "No ramp" (screen-cleanup follow-up) rather than
  sitting blank, so it never reads as "level".

## R6 — Per-wheel readouts on the diagram and a clear "level" confirmation

- **Given** the RV is not level
- **Then** each wheel needing a lift shows, on the diagram itself, which ramp step to
  drive up onto ("Step 2") and one height: the missing lift (unit per R14). The step's
  own height is not shown beside its name (#368): two millimetre figures side by side
  read as two answers. This holds in every appearance and for the caravan alike — Classic
  puts the step above the wheel and the lift below it, Modern puts both on the wheel
  card. Wheels within tolerance are green, unlabeled in Classic and "Done" (with the
  small lift left) in Modern.
- **Given** all wheels are within tolerance
- **Then** every wheel reads green and ticked, and the level celebration (R16) fires
  once. No sentence under the diagram says it as well (#252): "Your RV is level!" and
  "2 wheels to raise" were the wheel cards written out in words, and a line that only
  ever repeats the picture above it costs a row on every screen for nothing.
- **Given** the status row under the diagram
- **Then** it speaks only when it has something the diagram cannot show, and hides itself
  otherwise rather than holding a blank line: that readings cannot be trusted right now
  (R25's "Measuring…"), that the ramps cannot help here at all and roughly how far off
  they are ("close" or "way off", R27), and how little is left when nearly level. A
  grey wheel says _that_ the ramps fall short; only this row says by how much.

## R7 — A live bubble level (secondary)

- **Given** I am on the main screen
- **Then** a round bubble level in the middle of the RV diagram moves in real time with
  the tilt; it reads centered/green when within tolerance.

## R8 — The current tilt in degrees is visible

- **Given** I am on the main screen
- **Then** small gray text shows the current tilt in degrees as front/back and side/side.

## R9 — Vehicle parameters are configurable and persist

- **Given** I tap the gear icon
- **Then** in Modern, it opens straight to the Settings tabs as its own page with a ✕ to
  close — no drawer at all, same "icon opens tabs directly, ✕ to close" shape as the "?"
  page (R38). The tabs are, in this order, Vehicle, Ramps, Calibrate and zero, Level, General
  (#329; the third tab holds both the phone's calibration and the vehicle zero, so its
  name covers both, as Help's topic does, #516): the order a new owner sets things up in, with the app-wide preferences last.
  Settings first opens on Vehicle, and later on the tab it was left on. Classic (and
  Glossy, which shares its layout) has no tabs: the gear opens a small drawer ("Menu")
  instead, holding the same five in the same order as full-screen drawer pages. The
  introduction relaunch and Sensor box stay off this drawer entirely (on the "?"
  page and the top-right sensor icon, both reachable from Classic too, R38). Help/
  About/Feedback are not part of either — reached only from the bottom bar's "?"
  button.
- **Given** the five tabs or pages (#329)
- **Then** each holds one subject, with at most one sentence of hint per field and no
  "Advanced" section:
  - **Vehicle**: type, axle, the measurements (three; two for a caravan), one hint,
    and a quiet "Share to another phone" link (R41). No unit field.
  - **Ramps**: the ramp, its step heights and Number of ramps (R27, R47).
  - **Calibration**: R11/R24.
  - **Level**: Tolerance, Drain side (R27, hidden for a caravan) and the saved targets
    (R31).
  - **General**: Language, Theme, Appearance (no reload hint), Show lengths in (R14),
    the two sound switches with one sentence of hint, and a collapsed **More** holding
    Fine-tuning (Stability and both response delays) and "Reset all settings". More is
    never opened by itself, even when a value in it is not the default.
- **Given** Settings › General
- **When** I pick another Appearance or Language (both reload the app, unlike Theme,
  which applies live)
- **Then** the app reloads and opens straight back on Settings › General, so I see the
  result where I made the choice and can switch again (#345). An ordinary start never
  opens Settings by itself, and the first-run wizard's own Language and Appearance
  steps keep their place in the wizard.
- **When** I change any other field — Vehicle, the axle, Wheelbase, Track width front,
  Track width rear, the ramp and its step heights (R47), Number of ramps (R27),
  Tolerance (how far a wheel may sit below the highest and still count as level, ADR
  0003), Drain side (R27), Theme (R15), Show lengths in (R14), Chime when level (R16),
  Continuous audio guidance, Stability (0 turns it off), Response delay (ms) or
  Response delay while adjusting (ms) (what the last three do:
  `docs/03-ARCHITECTURE.md` § Leveling math)
- **Then** each change is stored the moment it is made (#328) — a select, switch, ramp
  choice or step height at once, a number field when I leave it or press Enter, never
  half-typed — persists across app restarts (`localStorage`) and immediately affects the
  calculation. There is no Save, Undo changes or Reset row on any tab or page, so
  closing Settings can never leave a change unsaved. A short toast says "Saved" with
  **Undo**, which puts the previous values back and stores them. The defaults are
  `DEFAULT_SETTINGS` in `src/domain/settings.ts` (see `docs/03-ARCHITECTURE.md` §
  Settings). Saving never closes the page; only ✕/back do. Not the first-run wizard,
  which keeps its own Skip/Next flow (R18).
- **Given** I type a number that cannot be used (empty, zero, or negative where only a
  positive value makes sense)
- **When** I leave the field
- **Then** the value in effect stays, in the field and in storage, and one line under the
  field says what was wrong and that the previous value still applies (#328). Nothing is
  blocked; the next usable value is saved as usual and the line goes away.
- **Given** a change is saved from Settings while an external sensor was picked or set
  up after Settings was opened
- **Then** the save keeps that sensor choice and its settings: Settings only ever writes
  the fields it shows (#328).
- **Given** General › More › "Reset all settings"
- **Then** every field on every tab goes back to its default and is stored, with the same
  Undo toast. The appearance and the language are kept, since changing either reloads
  the app.
- **Given** the stored value is missing or corrupt
- **Then** the app falls back to the defaults rather than failing to start.
- **Given** the measurement fields (also in the wizard's measurements step, which
  reuses the same form)
- **Then** a short muted hint says where the numbers are found: the registration
  document for a motorhome; for a caravan, whose first field is the axle-to-jockey
  distance that document does not list, to measure from the axle to the jockey wheel
  (#327). Either way, a few cm off doesn't matter. With a boggie it adds to measure to
  the centre of the axle pair.

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
- **When** I place the phone on a surface I know is level and tap "Calibrate now" in
  Settings › Calibration (step 1 below)
- **Then** the current tilt is stored (`localStorage`) as the zero point and subtracted
  from every reading; "Clear calibration" returns to the raw sensor.
- **Given** the reading does not look flat (>15° on either axis)
- **When** I tap "Calibrate now"
- **Then** nothing is stored yet: a warning says the surface does not look flat and the
  calibration would be wrong, with a "Calibrate anyway" button beside it; tapping that
  stores the reading, and it is still there after a reload (#411, never block — warn).
- **Given** the vehicle measurements have never been saved, or a calibration step is
  missing
- **Then** an amber warning lamp per item is shown in the top bar (like a car dashboard);
  tapping it opens where that item is done — Settings › Vehicle for "⚠ Measurements",
  Settings › Calibration (or, with a box, the box's own page) for the calibration
  lamp — and it disappears once handled.
- **Given** the vehicle measurements (wheelbase, track widths) have never been saved, or
  the wizard's measurements step was skipped
- **When** other settings (language, theme, sound) are saved
- **Then** the ⚠ Measurements lamp stays lit until a measurement is saved: changed in
  Settings, confirmed with Next on the wizard's measurements step, or imported from a
  shared vehicle setup (#364). Users whose settings were already stored before this
  rule keep an unlit lamp.
- **Given** the phone is the active sensor (#364)
- **Then** the amber lamp follows the Calibration checklist's order: **⚠ Calibrate**
  while the phone is not calibrated, then **⚠ Zero** while the vehicle is not zeroed
  (R24); both open Calibrate and zero (their tooltips name it, #516), which expands the step not yet done. Once both are
  done there is no amber lamp. With a box active the lamp is the box's ⚠ Zero, as
  before.
- **Given** the phone is the active sensor and Settings → Calibrate and zero is open (Modern tab
  or Classic page)
- **Then** it is a checklist of two steps, the same pattern as the box's own setup
  (R51, #330): **1. the phone** and **2. the vehicle zero** (R24). A done step shows ✓
  and its age (R26); an undone one its one action. Only the next undone step is
  expanded, every step opens on a tap, and a step showing a message (an error, a check
  result) stays open.
  - Step 1 says to lay the phone on something flat, with **Calibrate now**, and a quiet
    link "No flat surface? Flip the phone" that reveals the flip calibration. When the
    flip's two captures differ by more than 15° (the phone moved), nothing is stored
    yet: a warning says so, with "Calibrate anyway" to store that result (#425).
  - Step 2 says to level the vehicle with a spirit level and put the phone in its usual
    spot, with **Zero now**.
  - Check and Clear sit under a collapsed **More** in each step. There is no "Two
    layers" intro.
  - While an external box is active the steps are hidden and the box's own calibration
    shows in their place, as before (#316). The first-run wizard keeps its own
    one-calibration-per-step cards.
  - Whatever is active when Settings opens decides what Calibration shows, every time it
    opens, also when it reopens on the tab it was left on: a box disconnected or
    connected while Settings was closed is reflected at once (#351). The same holds
    while it stays open beneath the box's own page: connecting or disconnecting there
    redraws it, so closing the box page shows the right steps (#353).

- **Given** any text that names these steps, in any language (#349)
- **Then** "calibrate" is only ever the phone's own sensor (step 1, on a flat surface);
  setting the vehicle's level position is always "zero" (sv _nollställ_), with the phone
  and with a box alike. The calibration lamp reads "⚠ Calibrate" while the phone is the
  source and "⚠ Zero" while a box is (its title names the box). The Settings tab keeps
  the name Calibration.
- **Given** any zero action, phone or box, on any screen (#366)
- **Then** it has one heading per language, "Zero the vehicle" (sv _Nollställ fordonet_),
  never the box's model name or "on level ground".
- **Given** any text that names the box or a lost link to it, in any language (#366)
- **Then** the box is the "Sensor box" (sv _Sensorbox_) everywhere: the menu page, the
  list, the main-screen dot and the wizard's source choice; a lost link is "Lost
  contact" (sv _Tappade kontakten_). A lamp is named by its label, never its colour. The
  vehicle-measurements lamp reads "⚠ Measurements" (sv _⚠ Mått_) in every language.
- **Given** Swedish (#366)
- **Then** a ramp is always _kloss/klossar_, never _ramp_.
- **Given** text shown for any vehicle type (#366)
- **Then** it does not call a caravan a motorhome: the level overlay and the start hint
  say "vehicle". About and the welcome step do not promise "no spirit level", since
  zeroing asks for one.

## R12 — Feedback without a backend

- **Given** I want to report a bug or suggest something
- **When** I open "?" (Help, R38), switch to the Feedback tab, pick a category (Bug /
  Suggestion / Other), write a title and a description, and tap the button
- **Then** GitHub's new-issue page opens in a new tab, pre-filled with
  `[Feedback] {category}: {title}`, my description and app metadata (version, screen
  size, timestamp, user agent), and I post it under my own GitHub account.
- **Given** the title, the description or both are empty
- **Then** the submit button is still enabled, a warning above it names the empty
  field(s) and says the report can be sent anyway, and tapping the button sends it
  (#411, never block — warn).
- Modeled on sbsommar's feedback feature (its 02-§73), adapted to a static site: no
  server, so no GitHub token ever ships in the client (ADR 0006).

## R13 — The app speaks Swedish, English, French, Spanish and German

- **Given** my phone's language is any `sv*`, `fr*`, `es*` or `de*` locale
- **When** I open Libell
- **Then** every user-facing string is Swedish, French, Spanish or German respectively —
  the locale's language subtag decides, so `de-AT` is German too; any other locale gets
  English. A stored override (from settings) wins over auto-detection; an invalid stored
  value falls back to auto-detection.
- **Given** the Language field in Settings → General ("Automatic (device language)"
  first and the default, then Deutsch / English / Español / Français / Svenska — each
  language named in itself rather than translated, and listed alphabetically by that
  name, so the order is the same whichever language is in effect and Automatic is
  always on top)
- **When** I pick a language other than the one currently in effect
- **Then** the choice is saved and the app reloads immediately — `t()` resolves its
  dictionary once at startup (not reactively), so a reload is the only way every
  already-built string picks up the change. Picking "Automatic" clears the stored
  override and reloads, going back to phone-locale detection.
- All strings go through `t()` in `src/ui/i18n.ts`; every dictionary covers the same keys
  with the same `{placeholders}` (both enforced by a unit test).

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
  sounds unless the "Chime when level" setting has been explicitly turned off (default:
  `DEFAULT_SETTINGS` in `src/domain/settings.ts`, #153 — audio is unlocked by a user
  gesture, satisfying autoplay policies: the first tap or key press anywhere after
  launch, so the chime works after a reload without touching Settings or mute, #396). An install or settings blob that predates
  this default is treated the same as a fresh install: the chime is on unless the user
  has explicitly chosen off.
- **Given** the vehicle then jitters around the tolerance boundary
- **Then** no further celebration fires: the trigger re-arms only after the vehicle has
  been clearly un-level (well past the tolerance, sustained for seconds) and a cooldown
  has passed, and never while a page (Settings, Help, a sensor page) or the wizard is
  open or the app is hidden.
- **Given** the OS `prefers-reduced-motion: reduce` setting
- **Then** the ✓ overlay still appears immediately and communicates "level reached"
  just as clearly, but without its animated fade/scale — an instant state change
  instead (#124). Without that preference, the overlay's fade/scale is unchanged.
  The overlay is also always withdrawn instantly, with no animation, the moment the
  vehicle stops being level or a page/the wizard opens (correctness, not a motion
  preference — an animated ✓ lingering after the state has genuinely changed would
  misinform).

## R17 — Wrong phone pose pauses the guidance instead of misleading

- **Given** the phone is not lying flat (total tilt past ~25°) or is held in landscape
- **When** I look at the screen
- **Then** an overlay says what to do ("lay the phone flat" / "turn to portrait")
  instead of showing wrong wheel guidance; the overlay clears with hysteresis (only
  once clearly flat again) so it cannot flicker at the boundary.
- **Given** an external sensor box is the active source (R33, R40)
- **Then** none of the above applies: the box is permanently mounted, so the phone's
  pose is irrelevant and the phone may lie anywhere or be held in landscape. The only
  pose check left is on the box itself: if it is tilted past 45° (cleared again below
  40°) — lying on its side, hanging on a wall — or reads fully upside-down (R43), the
  overlay says the sensor sits in an extreme position, or looks mounted upside-down,
  instead of guidance (#285). A vehicle on ramps tilts a mounted box by only a few
  degrees, far below that limit.
- **Given** that box is one built to stand upright (the Xparkle box, R49)
- **Then** the overlay says it seems to be lying down and must be mounted standing, and
  never tells the user to lay it flat or face up (#304); the EasyLevel box, which is
  mounted flat, keeps the flat wording.
- **Given** that overlay is shown for an external sensor
- **Then** it also says how the box must sit to measure right (lying flat, top up; or
  standing up for a box built to stand) and carries a "Show the box" ("Visa boxen")
  button that goes straight to that sensor's own page (R40), not the source list
  (#285). That page opens on top of the overlay, which stays hidden while the page is
  open and returns after closing it only if the sensor still sits wrong (#297).

## R18 — A first-run introduction, skippable and reopenable

- **Given** I open Libell for the very first time, on a browser without Web Bluetooth
  support (R32's exact gate)
- **Then** a nine-step wizard runs: welcome (design review — what Libell is for, before
  any question), Language, Appearance — Theme + Appearance, Sound — Chime + Continuous
  audio guidance, which vehicle I'm leveling (motorhome or caravan — #184), how to place
  the phone and how to read the answer (the wheel-state legend and the bubble), vehicle
  measurements (skippable), ramp model/count (skippable), phone-sensor calibration.
  Nothing has to be done to go on: Next always advances. It can be closed with ✕ at any
  point, warning lamps (R11) stay lit for whatever was left undone, and the "Show introduction" button below the "?" page's Help topics
  (R28, screen-cleanup follow-up) reopens it any time. That button reads green
  (primary) until the wizard has actually been stepped through to its end at least
  once — an early ✕ does not count, even though it still counts for the auto-launch
  gate above (design review, follow-up); once truly completed, it turns secondary, a
  plain re-launch rather than an unfinished first-run task.
- **Given** the welcome step (design review, always first)
- **Then** it shows what Libell does (the same one-line pitch the About page uses) and
  that the guide ahead is short and every step can be skipped and finished later from
  Settings. Where an external sensor is an option (R32's gate) it adds that a sensor is
  connected any time with the sensor icon at the top right (#365) — the box is not in
  Settings. No form, no Skip control — there is nothing to configure here, only Next.
- **Given** the Language, Appearance and Sound steps (#189 introduced these as one
  combined "General" step; a later design review split it into one step per actual
  decision, not per what used to share a Settings section header)
- **Then** Language stands alone, right after welcome — it has to resolve before the
  rest of the guide is legible, a reason none of the other fields share (still applies
  via a full reload immediately on change, same as Settings). Theme and Appearance share
  a step, one "how it looks" decision. Chime and Continuous audio guidance share a step,
  one "what it sounds like" decision. All three reuse the exact fields/handlers Settings
  → General has. Each has only Back and Next (#365): the form shows the shipped
  defaults until changed, so a Skip did exactly what Next does.
- **Given** any step that embeds a real Settings form — Language, Appearance, Sound,
  measurements, ramps (design review)
- **Then** the embedded form shows only its fields, and is saved by the step's Next (see
  below) rather than on each change as on the full Settings page (#328): no Undo toast,
  no "Reset all settings".
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
  cognitive load #189 was trying to lower). The setting itself keeps its default
  (`DEFAULT_SETTINGS` in `src/domain/settings.ts`).
- **Given** the measurements step
- **Then** it shows only Wheelbase and Track width front/rear (#156) — the three
  numbers the step's own hint text says come from the registration document, labeled
  for whichever vehicle the vehicle step chose. Everything else the full Settings form
  has beyond what the Language/Appearance/Sound steps (#189) already covered (Rear axle
  — Vehicle tab; Tolerance — Level tab; Stability — General › More) is reachable from
  Settings afterward,
  not hidden from the app, just not shown on this reduced step.
- **Given** the ramps step (design review: never had a wizard step before, despite
  being what the ramp catalog and per-wheel step guidance actually run on — arguably
  what most sets this app's leveling apart from a plain bubble-level or sensor-only
  competitor)
- **Then** it shows the same ready-made ramp model/custom step-height fields and ramp
  count the Settings form uses, in their compact form — a single "Ready-made ramp"
  `<select>` + chip editor, not the Settings Ramps page's "Change ramp" brand-filtered
  catalogue (#331), proportionate to a reduced first-run step. "Drain side" is on the
  Level tab, reachable from Settings afterward. Skippable, with a note that skipping
  leaves the shipped default ramps in
  place (which may not match what the user actually owns) and that they can be picked
  later in Settings.
- **Given** the phone-sensor calibration step (#365: one path for zeroing)
- **Then** it embeds the phone-calibration half of the same calibration component
  Settings → Calibrate and zero uses (calibrate, or flip where nothing is flat), as a card
  rather than Settings' checklist step, never a reduced rebuild that could drift from
  the real one (#184) — without Check / Clear, which a first run has no use for and
  Settings keeps under More. The wizard does not ask to zero the
  vehicle: a first run is usually at home, not parked level, so a short line says the
  vehicle is zeroed the first time the user parks on level ground, and the ⚠ Zero lamp
  (R11) reminds until it is done — the same advice the box path gives. It is the
  phone path's last step.
- **Given** Web Bluetooth support exists (an external sensor is actually a real option)
- **Then** the wizard opens with one extra step, "How do you want to measure?", right
  after the Sound step, offering "This phone" (pre-selected) or "Sensor box" — the
  same name and wording the sensor-status icon and its page use (R32) elsewhere, never
  a separate "Libell Sensor" product name, which was never real; every other browser
  gets exactly the nine-step flow above, with no added step and no dead radio button
  (#135). The vehicle step always follows immediately after this one, so it is answered
  before either device path continues.
- **Given** the source step, with "This phone" left selected (the default)
- **Then** the rest of the wizard is the phone flow above (vehicle, placement,
  measurements, ramps, sensor calibration).
- **Given** the source step, with the external sensor selected instead
- **Then** the wizard asks the vehicle step, then branches to two steps built from the
  box's own pages — Connect (R32's list), then the box's position, checked live (R51's
  first step) — standing in for the phone calibration step it replaces; Next goes on
  from both, connected or not (#365). With no box connected the position step says so
  and that Next goes on, never an endless "waiting for a reading"; should a connection
  started on the previous step land while it is shown, it switches to the live
  position. Direction and zero are not asked here (#317): the zero needs level
  ground, which a first run rarely has, so the step says they are set the first time
  the user parks, guided by the box's page and reminded by the ⚠ Zero lamp (R34). A
  "Reading the screen" step follows — the placement step's legend half on its own, since
  how to read the answer still matters with a box (#285) — and the path then rejoins
  the shared vehicle-measurements and ramps steps before finishing. No phone-placement
  step and no phone calibration steps are shown on this path.
- **Given** the wizard was finished on the external-sensor path with no box connected
  (#365)
- **Then** the phone stays the active source (the wizard never switches it), but the
  amber lamp asks for the box — ⚠ Zero, opening the sensor list to connect one — not
  ⚠ Calibrate for a phone the user chose not to use. This lasts until a box connects,
  the phone is calibrated or zeroed after all, or the wizard is finished on the phone
  path.
- **Given** the source step is left unanswered (closed via ✕, or the wizard is never
  reopened)
- **Then** the app defaults to the phone sensor — the source step itself never writes
  any state, so an interrupted wizard can never leave the active source ambiguous.
- **Given** an external sensor is already the active source when the wizard opens, and I
  pick "This phone" on the source step (#287)
- **Then** the phone path leaves out the phone calibration step — its actions are hidden
  while a box is active (#285, #316), and the wizard
  never switches the source itself (ADR 0014; ✕ still leaves the source exactly as it
  was). The source step says so while a box is active: choosing the phone skips the phone
  calibration, and to calibrate the phone, open the box with the sensor icon at the top
  right and tap "Disconnect" there first. The box's own calibration (R34, R49) is unaffected. With the phone already
  active, the wizard is unchanged.
- **Given** the source step, with the external sensor picked instead of "This phone"
  (style-consistency review follow-up)
- **Then** the "n / total" step count updates immediately, on the source step itself —
  not only once "Next" is pressed — since the external path and the phone path differ
  in length; the total shown must never be one a later choice on the same screen then
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
- **Given** a vehicle type picked in the wizard that differs from the stored one
- **When** I skip the measurements step (or every form step)
- **Then** every later step still follows the picked vehicle (a caravan's ramps step has
  no ramp count), and reaching the end stores the picked vehicle type (#397).
- **Given** any step (#365, reworking #189's one generic note)
- **Then** a Skip button is shown only where Next would save something — measurements
  and ramps; everywhere else Next is the one way on. A step that can leave something
  undone carries a note specific to it — measurements: the defaults are used and
  ⚠ Measurements stays lit until saved; ramps: the default ramps are used and can be
  picked later in
  Settings; phone calibration: no flat surface now, tap Next and ⚠ Calibrate reminds;
  connect: no box at hand, tap Next and connect later with the sensor icon — and steps
  with nothing to leave undone have no note. The note names the real lamp and button in
  every language, and sits right above the wizard's own controls (#239), not at the end
  of the step's content.
- **Given** any step of the wizard, on any phone (#239 — reported from an iPhone, where
  the buttons sat below the fold on half the steps), in either appearance and in every
  shipped language
- **Then** the step count, the ✕, the step heading and the Back/Skip/Next controls are on
  screen at all times: they are never scrolled away, whatever the step contains. Only the
  step's own content may scroll, inside its own region — and on the phone sizes tested
  (375x553 upward, i.e. an iPhone SE in Safari and everything larger) no step needs even
  that, in either appearance and in every shipped language. The wizard is sized to the
  _small_ viewport (the height with the browser's toolbars showing) and its bottom padding
  clears the home indicator, so the last control is never left under Safari's bottom bar.
- **Given** the step that embeds the calibration card (sensor calibration), in either
  appearance
- **Then** the card's own heading — word for word the step's heading directly above it —
  is not repeated: Modern's status pill ("NOT DONE" / "DONE") moves onto the step heading
  and the duplicate row goes, Classic's bare heading goes the same way, and inside the
  wizard the card drops its frame, which the step screen already provides (#239).
  Settings' own copy of the same card is unaffected.
- **Given** the Modern step-progress bars, on a narrow screen or a long step list
- **Then** the bars share out the width left over instead of claiming a fixed width each,
  and the "n / total" text beside them stays on one line (#239: eleven bars overflowed a
  375 px header and wrapped that text into a three-line stack).
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

- **Given** Settings → Ramps' "Change ramp" catalogue (filterable by brand, #246), or
  the wizard's compact "Ready-made ramp" picker (R18)
- **When** I choose a model sold in camping shops (the catalog is `RAMP_MODELS` in
  `src/domain/ramps.ts`)
- **Then** its step heights fill in and it shows as "Selected"; in the compact picker,
  editing the heights afterwards switches it to "Custom set" (the Ramps page offers the
  step editor only under "Custom set"). A set matching a catalog model shows the
  model's name regardless of entry order, preferring the already-selected model when
  two share the same steps.
- **Given** I explicitly choose "Custom set" (catalogue or picker)
- **Then** the choice holds — even while the steps still match a catalog model — so I
  can start from a preset and edit freely; auto-matching resumes once a model is
  picked again (or the form is repopulated).
- **Given** the step-height field is empty or holds 0 or a negative number
- **When** I tap "Add step"
- **Then** the button is never greyed out: nothing is added, the typed value stays, and
  the same line as the other number fields ("Enter a number above 0…") says what to fix
  until I type again; a positive number is added and the field cleared (#514).

## R22 — Caravan mode: single axle + jockey wheel

- **Given** the Settings form's "Vehicle" choice is "Caravan" ("Husvagn")
- **When** I look at the main screen
- **Then** the diagram shows a caravan from above — drawbar and jockey wheel at the
  front, one axle pair — and the guidance splits by mechanism: roll drives a ramp
  recommendation for the low axle wheel (step name and lift — as for the motorhome,
  R6), while pitch drives a signed jockey correction ("Crank up"/"Crank down" with the
  amount in mm). The jockey is never red — any amount is crankable.
- **Given** appearance Modern (#368)
- **Then** the caravan is drawn in the Modern style like the motorhome, with the same
  wheel cards: one per axle side in the margins, and one for the jockey wheel centred on
  the drawbar where the wheel is. Classic and Glossy keep the Classic drawing.
- **Given** Help → "Reading the screen"
- **Then** one line of its own explains the jockey wheel's "Crank up"/"Crank down" and
  its amount (#368).
- **Given** the caravan's measurements
- **Then** the wheelbase field reads "Axle to jockey wheel", the front track width is
  hidden (one axle), and the axle uses the rear track width; switching vehicle type
  rebuilds the level screen as soon as it is changed (every change saves at once,
  #328).
- **Given** tolerance and stability settings
- **Then** they apply to both corrections: level when the axle lift and the jockey
  correction are both within tolerance, with the same hysteresis behavior as the
  motorhome display. Decision record: ADR 0008.

## R23 — Boggie (tandem) axles

- **Given** the Settings choice "Rear axle" (motorhome) / "Axle" (caravan): "Single" or
  "Tandem (boggie)" ("Enkel" / "Boggie")
- **When** "Tandem (boggie)" is chosen
- **Then** the recommendation applies to **both** wheels of the pair with equal steps:
  the Classic (and Glossy) diagram draws a wheel pair per side at the axle position
  sharing one color, glyph and label set, while Modern keeps one wheel card per side,
  as for a single axle. The measurement hint adds that wheelbase / axle-to-jockey is
  measured to the centre of the axle pair.
- **Given** the leveling math, tolerance and hysteresis
- **Then** they are unchanged: a boggie is modeled as one leveling axle at its
  midpoint (ADR 0009). Twin wheels (dual mounting) are out of scope — same plane
  position, no setting.
- The caravan's track width field is labeled plain "Track width" (no "rear" on a
  single-axle vehicle); stored settings from older versions parse with axle Single.

## R24 — Vehicle zero position: zero the phone's spot, not just calibrate the phone

- **Given** the sensor calibration (R11) corrects the phone/case but not the spot where
  the phone lies (a table tilting 0.4° in a level vehicle reads as a tilted vehicle)
- **When** the vehicle stands verifiably level (spirit level, or after leveling with
  the ramps) and the phone lies in its normal place
- **Then** "Zero now" ("Nollställ nu") in the Calibration section's "Zero the
  vehicle" step stores that placement's roll/pitch as the vehicle zero, and every
  reading is corrected by the
  **sum** of the sensor offset and the vehicle zero — back in its spot, the phone
  shows level even on a tilting table.
- **Given** the capture looks like more than placement tilt (>15°)
- **Then** nothing is stored yet: a warning asks whether the vehicle really is level,
  with a "Zero anyway" button beside it; tapping that stores the zero, like the sensor
  calibration (R11, #411).
- **Given** a later sensor recalibration or clear
- **Then** the vehicle zero stays valid: it is stored sensor-corrected — pure
  placement tilt (ADR 0010).
- The amber calibration lamp (R11) clears only when both calibrations exist: it reads
  ⚠ Calibrate, then ⚠ Zero (#364); the Calibration section shows each one as a
  checklist step, done or not, with its own clear button ("Clear calibration" /
  "Forget the zero") under "More" (#330).

## R25 — A rocking vehicle shows "Measuring…" instead of flickering advice

- **Given** the readings vary more than a small threshold within a short window
  (people walking around inside, the vehicle being positioned, the phone handled)
- **When** I look at the main screen
- **Then** the status line reads "Measuring…" and the level celebration cannot fire —
  momentary advice is suppressed rather than flickered. The wheel diagram stays at
  full opacity; dimming it on top of the status text was itself distracting (#96).
- **Given** the reading has been calm for about 1.5 seconds
- **Then** normal guidance returns. The detector (`src/domain/stillness.ts`) starts
  stable, so a calm app shows guidance immediately.

## R26 — Calibration age and check

- **Given** a stored sensor calibration or vehicle zero
- **Then** its Calibration step's title shows how old it is ("Phone calibrated (14 days
  ago)" / "Zeroed (14 days ago)"; "Telefonen kalibrerad (för 14 dagar sedan)"), from
  a capture timestamp stored with the offsets; calibrations saved before timestamps
  existed stay valid and show no age.
- **Given** the "Check" button under a stored calibration's "More"
- **When** the phone lies on a level surface (sensor) or in its normal spot with the
  vehicle verifiably level (vehicle zero)
- **Then** the app compares the current reading against the calibration's promise of
  zero and answers plainly: "Still good — off by 0.1°." or "Off by 0.8° — consider
  recalibrating." (threshold 0.3°); for the vehicle zero the advice is to zero again
  ("…consider zeroing again.", "…överväg att nollställa om.", #506), never to
  recalibrate. The answer shows in that same step; the calibrate / zero button is
  right there.
- The timestamp never leaves the device.

## R27 — Only as many ramps as you own, placed where they help most

- **Given** the Settings choice "Number of ramps" ("Antal klossar"; range and default:
  `MAX_RAMP_COUNT` and `DEFAULT_SETTINGS` in `src/domain/settings.ts`), motorhome mode
- **When** a combined roll + pitch tilt leaves more wheels below the highest corner
  than I have ramps
- **Then** the diagram never asks me to ramp more wheels than that: the plan picks the
  combination of wheels and steps that leaves the vehicle closest to level (smallest
  remaining height deficit, ADR 0011), a low wheel that gets no ramp is toned down
  (gray –, R5) rather than alarmed — no ramp goes there, though it still shows its lift (#459). The wheel cards
  alone say which wheels to drive up (the status line no longer counts them, #252);
  the status line says the ramps are not enough when no placement helps at all. A
  boggie pair consumes two
  ramps (both wheels of the pair drive up, R23).
- **Given** no placement of my ramps reaches the tolerance
- **Then** the "ramps are not enough" status also conveys a rough magnitude — "close"
  when the best plan's residual deficit is within twice the tolerance, "far" beyond
  that — derived only from that deficit, never implying which way to move the vehicle
  or where a better spot is (tilt alone cannot say that).
- **Given** every wheel can be brought within the tolerance
- **Then** the plan uses as few ramps as possible and the vehicle reports level once
  I have driven up.
- **Given** the Settings choice "Drain side" ("Avloppssida", Level tab) — none, a
  side/axle middle (left / right / front / rear, the mean of that edge's two wheels) or
  a single corner (front-left / front-right / rear-left / rear-right, design review)
- **When** several placements of my ramps level the vehicle within the tolerance
- **Then** the app prefers the one leaving the configured wheel(s) lowest, so the
  drains keep working — sink and shower water runs toward the outlet instead of
  pooling — never choosing a worse-than-tolerance solution or extra ramps just for
  drainage.
- The per-wheel required lifts (R3) are unchanged — the plan only decides which steps
  are recommended. Caravan mode is unaffected (one axle wheel is ever ramped, R22);
  its form hides both fields. Display hysteresis (R25's calm-display rules and the
  Stability dead band) applies to the plan too: it may not flap at boundaries.

## R28 — Help: short fold-out topics, one fact per line, and an About page (#326)

- **Given** I open the Help tab on the "?" page (R38)
- **Then** I see a list of topics, in this order: Reading the screen, Place the phone
  like this, Enter the measurements, Ramps, Calibrate and zero, Sensor box, Targets and
  sound, If something is wrong — with "Show introduction" below the list. Only "Reading the
  screen" is unfolded; every other topic is one heading line, so the whole list fits a
  phone screen. Every time the page reopens it folds back to that state.
- **When** I tap a topic's heading
- **Then** that topic unfolds and any other open topic folds (one open at a time); a
  second tap folds it again. The heading row is the whole tap target, with a chevron
  that turns when open.
- **Given** a topic's text
- **Then** it is a few short lines, each fact on its own line — the indicator colors in
  "Reading the screen" (green ✓ / orange ↑ / red ✕ / gray –, R5) are never one running
  paragraph. The breaks live in the i18n strings and render as real line breaks
  (`white-space: pre-line`, no `innerHTML`); onboarding step 1 reuses the same captions
  and gets the same breaks. Help says what something is and where to do it; the screens
  themselves say how. It uses the app's own words for what it names (lamps, the
  "Reconnect" button, the exact on-screen messages under "If something is wrong").
- **Given** a topic about a place in the app (measurements, ramps, calibration, sensor
  box, targets)
- **Then** it ends in a button to that place: "Open Vehicle", "Open Ramps", "Open
  Calibrate and zero", "Open Level" (named after the Settings tab they open, so they follow
  its name), and "Open the sensor box". Tapping one closes Help, then opens that Settings
  tab (Classic: that ☰ section). Calibration with a sensor box in use opens the box's
  page instead (a box chosen in the wizard but not yet connected: the sensor list, to
  connect it, #365), and "Open the sensor box" goes where the top-right sensor icon goes — the
  same routes as the lamp and the icon. In a browser with no Web Bluetooth that is not
  iOS, the button opens a Sensorbox page that says why no box can be connected here and
  that Chrome or Edge on Android or a computer can (#507).
- **Given** "If something is wrong"
- **Then** it ends in "Write a report", which switches to the Feedback tab (R12).
- **Given** what the About tab already says (the pitch, works offline) and what a
  Feedback report already includes (the app version)
- **Then** Help does not repeat it.
- **Given** the "About" / "Om Libell" tab on the "?" page (R38)
- **When** I open it
- **Then** I see, in my language: what Libell is, that it works fully offline and
  only uses the network to fetch updates of the app itself (R10), that all data
  stays on the phone, and a link to the source code and license (MIT) on GitHub —
  opened in a new tab with `noopener`, loading nothing remote. The app version comes
  last, in small muted type like the version under the logo in the top bar (#251), and
  is omitted when the build has none.

## R29 — Appearance preset, independent of light/dark theme

- **Given** the Settings form
- **When** I open the Appearance field
- **Then** I can choose "Modern" (the redesigned surfaces and screens, ADR 0012),
  "Classic" (today's original look, a permanent, fully-supported
  choice, not just kept around for migration), or "Glossy" (Classic's own
  layout and screens, restyled only in CSS with mid-2000s gradients, bevels
  and soft shadows), combined freely with the Theme field (R15) — choosing
  any of the three does not change whether the app follows the phone's
  light/dark scheme or a forced choice, and vice versa.
- **Given** a choice is made and saved, or nothing has ever been chosen
- **Then** the choice persists like every other setting and is restored on next
  launch; a fresh install, and settings stored before this preset existed, both
  resolve to the default preset (`DEFAULT_SETTINGS` in `src/domain/settings.ts`, #136)
  — an explicit choice is never overridden.
- **Given** Modern is the preset in effect when the first-run wizard (R18) opens
- **Then** every step shows a row of bars — one per step, the current step's bar
  filled — with the "n / total" text beside them (#189), and the step heading is
  larger; the wheel-state legend shows one color-swatch-and-glyph row per status
  (with its own short text) instead of the illustration and caption; and Next is a
  filled pill button, with Back and any Skip as plain text in one row above it
  (#239) — the same back/skip/next behavior as Classic, only restyled. Whichever preset was
  in effect when the wizard opened is what it keeps for that run, even if Modern is
  turned on or off from the embedded Settings step meanwhile; the next time the
  wizard opens it picks up the current preset. Glossy follows Classic's wizard
  exactly (its own screens, only re-skinned), since only Modern gets the
  restyled wizard above.

## R30 — Continuous audio leveling guidance (opt-in)

- **Given** the opt-in "Continuous audio guidance" setting is on, alongside and
  independent of "Chime when level" (R16)
- **When** the vehicle is not yet level
- **Then** a short pulse repeats, speeding up and rising in pitch the closer the
  STABILIZED distance from level gets — the same stabilized figure the diagram
  itself shows, for a motorhome or a caravan alike, never a raw sensor reading (see
  `src/domain/audioGuidance.ts`) — so the audio can never chatter faster than the
  display changes.
- **Given** the vehicle's stabilized distance is clearly and sustainedly getting
  closer to level, or clearly and sustainedly getting further away
- **Then** the pulse carries a distinct, non-alarming "improving" or "worsening"
  glide; a reading that has not sustainedly cleared the Stability dead band (R25,
  R27) keeps the previous direction — raw jitter or a momentary stabilizer bounce
  can never flip it.
- **Given** the setting is off, the vehicle is moving or being
  positioned (R25's stillness detector says so), or the vehicle has just reached
  level
- **Then** no guidance pulse plays — reaching level is announced once by the
  existing R16 chime/vibration/overlay instead, with its own re-arm/cooldown, and
  the next departure from level starts direction tracking fresh.
- **Given** iOS's autoplay restrictions
- **Then** guidance audio reuses the same `unlockAudio()` gesture-unlock as the
  R16 chime — the same gesture (the first tap or key press after launch, a change in
  Settings, or unmuting from the bottom bar, R38) unlocks both.

## R31 — Saved level targets: switch between more than one intentional tilt

- **Given** no target preset has ever been selected ("Normal (level)")
- **Then** the app behaves exactly as it does today: leveling targets true level, and
  the main screen shows nothing about targets at all (regression guard; ADR 0013).
- **Given** the saved targets on Settings' Level tab or page (#329; reached from Settings,
  or from the main-screen badge below once a target is active), listing "Normal" first
  and then any saved presets
- **When** I tap "Save current tilt as new target", with or without typing a name
- **Then** the current tilt — relative to whatever the sensor calibration and vehicle
  zero (R11, R24), or a box's own zero while one is the source (R34), already define
  as level — is captured and stored as a new preset
  under that name — or, with no name typed, as "Target N", the lowest number not already
  taken (#329; nothing is disabled). A capture reading more than 15° from that zero is
  not saved yet: a warning says it looks steeper than an intentional target, with a
  "Save anyway" button that saves it under the same name (#425); it survives a reload
  like any other preset.
- **Given** a saved preset
- **When** I tap it in that list
- **Then** it becomes the active target: every reading on the main screen is now
  measured against that preset's tilt instead of true level — a THIRD offset summed
  on top of the sensor calibration + vehicle zero sum (R24) or the box's zero (R34),
  never stored in the same
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
- **When** the user opens the Sensor box page and taps "Connect" on the EasyLevel
  card (read out as "Connect EasyLevel sensor")
- **Then** the app finds the box with the same scan filter as the official EasyLevel
  5.0.7 app — its advertised service, or the `CARATI...` name of older boxes that
  advertise none (confirmed from that app's own code, not just inferred; see
  `src/sensor/easyLevelSensor.ts`), and the wheel/bubble UI updates from the
  box's readings exactly as it does from the phone's own sensor — same math, same
  diagram, same tolerance (ADR 0014's seam: `OrientationSensor.getGravity()` returns
  one shape regardless of source). The phone's own sensor is never replaced
  automatically; connecting is always an explicit, reversible choice.
- **Given** a browser without Web Bluetooth (e.g. most desktop browsers)
- **Then** the top-bar sensor icon is hidden and there is no Sensor box page at all —
  never a silent failure or a button that does nothing when tapped. iOS gets a guide
  instead (R39).
- **Given** the EasyLevel box is the active source
- **When** its BLE connection is lost (out of range, powered off) while the app stays
  open
- **Then** the main screen shows that the connection was lost instead of freezing on
  the last reading (R37), and "Reconnect" — on that prompt and in the box's own page
  header (R51) — offers to reconnect; during a live session this is always a fresh
  gesture-triggered pairing prompt (see #130 below for what "reconnect" means the next
  time the app is opened instead).
- **Given** a connect or reconnect attempt that fails partway — GATT connected, but
  service discovery, characteristic lookup or notification subscribe failed (#219)
- **Then** the app actively releases the half-open GATT connection instead of leaving
  it dangling (a BLE box stops advertising while it holds a connection, so a dangling
  link would make it unfindable by the picker and by every silent reconnect until the
  page reloads), and neither that cleanup nor an explicit user "Disconnect" is ever
  reported as a _lost_ connection: the lost-connection state, its prompt (R37) and
  the background auto-retry are reserved for genuinely unexpected drops.
- **Given** the EasyLevel box is the active source and connected
- **Then** the top bar shows only a small sensor icon, colored for "connected" — no
  numbers, no clutter (#129). While the phone's own sensor is active instead, the
  same icon stays visible but in a third, neutral "tap to connect" look rather than
  disappearing (screen-cleanup follow-up: it is now the only way to reach the
  Sensor box page at all, R38) — visible whenever Web Bluetooth exists in this
  browser, hidden only when it doesn't (iOS: R39). Tapping it opens the box's own
  page while a box is in use, and the Sensor box list otherwise (#315, R40) — the same
  "tap the indicator to jump to its own page" pattern the R11 warning lamps use.
- **Given** the box disconnects, or its data goes stale
- **Then** the main-screen icon switches to a clearly different (warning) look — this
  icon is the visible half of the "never leave apparently-live instructions on screen"
  guarantee; the freeze/stale-data logic that backs it is separate (#132).
- **Given** the sensor's own page (R40), whether connected or disconnected
- **Then** it spells out the connection state in full, with the battery in its header
  (R51) and the temperature in its debug info, as real decoded values once the first
  status notification has arrived — the temperature reads "Not available yet" only in
  the brief window before that, or before EasyLevel has ever connected (#123). These
  values lived on the Sensor box page itself until #226 moved them here, and appear in
  exactly one place each (#332).
- **Given** signal strength (RSSI)
- **Then** it is not shown at all (#228). Web Bluetooth exposes RSSI only through
  `advertisementreceived` (via `watchAdvertisements()`), never for an established
  GATT connection — and a BLE peripheral generally stops advertising once
  connected, which is exactly the state this page is open in. So there is nothing
  to measure, ever; this is how BLE and the API work, not a gap that closes with
  browser support. Until #228 the page carried a hard-coded "Signal strength: not
  available yet" row, which avoided fabricating a number (right instinct) but
  promised a value that could never arrive (wrong wording), so the row is gone
  rather than reworded. Recorded here so it does not read as an oversight worth
  "fixing" later.
- **Given** the box's accelerometer and status notifications
- **Then** Libell decodes them exactly as the official EasyLevel app does, traced from
  its decompiled code rather than guessed: the accelerometer triplet is bias-corrected
  against the calibration values the box sends (#215; on legacy firmware, against the
  bias embedded in the accel packet itself, #217), then turned by the chosen mounting
  (R43) — without reimplementing the box's own onboard filter, since the leveling math
  only depends on the ratio between the axes; the status packet gives the battery, the
  temperature and the firmware tier (#123), with the official app's own rounding and
  its handling of an unfamiliar tier byte. The wire format, the formulas and the
  evidence for each, and what decompiling could not establish (the box's absolute
  polarity; R43 covers which mounting a given box uses), are recorded in
  `src/sensor/easyLevelProtocol.ts`. The status notification is read best-effort and
  never required for leveling to work: without it, readings are simply uncorrected.
- **Given** the EasyLevel box connects or reconnects, by any path
- **Then** (#217) status is subscribed before accel — matching the official app's own
  post-connect setup order — and accel readings are withheld from the main screen
  (never shown as a leveling value known to be missing available calibration) until
  either a status notification has been observed, the box's firmware has no status
  characteristic at all (best-effort subscribe fails — nothing to wait for), or a short
  bounded grace window elapses with no status notification arriving. That window is
  Libell's own defensive choice, not derived from the official app (which has no
  equivalent wait, only the subscribe ordering above) — see `easyLevelLink.ts`'s
  `EASYLEVEL_INITIAL_CALIBRATION_WAIT_MS`. Firmware that genuinely has no status
  characteristic is never held up by this: it starts reporting as soon as the first
  accel sample arrives, exactly as before #217.
- **Given** the EasyLevel box is the active source and its battery is low
- **When** its reported battery percentage drops below the low-battery threshold
  (with hysteresis so it doesn't flicker right at the line — see `isLowBattery` in
  `src/sensor/externalSensors.ts`)
- **Then** a warning is shown on the box's own page (R40), never as a leveling-screen
  interruption — the main leveling view is unaffected either way.

## R33 — EasyLevel box: remember the selection and auto-reconnect on open (#130)

This requirement is scoped strictly to the PWA / Web Bluetooth path (#116's
implementation). A future iOS native bridge (#119) and any future Android native app
implement their own platform-appropriate reconnect behavior against this same
cross-platform goal — they are not this app's code and are not covered here.

- **Given** the user has successfully connected to an EasyLevel box at least once
- **Then** the app remembers that specific box's identity (its Web Bluetooth device id)
  and that EasyLevel was the active source, not merely "an EasyLevel box was used
  once" — both survive closing and reopening the app (storage: docs/03-ARCHITECTURE.md
  §Sensor, "Remember-and-auto-reconnect").
- **Given** a browser that implements Web Bluetooth's persistent-permissions API
  (`navigator.bluetooth.getDevices()` — Chrome/Android today) and a remembered box
- **When** the app is opened
- **Then** it reattaches to that same previously-authorized box (`getDevices()` to find
  it, `device.gatt.connect()` to reconnect) automatically, with **no** device picker and
  **no** user gesture — the ordinary use becomes open app → sensor reconnects → level,
  never a repeated pairing dance.
- **Given** the same situation, but the box is out of range, powered off, or its GATT
  connect otherwise fails
- **Then** the attempt fails cleanly and the app honestly shows the box as the
  active-but-disconnected source via the same connection-lost UI a live drop uses (R32
  above): the main-screen sensor icon and prompt (R37) and the box's own page (R51),
  both offering the existing one-tap "Reconnect". **Revised by #211:** a single failed
  attempt is no longer the end of it — R37's automatic background retry keeps trying
  on the same remembered box on its own, so recovery does not depend on the user
  noticing the prompt or understanding what "Reconnect" does. The app still never
  silently falls back to the phone's own sensor on the user's behalf — that is, and
  stays, the user's own explicit "Disconnect" (or R37's "Use the phone instead").
- **Given** a browser without `getDevices()` (Web Bluetooth's persistent-permissions API
  is not implemented everywhere `navigator.bluetooth` itself is) — or without Web
  Bluetooth at all
- **Then** silent auto-reconnect is not attempted (a browser without Web Bluetooth never
  had an EasyLevel box to remember in the first place, per R32); the box, if remembered,
  surfaces as "Connect the box" (R37, #313), and a manual connect through that prompt
  or the box's own page still works — it just necessarily needs its own user gesture,
  since that is what a fresh `requestDevice()` picker always requires.
  This is a genuine platform ceiling, not a bug: the app never pretends a browser can
  auto-reconnect when it can't.
- **Given** the user taps "Disconnect" on the box's own page (R51)
- **Then** the box stays remembered (its device id is not forgotten), but the active
  source reverts to the phone — the next app open does not attempt to
  auto-reconnect until the user connects again, honoring an explicit "not right now"
  without an explicit "forget this box". The phone's own sensor is started at that
  tap (#321): when the box took over the app's startup, the phone was never started,
  and the screen waited for a sensor that would never deliver.
- **Given** I pick the box in the device picker, right after disconnecting it (#322)
- **When** the first connect to it fails
- **Then** the app waits to hear the box advertise (as the silent reconnect does,
  #288) and tries once more before saying it could not connect. This holds for the
  EasyLevel box as for the Xparkle box (#357).
- **Given** the EasyLevel box was lost and the silent reconnect runs (R37's background
  retry, or the next app open)
- **Then** it first waits a bounded time to hear the box advertise, where the browser
  can watch for that, and then connects — the same wait the Xparkle box gets (#356,
  #288), since a connect to a box no scan has seen since the drop often fails even in
  range.
- **Given** the EasyLevel box is connected but its notifications stop while the link
  stays open (#358)
- **When** it has been silent for longer than `EASYLEVEL_SILENCE_LIMIT_MS` (longer than
  R35's staleness timeout, so the "no new sensor data" overlay covers the gap first)
- **Then** the app closes the link itself and treats it as lost contact: the box's card
  says "Lost contact", Reconnect is offered and R37's background retry starts, exactly as
  for an outright drop. Only a live link is watched: connecting itself, which the
  manufacturer's manual says can take up to 60 seconds, has no limit of Libell's own.

## R34 — EasyLevel box: installation zero ("Zero the vehicle")

- **Given** a permanently-mounted EasyLevel box, wired into the vehicle rather than
  laid flat like the phone
- **Then** the app does not ask for "place it flat" (R2's phone pose) — it asks the
  installer to level the _vehicle_ once and capture that as the box's own
  installation offset (ADR 0014's three-way calibration split), after which the
  box's physical orientation inside its enclosure stops mattering.
- **Given** the box's own page (R51), while EasyLevel is the source in use and in
  contact
- **When** the vehicle stands verifiably level (spirit level, or after leveling with
  the ramps) and I tap "Zero now" ("Nollställ nu") in its "Zero the vehicle" step
- **Then** the app stores the current reading as the box's installation offset, and
  every subsequent reading from the box is corrected by it — the same "capture the
  current tilt as zero" mechanism R24 already gives the phone's vehicle zero, applied
  to this source instead.
- **Given** the box streams raw, unsmoothed samples, and its own app says to press OK
  a few times until the value settles
- **Then** one tap zeroes from the average of the box's samples over a short window
  (`EASYLEVEL_ZERO_SAMPLE_MS`), showing "Zeroing…" meanwhile; if the box drops while
  sampling, nothing is stored and the page says the box is not connected.
- **Given** the capture looks like more than placement tilt (>15°)
- **Then** nothing is stored yet: a warning asks whether the vehicle really is level,
  with a "Zero anyway" button that zeroes it regardless — the same warning R24 gives the
  phone (#425); the zero is kept after a reload.
- **Given** a stored installation offset
- **Then** the step reads "Zeroed" with its age, reusing R26's "(14 days ago)" age
  display, and offers "Zero again" and "Forget the zero" (R51; no separate Check,
  #343).
- **Given** the phone's own sensor calibration and vehicle zero (R24), and the
  EasyLevel box's installation offset above
- **Then** they are stored completely independently, one offset per external source
  since #263 (storage: docs/03-ARCHITECTURE.md §Sensor): clearing or redoing one never
  touches, and is never touched by, the other, and switching the active source between
  the phone and the box switches which offsets "level" is measured against without
  losing or corrupting either — mirroring how a target preset (R31) is never conflated
  with either calibration layer.
- The amber calibration lamp (R11) follows the same rule: it checks the phone's pair
  while the phone is active, or just the box's installation offset while EasyLevel
  is — never both pairs at once. While a box is active it reads "⚠ Zero", and its
  tooltip names the box ("The box is not zeroed — tap to open the box").
- **Given** an external sensor is the active source
- **Then** the Calibration section (R11, R24) hides the phone's controls without a
  paragraph about them (#316), so the box's own calibration (below) is what the page
  shows: the phone's
  sensor calibration, flip calibration and vehicle zero are not applied to a box's
  readings, so capturing one would silently do nothing (or capture the box's tilt as
  the phone's). The stored phone values are kept untouched and become editable again on
  switching back to the phone (#285). The first-run wizard (R18) leaves those disabled
  steps out of its phone path for the same reason (#287).
- **Given** an external sensor is the active source
- **Then** the Calibration section also offers "Zero the vehicle" with "Zero now" for
  that sensor, in place of the hidden phone controls — the same action as on the
  sensor's own page (for the Xparkle box, R49's zeroing), so zeroing is found where a
  user looks for it (#290); its status line gives the stored zero and its age. Below it
  a quiet "Show the box" link opens the box's own page (R51) for its position and
  direction (#316).
- **Given** an external sensor is the active source and the amber calibration lamp is
  lit (#316)
- **When** I tap the lamp
- **Then** the box's own page opens rather than the Calibrate and zero tab, its checklist
  (R51) expanding the next step not yet done: the direction before the zero.
- This installation-offset step lives on the EasyLevel sensor's own page (R40, R51; the
  Sensor box page itself until #226 moved it, along with the mounting picker,
  onto the page for the device it configures), since it only makes sense once an
  external source exists to zero; the Calibration section only repeats its action
  while that source is active (above).

## R35 — Stale sensor data is never shown as live (#132)

A disconnected or stalled sensor silently freezing on its last reading while the app
keeps showing "drive forward" is actively dangerous — P0. This is a third, distinct
safety state: never R17's "wrong phone pose" overlay (the phone is flat, but the
_data itself_ can no longer be trusted), never R25's "Measuring…" (that needs new,
noisy samples to arrive; this fires when no new samples arrive at all).

- **Given** the active sensor has not delivered a fresh reading within its own timeout
  — `STALE_TIMEOUT_PHONE_MS` for the continuously-sampling phone sensor, and for a
  sensor box whatever its registry descriptor's `staleTimeoutMs` declares (#266) —
  while `getGravity()` still returns its last non-null value
- **When** I look at the main screen
- **Then** the wheel/ramp guidance is hidden behind a clearly worded "no new sensor
  data" overlay instead of continuing to display the last reading as if it were live;
  the level celebration cannot fire while this overlay is shown.
- **Given** the EasyLevel box's GATT connection stays technically open but its
  notifications have simply stopped arriving
- **Then** this is caught the same way as an outright disconnect going unnoticed —
  staleness is judged purely by "time since the last real sample", never by
  connection state alone. If the silence lasts past `EASYLEVEL_SILENCE_LIMIT_MS`, the
  box is treated as lost instead (R33, #358) and R37's card takes over.
- **Given** fresh data resumes (the tab regains focus and `devicemotion` starts
  firing again, a stalled BLE box starts notifying again, ...)
- **Then** the overlay clears automatically the moment the next sample arrives — no
  manual action is needed purely to clear it. (Reconnecting a sensor that actually
  disconnected is a separate action, R33's job, not this one's.)
- **Given** an external sensor is the active source and the overlay is shown (#286)
- **Then** it also carries a "Show the box" button (the same label as R17's pose
  overlay) that opens that sensor's own page, not the source list — on top of the
  overlay, which stays hidden while the page is open (#297). While the
  phone is the active source the button is not shown. R37's unavailable card is
  never shown at the same time as this overlay (that one needs no reading at all,
  this one a reading that has gone old); it has no such button (#313) — the top-bar
  sensor icon reaches the box's page from there.
- **Given** the overlay is shown for a box
- **When** the box is then lost and there is no reading at all (#398)
- **Then** the overlay hides, and so does R17's pose overlay: only R37's card shows.
- How staleness is detected (one pure check shared by every source, time passed in as
  a parameter) is specified in `docs/03-ARCHITECTURE.md` §Sensor, "Stale-data safety
  state".

## R37 — Sensor unavailable: an explicit Reconnect / "Use the phone instead" card (#134)

R32/R33 already report a lost or unreachable EasyLevel connection honestly (the
main-screen dot, the Sensor box page, a failed silent reconnect at open).
This requirement makes that moment actionable instead of a dead end the user can only
fix by opening the menu — and, per ADR 0014, never by switching source on its own:
phone and box keep independent calibration references, so an automatic,
unannounced switch could show a plausible-looking but wrong reading. Everything below
holds for every sensor box (#266), not only EasyLevel.

- **Given** a sensor box is the active source and it cannot be reached — a live GATT
  disconnect, a stream gone silent past its limit (#358), or a failed silent
  reconnect attempt at app open (R33) that never recovered
- **When** I look at the main screen
- **Then** instead of the plain "Waiting for the tilt sensor…" hint, a clear,
  non-blocking card is shown with one sentence, one primary action and one quiet link
  (**#313**, the #309 UX review): "Lost contact with the box", the live line "Trying
  again automatically…", a **Reconnect** button and a **Use the phone instead** link —
  never a frozen or ambiguous screen. It says nothing about the phone lying flat (that
  only applies once the phone is chosen, R17) and has no "Show the box" button (the
  top-bar sensor icon reaches that page).
- **Given** the app was restarted and the browser cannot reconnect silently (no
  `getDevices()`, as on Chrome for Android, #308)
- **Then** the card says "Connect the box" / "Tap and pick your box in the list." instead,
  never promising an automatic retry that cannot land (#313).
- **Given** I tapped Reconnect and the picker was cancelled or the connect failed
- **Then** the card's line says "No box found? Check that it is on and close by." and
  the buttons stay.
- **Given** there is no reading at all — the prompt above, or the plain "no reading yet"
  hint
- **Then** the wheel diagram is dimmed and the tilt readout hidden (**#312**): the last
  frame's steps never stay on screen looking live.
- **Given** the fallback prompt is shown
- **When** I tap "Reconnect"
- **Then** the browser's device picker opens for the active source, exactly as the
  sensor page's connect button does (**#307**, found on hardware: a silent reconnect
  could not reach the box on Chrome for Android, so the tap did nothing). The picker
  lists only that kind of box; Web Bluetooth never lets a page choose in it, so the one
  tap on the box is the user's. On success the prompt clears and leveling resumes on
  the external source; if the picker is cancelled or the connect fails, the prompt
  stays and the background retry below keeps going.
- **Given** the box is unreachable and the fallback prompt is shown, and no one
  taps anything (**#211**)
- **Then** the app also retries the same reconnect call on its own, on a short fixed
  interval (`sensor/sensorFallback.ts`'s `EXTERNAL_SENSOR_AUTO_RETRY_INTERVAL_MS`), for as
  long as the main screen is visible and the box stays unreachable — recovering
  automatically the moment the box is back in range or powered on, with no tap
  required. This never switches source on its own (ADR 0014's rule is unchanged): it
  only ever retries reaching the same already-known box, silently (no gesture, so no
  picker), through the same adapter `reconnect()` R33 uses.
- **Given** the fallback prompt is shown
- **When** I tap "Use the phone instead"
- **Then** the app switches the active source to the phone sensor via the exact same
  explicit switch the box's own page's "Disconnect" action already performs (R51;
  never a parallel code path). If the phone is not lying flat, R17's wrong-pose overlay
  says so right after the switch — the one place the phone's pose rule is stated.
- **Given** I have switched to the phone sensor from this prompt
- **Then** nothing about the box's calibration (its own installation offset, R34) is
  reused or assumed for the phone — the phone's own calibration/vehicle-zero pair
  (R24) is what "level" means from this point on, per ADR 0014's three-way split.
- This prompt is deliberately not a second "sensor is down" surface: it is the
  actionable form of the same `!gravity`/`'disconnected'` case R32's connection-lost
  hint already covered, and it is distinct from R35's stale-data overlay (a last
  reading still held, but no new samples arriving) — that overlay is unaffected and
  keeps clearing itself automatically the moment fresh samples resume.

## R38 — Bottom action bar: settings, sound, help (#161)

- **Given** the app loads, on any screen width
- **Then** the top bar shows only identity on the left (logo, title with the version
  under it — R50 — and share) and the
  actions cluster on the right — no menu button there. The Install button (R20) and the
  sensor-status icon keep the top-right corner together, Install immediately to the icon's
  left (#244), and neither ever moves; the warning lamps and target badge sit to their
  left and are the ones that move when space runs out, wrapping onto further
  right-aligned rows below — never pushing the corner pair out of place and never
  overlapping the identity group. The bar reserves the corner's own measured width, so
  the reservation holds whatever language the Install label is in. The install
  prompt (R20) is otherwise unaffected, still using the
  `#install-hint` banner under the top bar. The sensor-status icon (R32/R33,
  screen-cleanup follow-up) is the one always-present way to reach Sensor box (no
  menu entry leads there; Help's sensor topic and the ⚠ Zero lamp only link to it) —
  it stays visible whenever Web Bluetooth exists at all (a neutral "tap to connect"
  look while the phone's own sensor is active, not just once a box is connected),
  opening the list, or the box's own page while a box is in use (R40), with a ✕ to
  close.
- **Given** the app loads
- **Then** a bottom action bar shows exactly three controls, spread across the bar
  (settings at the left edge, sound centered, help at the right edge — screen-cleanup
  follow-up: not clustered together in the middle): settings (a gear icon, R9 —
  Help/About/Feedback are not part of this menu at all), sound (visually larger —
  the primary, most-reached-for control), help ("?", opens its own page with Help
  (R28, "Show introduction" below its topics), About (R28) and Feedback (R12)
  as tabs, in that order — a fully independent component from the Settings
  page/menu, never routed through its drawer or sharing its back-navigation state,
  so its close (✕) can never reveal the Settings drawer underneath).
- **Given** I tap the sound button while "Chime when level" (R16) and/or "Continuous
  audio guidance" (R30) are on
- **Then** both turn off together and the button shows a muted state.
- **Given** I tap the sound button again while muted
- **Then** both settings return to exactly the values they held before muting — muting
  never forces a setting back on that was already off before I muted.
- **Given** I mute or unmute from the bottom bar, then later open Settings
- **Then** the Chime/Continuous-audio-guidance checkboxes there reflect the change —
  never a stale display that could silently undo the mute on an unrelated change.

## R39 — Sensor box on iOS: a Bluefy workaround guide, not a hidden option (#119)

Safari/WebKit has no Web Bluetooth and Apple has no plans to add it, so unlike other
unsupported browsers (R32's plain hidden case) iOS gets a guide instead of nothing —
see `docs/ios-easylevel-bluefy-guide.md` for the long-form version of the same guide.

- **Given** a phone running iOS (any browser, since all of them use WebKit) without
  Web Bluetooth
- **When** the app loads
- **Then** the top-bar sensor-status dot stays visible (unlike other unsupported
  browsers, where it is hidden per R32) with a distinct "tap for iPhone setup guide"
  label, and tapping it opens a page explaining that Bluefy — a third-party Web
  Bluetooth browser — makes the ordinary EasyLevel connect flow (R32) work unchanged
  once Libell is opened inside it, with the installation steps and a link to find it
  in the App Store.
- **Given** that guide page
- **Then** it never shows a box card, a "Connect" link or any health/battery
  detail — there is no `navigator.bluetooth` behind this page to drive any of that,
  so it is a different page from the ordinary Sensor box page (R32), not a
  variant of it.
- **Given** the same phone, but opened inside Bluefy instead (Web Bluetooth now
  exists)
- **Then** the ordinary Sensor box page (R32) shows instead, with no code
  difference from Android — Bluefy's polyfill is all that changes.

## R40 — The sensor's own page: live values, its settings, and an EasyLevel debug disclosure

The Sensor box page (R32) lists every sensor box Libell supports that can work in this
browser — one card each, EasyLevel and Xparkle RVS01 today (#268, R49); tapping the
card of the box in use opens a deeper, focused page for that sensor alone, refreshed
continuously while it stays open — not just once when opened. Each page draws only the
rows its own device can fill: a source that reports no temperature has no temperature
row rather than one reading "not available yet" (#228's rule, generalized). This page
replaces the earlier standalone Diagnostics tab (design review): that page's generic
phone-or-EasyLevel framing didn't earn its keep, and whatever troubleshooting value it
had is better served by raw values read straight off the box.

Since #226 it is also where that sensor is **configured**, not only observed: the
mounting picker (R43) and the installation offset (R34) moved here from the list page,
which had grown longer than the detail page its own chevron led to, and repeated
battery and temperature on both. The division is now plain — the Sensor box page
answers "which source, and how do I connect it", and this page answers everything
about one specific box. It is titled for that box ("EasyLevel sensor") rather than
"Sensor status", since configuration lives here too.

- **Given** the Sensor box page with EasyLevel as the active source
- **When** I tap its card (the box's name, with a chevron)
- **Then** a new page opens on top, showing that sensor's connection state with its
  battery (R51's header) and a live reading —
  the same calibrated roll/pitch the leveling math itself uses — so a box can be
  confirmed alive by watching the number move, without leaving this page.
- **Given** the phone's own sensor is the active source (#244)
- **Then** a box's card offers no chevron and nothing to tap but its "Connect" link
  (#324): the page behind it is one specific box's own, so a box not in use must not
  lead there.
- **Superseded** by #324 (#244's status row set apart from the Connect button above
  it) — each box is now one card with its Connect link inside it, see the sensor list
  below.
- **Given** EasyLevel is the active source, connected or lost
- **Then** below those rows the same page carries this box's own setup checklist
  (R51): its direction and its zero, with its position in the live line above,
  showing current values whenever the page is opened. It is the very same component
  the onboarding wizard embeds its position step from (#317) — never a second,
  page-specific rebuild.
- **Given** the sensor list (R32), titled "Sensor box"
- **Then** it carries none of the above: one card per box (#324) — a mark (✓ in use,
  ! no contact, + not in use), the box's name, and one line under it: its state, or a
  quiet "Connect" link while it is not the box in use. The card of the box in use opens
  its own page (R51), where Reconnect, its setup and Disconnect live; the list never
  offers Connect, Reconnect or Disconnect for that box itself. Under the cards one line
  says, once, that the phone's own sensor is used while no box is connected. It names
  no browser (#320): the list only exists where Web Bluetooth does, so naming one was
  wrong in the others, such as Bluefy on iOS. A list of sources never grows longer
  than the page it links to.
- **Given** a box is the active source, connected or lost (#315)
- **When** I tap the sensor icon in the top bar
- **Then** that box's own page opens directly, not the list: its state, Reconnect and
  setup are all there.
- **Given** the phone's own sensor is the active source
- **When** I tap the sensor icon
- **Then** the list opens, the place to connect a box.
- **Given** this status page is open
- **Then** every value on it keeps refreshing every frame for as long as it stays
  open — the same "runs every frame regardless of what else is open" discipline the
  top-bar sensor-status dot already follows — so a battery/temperature notification
  or a tilt change shows up immediately, never only after closing and reopening the
  page.
- **Given** EasyLevel is the active source
- **When** I expand its "Debug info" disclosure (below Disconnect, R51; closed by
  default, a native `<details>` — no separate tap-and-wait)
- **Then** it shows raw values straight off the box, for troubleshooting a box that
  isn't behaving as expected — not everyday reading material: its temperature, the box's Web
  Bluetooth device id, time since its last accepted accel notification, the raw
  accelerometer int16 triplet (`easyLevelProtocol.ts`'s unscaled x/y/z — never run
  through the leveling math), the firmware tier decoded from the status
  characteristic (#123), and the status characteristic's raw bytes as hex — plus a
  "Copy debug info" button producing a plain-text block of all of the above, the
  temperature included (#402), ready to paste into a bug report.
- **Given** the box is not the active source (the phone is)
- **Then** the "Debug info" disclosure is hidden entirely — it has no raw box data to
  show — as is the box's setup checklist, while the state and reading lines above
  them still work, reading "Not connected" and "Tilt now: —".
- **Given** any raw debug field before its data has ever arrived (no box connected
  yet, or connected but no status/accel notification received yet)
- **Then** it reads "Not available yet" — the same wording every other not-yet-
  available field in this app already uses — never a broken or fabricated value.

## R41 — Share vehicle setup with family via link (#207)

R19 already shares the app's own install URL; this shares one vehicle's actual
setup, so a family member using the same RV/motorhome doesn't have to re-measure
and retype everything. Only the fields that describe the physical vehicle are
included — vehicle type, axle configuration, wheelbase, front/rear track width,
ramp step heights, ramp count and drain position. Calibration (phone bias, vehicle
zero, EasyLevel install offset — each tied to exactly where one phone/box sits in
one vehicle, ADR 0010/0014) and every UI/behavior preference (tolerance, stability,
dwell, unit, sound, theme, appearance, sensor source) are deliberately excluded.

- **Given** I am on the Settings page's Vehicle section
- **When** I tap "Share to another phone"
- **Then** a link is generated encoding only the fields listed above in the URL
  fragment (never sent to any server — no backend exists, `SECURITY.md`), and handed
  to the same native share sheet / clipboard fallback the app-link share button
  (R19) already uses.
- **Given** a family member opens a received setup link
- **When** the app loads with a setup fragment present
- **Then** they see a preview of the incoming values before anything is applied, plus
  a reminder that calibration is not included and still needs doing on their own
  phone, and must explicitly tap to apply it — never automatic.
- **Given** a family member confirms an incoming setup link
- **When** it is applied
- **Then** only the fields listed above are written to their settings; their own
  calibration, EasyLevel pairing, and every UI/behavior preference are left
  untouched.
- **Given** the link's fragment is malformed, truncated, or from an unrecognized
  schema version
- **Then** the app shows a clear error and applies nothing — fail closed, never a
  partial or guessed-at result.

## R42 — EasyLevel debug connect-delay workaround (#212)

No physical EasyLevel box has been available to test this app's Web Bluetooth
connection sequence against. If a real box ever turns out to need a moment to settle
after GATT connect before it responds correctly to service/characteristic discovery
(the official app's own decompiled connection handling applies a delay of its own
that this app's `easyLevelSensor.ts` does not — see #211's context), whoever owns
that box needs to be able to try a fix without a dev setup: an experimental,
off-by-default, adjustable connect delay reachable from the app's own UI.

- **Given** the EasyLevel status page's "Debug info" disclosure (R40), while EasyLevel
  is the active source
- **Then** it additionally shows an "Enable connect delay" toggle and a "Delay (ms)"
  number field, both labeled as experimental and only worth touching if the box's
  connection is actually unreliable — never presented as a normal setting.
- **Given** the toggle is off (the default for every install)
- **Then** connecting behaves exactly as before this requirement — zero added delay,
  the same connect sequence byte-for-byte.
- **Given** the toggle is on with a chosen delay
- **When** the app connects or reconnects to an EasyLevel box, by any path (manual
  connect, a tap on Reconnect, the silent auto-reconnect at app open (R33), or the
  background auto-retry loop (#211))
- **Then** it waits that many ms after GATT connect succeeds before discovering
  services/characteristics — one flat delay applied uniformly, not the official app's
  own bonded/not-bonded two-tier scheme, since Web Bluetooth exposes no bonding-state
  read to tell the two apart.
- **Given** the toggle has never been touched (a fresh install, or before the user
  first enables it)
- **Then** the field holds the official app's "not bonded" delay, the branch relevant
  to an EasyLevel box, which Android has no reason to bond with (value and reasoning:
  `DEFAULT_EASYLEVEL_SETTINGS` and `connectDelayMs` in `src/domain/settings.ts`).
- **Given** a delay value typed into the field
- **Then** it is clamped to a sane range (`MAX_EASYLEVEL_CONNECT_DELAY_MS`) so a
  mistyped huge number can't effectively hang every connect attempt.
- **Given** the toggle/value have been set
- **Then** they persist across closing and reopening the app, the same as every other
  stored setting (`LevelSettings`) — but they are set only from this debug
  disclosure, never from the Settings page, since this is a hardware-compatibility
  diagnostic, not a user preference.
- **Given** the status page is refreshing continuously while open (R40)
- **Then** the two controls are only re-synced from the stored value when the page is
  freshly opened, never on every refresh frame — refreshing them continuously would
  fight a user mid-edit (a keystroke into the ms field reset before the next one
  lands).

## R43 — EasyLevel box: mounting-orientation setting (#217, all four rotations #222)

The official EasyLevel app supports the box mounted two ways, 90° apart
(`"sensor_Placing"` 1/2), and transforms its readings accordingly — traced in full by
#215/#217 (see `easyLevelProtocol.ts`'s module doc comment). Libell had only ever
implemented the default orientation; a box mounted the other way would connect and
produce plausible-looking data while Libell computed the wrong wheel to raise.

#222 widens this past the official app: a rectangular box lying flat can be bolted in
**four** ways, not two, and people mount hardware whichever way it fits. The two the
official app omits (180°, 270°) are the dangerous ones, because the zero (R34)
cannot rescue them — it subtracts a _constant_, while a half turn is a _sign
inversion_. Level still reads level, so the zero looks like it succeeded, and only
then does the app start confidently naming the wrong wheel. Mounting the box upside
down (lid down) stays out of scope and fails safely rather than silently — see the
upside-down criterion below and R17 (#285).

- **Given** the EasyLevel box's own page (R40), while EasyLevel is the active source,
  connected or lost (R51)
- **Then** R51's direction step offers the two placements the manufacturer's manual
  allows (#359): an arrow on the lid always points forward, and the box's **long side**
  or its **short side** faces the front — "Long side forward" / "Short side forward",
  the official app's `sensor_Placing` 1 and 2, stored as `standard` and `rotated90`.
  (CaraTech AB's manual: either of the lid's two
  arrows may point forward, then "Långsidan framåt" / "Kortsidan framåt" in its
  Swedish edition, https://cdn.shopify.com/s/files/1/0845/7656/7633/files/EasyLevel_SV.pdf.) Each is a picture of
  the vehicle with the box in it, arrow forward, named under it; the choice is made by
  matching the picture, never through the official app's `"sensor_Placing"`
  terminology. The half and three-quarter turns (#222) put every arrow backward or
  sideways, which the manual does not allow, so they are no longer offered.
- **Given** the user has never picked a placement (#359)
- **Then** the step reads "Pick the direction", unticked, and is the open step;
  readings use `standard` (no rotation) meanwhile. A stored setting from before #359
  counts as picked only when it is not `standard` (the default every save wrote).
- **Given** a `rotated180` or `rotated270` stored before #359
- **Then** it is still applied to every reading (nothing changes silently), and the
  step asks the user to pick one of the two placements.
- **Given** the user is unsure how the box sits
- **Then** "Not sure? Learn it by raising the front" opens the lift guide (R49, #293),
  which learns from the box's readings before any rotation (#360). A result matching
  one of the two placements is stored as picked; one showing the arrow backward or
  sideways says to turn the box so an arrow points forward and try again; a mirrored
  one says the box seems upside down or the wrong side was raised. Neither is stored.
- **Given** an EasyLevel box mounted upside down, lid down (the official app's
  "Inverterad", which the manufacturer advises against: vibration, and the battery can
  fall out)
- **Then** Libell does not support that mounting, but never blocks: the box page's
  position line says "Upside down: turn it lid up", with the manufacturer's advice, and
  the main screen keeps R17's "The box looks upside down" overlay (#362, Morgan
  2026-10-11).
- **Given** the placement pictures
- **Then** they draw the box as its lid is printed: two arrows, one up and one to the
  left. Long side forward is the box as printed (up arrow forward); short side forward
  is a quarter turn clockwise (left arrow forward).
- **Given** a box physically mounted any of the other ways
- **When** its rotation is applied
- **Then** that rotation of the (x, y) pair — `(-y, x)` at 90° (the exact transform
  the official app's own `sensor_Placing: 2` applies, derived from its decompiled
  `LO0/e;->k()` placement branches), `(-x, -y)` at 180°, `(y, -x)` at 270° — is
  applied to every subsequent EasyLevel reading, taking effect on the very next accel
  sample with no reconnect needed (the same live-settings-read pattern R42's connect
  delay already uses). `z` is untouched by all four: no rotation in this set changes
  which way is up.
- **Given** the four rotations
- **Then** they form one rotation group rather than four ad-hoc formulas — two
  quarter turns equal the half turn, four return to the original reading — so the
  two Libell adds are the plain continuation of the one #217 derived from the
  official app, not separately reverse-engineered behavior.
- **Given** `standard` (the default, see `DEFAULT_EASYLEVEL_SETTINGS` in
  `src/domain/settings.ts`; it matches the official app's own default
  `sensor_Placing: 1`)
- **Then** behavior is byte-for-byte identical to every EasyLevel release before this
  requirement — no transform applied.
- **Given** the phone's own sensor, or `?demo`
- **Then** this setting is never read at all — changing it cannot affect any other
  `OrientationSensor` (ADR 0014's seam stays intact).
- **Given** the choice has been made
- **Then** it persists across closing and reopening the app, like every other stored
  setting (`LevelSettings.sensorDevices.easylevel`, its `mounting` and
  `mountingPicked`, read via `easyLevelSettings()`).
- **Given** a corrupt or future-version stored value
- **Then** it falls back to `standard`, the same validate-on-read discipline every
  other enum-like setting (`sensorSource`, `appearance`, ...) already follows — and a
  `standard`/`rotated90` stored before #222 keeps working unchanged.

## R44 — Simulated EasyLevel box (`?easylevel-sim`): the whole flow, no hardware (#220)

Everything above `easyLevelProtocol.ts`'s byte parsing was previously exercised only
by unit-test fakes; with no physical box available, the running app's EasyLevel
experience could never be walked end to end. The same convention as `?demo` (a
synthetic stand-in behind a query flag, driving the real code path), applied one seam
lower: a simulated `EasyLevelTransport` (`easyLevelSimulator.ts`) producing payloads
byte-for-byte in the real box's wire format, injected at the existing transport seam —
everything above that seam is exactly the code a real box runs through.

- **Given** any browser, with or without Web Bluetooth
- **When** the app is opened with `?easylevel-sim`
- **Then** EasyLevel presents as available everywhere it normally would (the "Sensor
  box" page, the sensor icon in the top bar, onboarding's source step — one gate,
  `isEasyLevelAvailable()`), and the EasyLevel card's "Connect" connects, with no
  picker, to a simulated tier-3 box: status payloads carrying plausible
  battery/temperature and a deliberately **non-zero** calibration block, and accel
  payloads at a realistic notify rate whose raw counts carry that bias ADDED (wire
  formats: `easyLevelProtocol.ts`) — so the leveling result is only right if the R32
  bias subtraction actually runs — resolving to a small fixed tilt in the
  same spirit as `?demo`, plus a slight deterministic wobble (a pure function of the
  sample index, no clock or randomness) so the UI visibly lives while staying still
  (R25).
- **Given** the simulated box was connected and the app is reopened with the flag
- **Then** the remembered-device silent reconnect (R33) succeeds against the
  simulator — the same stored-id `reconnect()` path a real box uses.
- **Given** `?easylevel-sim=drop`
- **Then** the simulated connection is lost a short while after (re)connecting, and
  stays unreachable (silent reconnects fail, like a box out of range) for a few
  seconds before recovering — over and over, so the lost-connection state (R32), the
  "Reconnect" / "Use the phone instead" prompt (R37) and the background auto-retry
  can each be watched, visibly, recovering repeatedly without hardware.
- **Given** the flag is absent
- **Then** nothing changes: the flag check is the only code on the normal path, the
  simulator is never constructed, and `isEasyLevelAvailable()` degrades to exactly
  the old Web Bluetooth check.
- **Then** while the flag is active no real `navigator.bluetooth` call is ever made —
  the real transport is not even constructed.

## R45 — Every view fits a phone screen (#239, #241, #243, #403, #538)

R4 and R18 state this for the level view and the first-run guide. It holds for every
other view too — settings, help, the sensor box pages, the iOS sensor guide (R39),
the incoming shared-setup dialog, the Classic settings drawer.

- **Given** any view, on any phone from 320 px wide upward, in every appearance and in
  every shipped language
- **Then** the page never scrolls sideways, and nothing is wider than the container it
  sits in. A tab bar shows every tab whole: tabs that don't fit one row wrap to a
  second row rather than scroll out of sight (#538).
- **Given** a view whose content is legitimately longer than the screen (settings, help)
- **Then** it scrolls within itself, and scrolling it to the end brings its last content
  fully into view: no container extends past the visible viewport, and nothing is
  stranded behind a browser toolbar or the home indicator.
- **Given** any full-screen container
- **Then** it is sized to the _small_ viewport (the height with the browser's toolbars
  showing) and pads its bottom by `env(safe-area-inset-bottom)`. On iOS a
  `position: fixed; inset: 0` box is laid out against the toolbar-free large viewport
  while the visible height is the small one, which strands its bottom behind Safari's
  bar with nothing to scroll.
- **Given** the checks that enforce all of the above (`npm run fit`)
- **Then** they open each view the way a user reaches it — the incoming-setup dialog via
  a share link the app itself produces — and the last requirement above is checked
  against the stylesheet rather than at runtime, because no browser available in CI
  reproduces the iOS viewport behaviour it guards against.
- **Given** `npm run fit`
- **Then** it walks every appearance the app offers, Glossy included, taken from the
  same list Settings offers rather than a copy, and fails if any view overflows in any
  of them. Glossy shares Classic's layout but adds its own gradients, bevels and
  shadows, so passing in Classic says nothing about Glossy.
- **Given** CI (#494)
- **Then** it runs the fit check as one parallel job per appearance
  (`FIT_APPEARANCE=<appearance> npm run fit`), over exactly the appearances Settings
  offers: a unit test fails if the workflow's list and the app's drift apart, and a
  name that is not an appearance fails the run rather than checking nothing.

## R46 — The bubble starts in its dial (#244)

- **Given** the level screen is drawn but no sensor reading has arrived yet — an EasyLevel
  box still connecting, a phone sensor waking up, a permission prompt still open
- **Then** the bubble is already in the middle of its dial, where a spirit level's bubble
  sits at rest. It is never drawn at the diagram's origin: an SVG circle with no `cx`/`cy`
  defaults to `0,0`, which put it in the drawing's top-left corner with half of it clipped
  by the edge — a stray half-disc on screen with no relation to anything. This holds for
  the motorhome and the caravan diagram in every appearance.

## R47 — The ramp tab: one picker, one answer, settings under it (#246)

Reported from a phone, with the duplicates circled: the chosen ramp was on screen three
times over — a pinned card above the catalogue, its own row inside the catalogue, and
the footer, with the card and the footer both spelling out the same step heights.

- **Given** the Ramps tab in Modern, or ☰ → Ramps in Classic and Glossy (#331: the same
  page, only styled differently; the first-run wizard's ramps step keeps its compact
  ready-made-ramp select)
- **Then** the catalogue is the picker and exactly one place outside it says what is
  chosen: a block reading top-down as a statement — "Selected", the model's name,
  "Step heights" with the display unit, then the heights themselves. The same numbers
  are never printed twice, and no second card repeats them next to the list.
- **Given** the tab's running order
- **Then** the answer comes first and the means of changing it below: what is set (the
  model and its step heights), the settings that follow from it (number of ramps), the
  picker for changing your mind last. Someone opening this tab is usually checking what
  is set rather than re-choosing; whoever is re-choosing opens the picker. The custom
  step-height editor stays directly under the block showing those heights, since that
  is what it edits. "Drain side" is not on this tab: it is about which way the vehicle
  may lean, so it sits with "Tolerance" on the Level tab (#329).
- **Given** the choice "Custom set"
- **Then** it is the _first_ entry of the catalogue inside that disclosure, not a
  separate control below it: entering your own step heights is one of the choices, and the one that is relevant
  whatever brand you own, so it leads rather than trailing every ready-made model
  (`RAMP_MODELS` in `src/domain/ramps.ts`) you may already have ruled out. The brand
  filter never hides it — narrowing to a brand says which ready-made models to show,
  it does not withdraw the option of entering your own.
- **Given** the setting that depends on the chosen ramp (number of ramps)
- **Then** it sits below the block naming that choice, not above the answer it belongs
  to.
- **Given** the tab on any phone (usability review against #189's persona — someone
  setting up their first motorhome, reading at arm's length in poor light)
- **Then** the catalogue is not a scroll region inside the scrolling settings page: every
  model is laid out in full and the page does the scrolling, so nothing is hidden behind
  an inner scrollbar with no sign that more exists. Its labels are set at a size that
  matches the app's own reason for 18px body text, not the 10px uppercase they were.
  Changing the ramp is one collapsed disclosure, "Change ramp", holding the brand
  filter and the catalogue it narrows together — not a filter on the tab and the thing
  it filters somewhere else. Closed by default, so the tab shows the
  answer and its settings on one screen; whoever is re-choosing opens it. The heading
  names the action rather than the filter, since the filter is only part of what is
  inside.
- **Given** "Number of ramps"
- **Then** its label says it is how many ramps you have, and one short sentence beside
  the field says that the app places them where they help most (#329). Modern used to
  carry that as two separate help texts a few lines apart — this one and a general
  ramp-placement note — saying overlapping things and costing the tab a line it did not
  have. Only the wizard's ramps step still shows the placement note, where it stands
  alone.
- **Given** the tab on any phone the fit test holds to one screen, down to a 375x553
  screen (an iPhone SE in Safari)
- **Then** it fits whole in every language with the picker closed. It did not while the
  Save row and the Advanced block were on it; both are gone (#328, #329).

## R48 — Simulated Xparkle box (`?xparkle-sim`): the whole flow, no hardware (#271)

The Xparkle sibling of R44, and for the same reason: nobody has the box, so without a
simulator its flow could only ever be exercised by unit-test fakes. Same convention, same
seam — a simulated `XparkleTransport` (`xparkleSimulator.ts`) answering in the real wire
format, with everything above the seam exactly the code a real box runs through.

Two things it has to model that R44's does not, because the two boxes genuinely differ:
the reading is answered **on demand** from a polled read rather than pushed on a timer,
and the login handshake is answered with real reply frames.

- **Given** any browser, with or without Web Bluetooth
- **When** the app is opened with `?xparkle-sim`
- **Then** the Xparkle box presents as available everywhere it normally would (the
  Sensor box page, the sensor-status dot, onboarding's source step — one shared
  gate, `isXparkleAvailable()`), and connecting reaches a simulated box with no picker:
  live payloads in the real 1/100° format resolving to the same small fixed tilt `?demo`
  and R44 use, plus a slight deterministic wobble (a pure function of the sample index,
  no clock or randomness) so the UI visibly lives while staying still (R25).
- **Then** the simulated box answers the password command and the parameter query with
  real reply frames, so the connect handshake is exercised end to end rather than
  short-circuited.
- **Given** `?xparkle-sim=badpassword`
- **Then** the box rejects the password, so the "wrong password" state can be reached
  deliberately — the case most likely to reach a real user first (a box whose password
  was changed in the vendor app) and the least likely to be right on the first try.
  Its code is `1234` (#367), so typing it on the box's page shows the way out; an
  ordinary simulated box accepts only the factory `0000`.
- **Given** `?xparkle-sim=drop`
- **Then** the simulated connection is lost a short while after (re)connecting and stays
  unreachable for a few seconds before recovering — over and over, so the lost-connection
  state, the R37 prompt and the background auto-retry are all watchable.
- **Given** the simulated box was connected and the app is reopened **without** the flag
- **Then** it is not stranded on "external sensor unavailable": a simulated device id is
  only reachable in simulation mode, and that mismatch is checked rather than retried
  forever (the defect #223 found in R44's own simulator, not repeated here).

## R49 — Xparkle RVS01 as a second external measurement source (opt-in, partly verified)

The second box Libell speaks to (#272). Everything R32–R37 promises about an external
source applies to it — opt-in, never a silent switch, its own installation offset, the
lost-connection prompt, the staleness overlay — so this requirement states only what is
specific to this device.

**Only partly tested against a physical box.** The protocol was read off the vendor
app's own unobfuscated source (`docs/competitor-notes.md`), which is as solid as a
decompile gets. A first physical box (#273) confirmed that it is found by name, connects
and reports readings without needing the password; which physical edge it treats as
"front", and so whether Libell names the same wheels as the vendor app for every
installation orientation, is still open there. Until that is closed, the app must not
present this source as more proven than it is.

- **Given** a phone with Chrome/Android and Web Bluetooth support (or `?xparkle-sim`)
- **When** the user connects the Xparkle box from the Sensor box page
- **Then** the app finds it by its advertised name (`RVLevel`/`RVbalance`, what the
  vendor app itself matches on) or its `0000fff0-...` service, runs the vendor app's own
  connect handshake — password, then a parameter query — and the wheel/bubble UI updates
  from the box's polled readings (rate: docs/03-ARCHITECTURE.md §Sensor).
- **Given** the box reports its tilt as two finished angles rather than accelerometer
  axes
- **Then** Libell synthesizes the gravity vector its own leveling math takes, so the
  guidance, the ramp plan, the stillness detection and the staleness overlay are the
  same code every other source runs through — never a second leveling path.
- **Given** the box lying still while the level screen shows it (#457)
- **Then** the wheel heights and the bubble are steady: the box's few readings are
  smoothed so the screen glides between two of them instead of jumping at each one
  (how: `docs/03-ARCHITECTURE.md` § Sensor). The same applies to every Sensorbox.
- **Given** the box applies its own stored mounting orientation before reporting angles
- **Then** **Superseded** by #314 and #332 — Libell never changes the box's own setting;
  the direction picked on its page is a quarter-turn axis mapping applied on top of the
  box's output (the same kind the lift guide learns), and the orientation the box reports
  is not shown, see R51.
- **Given** the box is connected and the user taps "Not sure? Learn it by raising the
  front" in the direction step of its page (R51, #360), then "Learn the mounting" (#293)
- **When** the user raises the vehicle's front, confirms, lowers it, raises the right
  side and confirms
- **Then** Libell learns which of the box's two angles moved for each lift and in which
  direction, and from then on reads them so a raised front is front high and a raised
  right side is left low — whichever of the four directions the upright box faces, and
  composed with
  whatever the box already applies, since it is measured rather than described. The
  user never needs the vendor app for this. A lift too small to tell from noise, one
  that moved both angles about equally, or two lifts that moved the same angle are
  refused with the reason and nothing is stored; the learned mounting can be forgotten
  with the direction step's one "Forget the direction" link (R51; the guide has no
  button of its own for it, #343), which returns to the box's own directions.
- **Given** the connection to the box is lost while it stays switched on and in range
- **When** the background auto-retry runs (R37; a "Reconnect" tap opens the picker,
  #307)
- **Then** the app reconnects to the same box without the device picker (#288): a read
  that fails or never answers closes the link rather than leaving it half-open (a box
  does not advertise while it holds a connection), and the silent reconnect first waits
  a bounded time to hear the box advertise where the browser can watch for that. Within
  the same app session this works without the browser's `getDevices()` (behind a flag
  in Chrome on Android): the app reconnects to the box the user picked. After the app
  has been restarted, only a browser with `getDevices()` can reconnect silently;
  elsewhere the user connects again from the sensor page, or taps "Reconnect" (#307).
- **Given** a Chromium browser with Web Bluetooth but without `getDevices()` (Chrome on
  Android by default)
- **When** the user opens the closed "Advanced" disclosure on the sensor's page
- **Then** a short tip explains how to turn on silent reconnect in Chrome
  (`chrome://flags`, the new permissions backend for Web Bluetooth, relaunch, connect
  once), with a button that copies the address (#310; found on hardware: with the flag
  on, the box reconnects silently even after a restart). Where silent reconnect already
  works, there is no Web Bluetooth, or the browser is not Chromium — any browser on
  iPhone or iPad, Bluefy included, has no `chrome://flags` — the disclosure is not shown.
- **Given** the box rejects the password it is offered
- **Then** the Sensor box page says so specifically, and says where to fix it —
  never the generic "could not connect", which would point the user at the hardware
  rather than at the setting that is actually wrong.
- **Given** the box rejects the password (#367)
- **When** I look at the box's card or its own page
- **Then** neither says "Connected": the state reads "Wrong password", and the message
  tells me to type the box's four-digit code in Libell (the factory code is 0000), with
  a field and one "Try again" button; only a code the user does not know is changed in
  the Xparkle app, since Libell never changes a box's password. Try again offers
  the code to the connected box at once and says whether it was accepted, rejected, or
  not answered; a code that is not four digits is explained, not sent. The code is kept
  in Libell's settings and offered on every later connect. Readings keep flowing
  throughout: nothing is blocked while the code is wrong.
- **Given** the guide's Sensor box step is shown (#390)
- **When** I connect a box that rejects its password
- **Then** the card shows "Wrong password" and the password field without leaving the
  step, because the verdict arrives after the connect and the card redraws live, as on
  the box's own page. When I type the right code, the field hides, the card shows
  "Connected" and the code is kept.
- **Given** the Xparkle box is connected and the user taps "Zero now" ("Nollställ nu")
  or "Zero again" — on its own page (R51) or in the Calibrate and zero tab (R11)
- **Then** Libell has the box zero itself with its own command (#290), so its readings
  are relative to that position. Libell records the moment as a zero installation
  offset, which drives the "⚠ Zero" lamp and the age text, and replaces any older
  Libell-side offset so two zeros are never stacked. If no box is connected, or
  the command cannot be written, it says so and nothing is changed.
- **Given** the box must stand upright to measure right (#273, #304): verified on
  hardware, a box lying on its back changes both angles whenever it turns about its own
  axis, so no zero taken there holds
- **When** the box's own page is open
- **Then** its live position line (R51) shows whether the box stands
  upright; past 45° on either axis it says the box is lying down and to stand it up,
  whichever way it faces. Libell guides and never blocks: with the box in contact,
  zeroing and picking the direction always run, whatever its position (R51), so a box
  that was zeroed lying down earlier is recovered by standing it up and zeroing again in
  Libell, never in the vendor app.
- **Given** any other command that would change what the box has stored (its vehicle
  dimensions, its orientation, a factory reset), or the zero command without that tap
- **Then** Libell never sends it. The box remembers its own configuration, and silently
  rewriting a user's setup is worse than not supporting it. Libell's learned mounting
  (#293) lives in Libell's own settings instead.

## R50 — Check for a new version from the top bar (#301)

- **Given** a newer version has been deployed
- **When** I tap the Libell name / version in the top bar
- **Then** a short "Checking for updates…" message shows, then "Updating to the new
  version…" while the new version is fetched and activated, and the app reloads into it.
- **Given** I already run the latest version
- **When** I tap the name / version
- **Then** a short "You have the latest version" message shows and nothing reloads.
- **Given** I have no connection
- **When** I tap the name / version
- **Then** a short message says there is no connection to check with.
- **Given** a newer version has been deployed
- **When** I open the app, or bring it back to the foreground
- **Then** the update is found and the app reloads into it once, without a second
  relaunch.

## R51 — The box's own page: one header, a two-step setup checklist (#314, #332)

The #309 UX review found the box page three stacked sections of paragraphs and buttons,
jargon ("installation offset", "raw reading"), no order, and — when the connection was
lost — a line telling the user to tap a Reconnect button that only existed on another
page. This requirement gives every external box the same page; only the box's picture,
the position its live line checks and what its direction step offers differ, read from
its descriptor's capabilities (ADR 0016).

- **Given** a box's own page (R40) is open
- **Then** its header says the state in a few words — "Connected · battery 62 %", "Lost
  contact", "Wrong password" (R49, #367) or "Not connected" — and, whenever the box is
  not delivering, carries the one button that fixes it: **Reconnect** (lost) or **Connect** (not the active source),
  the same device picker as everywhere else (#307). The battery is shown there and
  nowhere else on the page (#332), apart from R32's low-battery warning.
- **Given** the box is the active source
- **Then** under the header one live line starts with the box's position and goes on
  with its tilt: "✓ Stands upright · Side/side 0.0° · Front/back 0.0°". A box built
  to stand (the Xparkle box) "Stands upright" or "Lying down: stand it upright, facing
  any way"; a box built to lie flat (the EasyLevel box) "Lies flat", "Tilted too far:
  lay it flat, top up" or, lid down, "Upside down: turn it lid up…" (#362). Before the
  first reading it says "Position: waiting for a reading". Past 45° on either axis is
  wrong, and the line turns to the warning colour with "!" instead of "✓". It is a status line, not a step: there is
  nothing to press (#332).
- **Given** the box is not the source in use, or has lost contact (#343)
- **Then** that line reads "Tilt now: —" and says nothing about the position: the only
  reading there is the phone's or a stale one, and neither tells how the box stands. Every
  setup action (picking the direction, the lift guide, zeroing, forgetting) is greyed out
  until the box is back; the steps still open to show what is set. Without the box
  there is nothing to set it with, so this is the one exception to "guidance, never a
  gate" (Morgan, 2026-10-11).
- **Given** the box connects or drops while its page is open — from the page's own
  Connect/Reconnect button or anywhere else (#343)
- **Then** the page redraws at once: Disconnect and the live actions appear, or grey
  out, without leaving and reopening it.
- **Given** the box is the active source (or not, then greyed out as above, #400)
- **Then** the page shows a checklist of two steps, each with a ✓ when done and only
  the next undone one expanded (in a neutral frame: green means done, never "open", #343); every step can be opened and run at any time — guidance,
  never a gate:
  1. **Direction**: for the Xparkle box, a top-down picture of the user's own vehicle —
     motorhome or caravan, from the vehicle setting — with one button at each of its four
     sides. Each shows the box turned so its back (the screw mount) points out that way.
     The user taps where it points; the box drawn inside the vehicle follows, and the
     step's title names the side ("Direction set: points to the rear"). For the
     EasyLevel box, R43's two placements instead: two pictures of the vehicle with the
     box in it, arrow forward, long side or short side facing the front ("Direction set:
     short side forward"), unpicked until the user picks (#359). Either takes effect on
     the next reading. For the Xparkle box the choice is a quarter-turn axis mapping, the
     same kind the lift guide (R49, #293) learns; for both boxes "Not sure? Learn it by
     raising the front" opens that guide instead (#360). Which choice equals the Xparkle box's
     unrotated output is assumed to be "back toward the front" until checked on
     hardware; the lift guide measures instead of assuming. Once a direction has been
     picked or learned, a "Forget the direction" link sits in this step, for both boxes
     (#359). Picking a side, or
     finishing the lift guide, keeps the step open so the choice is seen; it closes
     only by hand (#347).
  2. **Zero on level ground**: "Level the vehicle with a spirit level, then zero." and
     **Zero now** (R34; the Xparkle box zeroes itself, #290), then "Zeroed" with its age.
     A done zero drops the first-time instruction and offers **Zero again**, with
     a **Forget the zero** link under it (#332), named like "Forget the direction" so it never reads as a second zeroing; forgetting returns the box to its own factory readings. A box that zeroes itself (the Xparkle box) keeps that zero, so it has no such link (#343). There is no separate check here (#343): the live line above already shows the tilt from the zero, so on the ground where it was zeroed it reads 0.0° while the zero still holds.
- **Given** the order of the steps
- **Then** the direction comes before the zero: the direction is learned from
  differences and works anywhere, while the zero needs level ground — and leveling with
  Libell's own ramp guidance needs the direction first.
- **Given** the rest of the page (#332)
- **Then** there is no collapsed "More": each action sits in the step it belongs to.
  Below the steps, with at least a button's height of space (#343), **Disconnect** is an
  outline button in the warning colour, so it does not read as one more setup step. Last
  come the closed disclosures: the debug info for a box that has one (R40) and the
  silent-reconnect "Advanced" tip where it applies (R49). The
  mounting the box reports about itself is not shown: Libell sets the direction itself
  and never depends on the vendor app.
- **Given** an external box reads a wrong position on the main screen (R17, #285, #304)
- **Then** the overlay says it in one sentence and one short reason ("The box is lying
  down" / "It only measures right standing up.") with one button, **Show the box**, which
  opens this page.
