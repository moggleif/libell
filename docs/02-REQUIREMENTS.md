# Requirements (behaviors)

These are written as **desired-state user behaviors** with Given/When/Then acceptance
criteria. Each maps to a GitHub issue. They describe how the finished system works — not
"changes". The implementation order is tracked in the MVP tracking issue.

## Audience & purpose

LevelMate helps a motorhome/RV owner level their vehicle on a pitch. The user lays the
phone flat inside the RV (on a table or floor) with the **top edge of the phone pointing
toward the front of the vehicle**. The app tells them which wheels to raise and by how
much, and shows a live level. There is **no calibration step** and **no account**.

LevelMate is an installable web app (PWA), so it runs on any modern phone from a single
URL and must keep working with no signal.

## R1 — The app is ready to use the moment it opens

- **Given** I open LevelMate
- **When** the page loads
- **Then** the title "LevelMate" is shown, the layout is usable with the phone lying flat,
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

- **Given** a known wheelbase, front and rear track width and the available ramp step
  heights
- **When** the vehicle is tilted by roll and pitch
- **Then** each wheel's required lift is `max(z) − z_i` (≥ 0) where
  `z_i = x_i·tan(roll) + y_i·tan(pitch)`, expressed in cm together with the available
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
- **Then** I see a top-down outline of the RV with a "Front ↑ – point the top of your phone
  here" arrow, so I know how to place the phone. The RV diagram is the focal element of the
  screen.

## R5 — Wheels that need raising are highlighted on the diagram

- **Given** the RV is not level
- **When** I look at the RV diagram
- **Then** each wheel that needs raising is colored (orange for a small lift, red for a
  large one) and shows its required lift in cm at its position; wheels that are fine are
  shown neutral.

## R6 — A per-wheel list and a clear "level" confirmation

- **Given** the RV is not level
- **Then** a list shows each wheel as e.g. "Front left: 4.2 cm (≈3 blocks)", or "Front
  left: OK" when that wheel needs no lift.
- **Given** all wheels are within tolerance
- **Then** a large green "Your RV is level!" message is shown instead of the list.

## R7 — A live bubble level (secondary)

- **Given** I am on the main screen
- **Then** a round bubble level moves in real time with the tilt; it reads centered/green
  when within tolerance. It is secondary to the RV diagram.

## R8 — The current tilt in degrees is visible

- **Given** I am on the main screen
- **Then** small gray text shows the current tilt in degrees as front/back and side/side.

## R9 — Vehicle parameters are configurable and persist

- **Given** I open Settings
- **When** I edit Wheelbase, Track width front, Track width rear, Ramp step heights
  (mm, semicolon-separated — a leveling ramp is a staircase, so every available height
  is listed, e.g. "20; 40; 60"), or Tolerance and save
- **Then** the values persist across app restarts (`localStorage`) and immediately affect
  the calculation. Defaults: wheelbase 400 cm, front and rear track width 180 cm, one
  40 mm step, tolerance 0.5°.
- **Given** the stored value is missing or corrupt
- **Then** the app falls back to the defaults rather than failing to start.

## R10 — The app installs to the home screen and works offline

- **Given** I have opened LevelMate once with a connection
- **When** I later open it on a pitch with no signal
- **Then** the app loads and works fully offline.
- **Given** I am browsing LevelMate
- **When** I choose "Add to Home Screen" / "Install"
- **Then** it installs with its own LevelMate icon and opens standalone, without browser
  chrome.
