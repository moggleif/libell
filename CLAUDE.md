# CLAUDE.md – Libell (PWA)

Libell is an installable web app (PWA) that helps level a motorhome / RV. The user lays
the phone flat inside the vehicle (the top edge of the phone pointing toward the front) and
the app shows which wheels need to be raised and by how much, plus a live bubble level.

This document defines the architecture rules and quality requirements. Clarity over
cleverness.

---

## 0. Tech stack

- TypeScript (strict) + Vite, no UI framework — plain DOM and inline SVG
- Vitest for unit tests, Prettier for formatting
- `vite-plugin-pwa` (Workbox) for the manifest and the offline service worker
- Deployed as a static site to GitHub Pages; base path `/libell/`
- No build-time backend, no accounts

## 1. Directory layout

```
src/
├── main.ts        # entry point: wires sensor → state → render
├── domain/        # PURE TypeScript, no browser APIs — fully unit-testable
│   ├── leveling.ts   # per-wheel lift math, step recommendation, severity
│   ├── stability.ts  # display hysteresis (a still phone shows a still screen)
│   └── settings.ts   # LevelSettings + Calibration, validation, migrations
├── data/          # settingsStore.ts (localStorage: settings + calibration)
├── sensor/        # orientation.ts (DeviceMotion / DeviceOrientation)
└── ui/            # DOM + SVG components, hamburger menu, styles
```

Behaviors are specified in `docs/02-REQUIREMENTS.md`; design in
`docs/03-ARCHITECTURE.md`.

## 2. Core principles

- `domain/` must stay pure: **no `window`, `document`, `navigator` or `localStorage`**, so
  the leveling math is trivially testable in a plain Node environment. All sensor, storage
  and DOM concerns live outside `domain/`.
- All user-facing strings are **English**.
- Colors come from the CSS custom properties in `src/ui/styles.css`. Don't hardcode hex
  values in components.
- The app must work fully **offline** — a campsite often has no signal. Everything is
  precached by the service worker.
- Sensor access requires a **secure context** (HTTPS or `localhost`).
- The reference is always the highest wheel. An optional phone calibration (capture the
  tilt on a known-level surface, stored in `localStorage`) is subtracted from every
  reading to cancel phone/case bias.

## 3. Leveling math (see `src/domain/leveling.ts`)

From the gravity vector `(gx, gy, gz)`:

- `roll = atan2(gx, gz)`, `pitch = atan2(gy, gz)`

Wheel positions in the vehicle plane (`x` = right, `y` = front), wheelbase `L`, front
track width `Wf`, rear track width `Wr` (axles may differ):

- Front-left `(−Wf/2, +L/2)`, Front-right `(+Wf/2, +L/2)`,
  Rear-left `(−Wr/2, −L/2)`, Rear-right `(+Wr/2, −L/2)`

Per-wheel height: `z_i = x_i·tan(roll) + y_i·tan(pitch)`. Blocks only go _under_ wheels, so
the reference is the highest wheel: `lift_i = max(z) − z_i ≥ 0`. Display cm and the
ramp step height (from the user's configured list, in **mm**) closest to the lift, with
"no step" as a candidate. "Level" when no wheel sits more than the **tolerance (mm,
default 20)** below the highest wheel — height-based, so wheelbase and track width are
inherent. Wheel colors answer "is it worth driving up?": green within tolerance, orange
when a step brings the wheel within tolerance, red when even the best step cannot.
All lengths are in centimetres unless noted mm.

## 4. Sensors on the web

- Prefer `DeviceMotionEvent.accelerationIncludingGravity` — it is the gravity vector, the
  direct equivalent of Android's `TYPE_GRAVITY`.
- Fall back to `DeviceOrientationEvent` (`beta` = pitch, `gamma` = roll) where motion data
  is unavailable.
- **iOS 13+ requires a user gesture**: call `DeviceMotionEvent.requestPermission()` from a
  tap handler. Android Chrome grants access without a prompt on HTTPS. The UI must handle
  the `granted` / `denied` / `unsupported` states explicitly.
- Smooth the reading (exponential moving average) so the display does not jitter.

## 5. Quality requirements

- Run before committing: `npm run format:check && npm run typecheck && npm run test`
- Work is **behavior-driven and issue-driven**: each feature has a GitHub issue with
  Given/When/Then acceptance criteria (sourced from `docs/02-REQUIREMENTS.md`). Write the
  test first, then the implementation, then make it pass.
- The leveling math will be covered by `src/domain/leveling.test.ts`. Any change to the
  math must keep those tests green and add cases for new behavior.

## 6. Git workflow

- Develop on the feature branch `claude/progress-check-bnbuog`.
- One issue per increment; small, reviewable commits. Reference the issue in the commit.
- Descriptive commit messages; create new commits rather than amending pushed work.
- Do not open a pull request unless explicitly asked.
- Enable the shared hooks once: `git config core.hookspath .githooks`.

## 7. Releases & versioning

- The `VERSION` file holds the current **major.minor** (bump it manually for a new
  minor). On every deploy to Pages the workflow computes the next patch from existing
  `v{major.minor}.*` git tags, builds with `BUILD_VERSION`, tags the commit
  `vX.Y.Z`, and creates a GitHub Release when the major.minor is new.
- The build embeds the version (Vite `define` → `__APP_VERSION__`) and the app shows it
  in the footer. Local dev shows "X.Y.Z – local <timestamp>"; a CI build without
  `BUILD_VERSION` shows nothing rather than something wrong.

## 8. Binary assets

The repository is kept **text-only**. The PWA icons are rendered from
`public/icons/icon.svg` into PNGs by `scripts/generate-icons.mjs` at build time
(`npm run build`), and the generated PNGs are gitignored.
