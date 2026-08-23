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
│   ├── stability.ts  # display hysteresis: values change only past a dead band
│   └── settings.ts   # LevelSettings + Calibration (validation, legacy migrations)
├── data/          # settingsStore.ts — localStorage read/write for settings + calibration
├── sensor/        # orientation.ts — gravity vector as a subscription
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

The highest wheel is always the reference. An optional stored calibration (roll/pitch
captured on a known-level surface) is subtracted from the reading. Output: per-wheel
`{liftMm, stepMm}`, plus `rollDeg`, `pitchDeg`, `isLevel`. The UI renders through the
display stabilizer in `stability.ts`, which applies the configurable hysteresis dead
band ("Stability") to the shown mm figure, step, wheel color and level status.

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
outdated value falls back to defaults. Defaults: wheelbase 4000 mm, front and rear track
width 1800 mm, one 40 mm ramp step, tolerance 20 mm, stability 3 mm. Legacy cm values
migrate on read (×10): wheelbase, track widths (including a single `trackWidthCm` for
both axles) and step heights.

## Offline

Workbox precaches every build asset (`js`, `css`, `html`, `svg`, `png`), so once the app
has been opened with a connection it works with no signal at all. `registerType:
'autoUpdate'` means a new deployment is picked up on the next launch.

## UI

The RV top-down diagram is the hero element (see `docs/02-REQUIREMENTS.md` R4–R6) with
the bubble level embedded at its center; per-wheel readouts sit directly at the wheels
(step above, whole cm below). Everything is inline SVG, sized in viewport units so the
diagram stays legible on a phone lying on a table. Settings, Calibration and Help live
in the full-width hamburger menu; amber warning lamps in the top bar point to unsaved
settings or a missing calibration. All user-facing strings go through the i18n dictionaries (sv/en) in `src/ui/i18n.ts`.

## Build / CI notes

The repository is text-only: PWA icons are rendered from `public/icons/icon.svg` by
`scripts/generate-icons.mjs` during `npm run build` and are gitignored. CI runs
`format:check`, `typecheck`, `test` and `build` on every branch; pushes to `main` deploy
`dist/` to GitHub Pages.
