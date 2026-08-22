# LevelMate

LevelMate is an installable web app (PWA) that helps you level a motorhome / RV.

Lay your phone flat inside the vehicle (for example on the table) with the **top edge of
the phone pointing toward the front**. LevelMate then shows a top-down view of the RV with
the wheels that need raising (in cm and number of leveling blocks) plus a live bubble
level. No calibration, no account, and it works offline once loaded.

> **Status:** this repository currently contains the project foundation — CI, docs, a
> deployable PWA shell and a buildable skeleton. Features are built incrementally; see the
> GitHub issues and `docs/02-REQUIREMENTS.md`.

## Using it on your phone

Open the deployed app and, when you want it permanently available:

- **Android (Chrome):** menu → **Add to Home screen** / **Install app**
- **iOS (Safari):** Share → **Add to Home Screen**

It then launches standalone, like any other app, and keeps working with no signal.

Two platform notes:

- **iOS needs one tap.** Safari only releases motion data after a user gesture, so the app
  shows a "Start" button the first time. Android grants access silently.
- **HTTPS is required.** Motion sensors are unavailable on plain HTTP origins.

## How leveling works

From the device gravity vector `(gx, gy, gz)`:

```
roll  = atan2(gx, gz)   // side/side
pitch = atan2(gy, gz)   // front/back
```

Wheel positions in the vehicle plane (`x` = right, `y` = front), wheelbase `L`, track
width `W`: FL `(-W/2,+L/2)`, FR `(+W/2,+L/2)`, RL `(-W/2,-L/2)`, RR `(+W/2,-L/2)`. Each
wheel's height is `z_i = x_i·tan(roll) + y_i·tan(pitch)`. Blocks go only _under_ wheels, so
the highest wheel is the reference: `lift_i = max(z) − z_i ≥ 0`, shown as cm and
`round(lift_i / blockHeight)` blocks. Level when `|roll| < tolerance` and
`|pitch| < tolerance` (default 0.5°). Full spec in `docs/03-ARCHITECTURE.md`.

## Tech

- TypeScript (strict) + Vite, no UI framework — plain DOM and inline SVG
- Vitest, Prettier
- `vite-plugin-pwa` (Workbox) for the manifest and offline service worker
- Static deployment to GitHub Pages

## Developing

```sh
npm install
npm run dev           # http://localhost:5173/levelmate/
npm run test          # unit tests
npm run typecheck     # tsc --noEmit
npm run build         # production build into dist/
```

The base path defaults to `/levelmate/` for GitHub Pages project hosting. Override it with
`BASE_PATH=/ npm run build` for a custom domain or root-level hosting.

## Deployment

Pushes to `main` build and publish `dist/` to GitHub Pages via
`.github/workflows/deploy.yml`. This requires **Settings → Pages → Source: GitHub Actions**
to be enabled once for the repository.

Every CI run also uploads the built site as a `levelmate-site-<sha>` artifact, so a branch
can be previewed before it is merged.

## Development docs

See `docs/01-CONTRIBUTING.md` for the workflow and `CLAUDE.md` for architecture rules.
Enable the shared git hooks once: `git config core.hookspath .githooks`.
