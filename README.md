# Libell

**➡️ Open the app: <https://moggleif.github.io/libell/>**

Libell is an installable web app (PWA) that helps you level a motorhome / RV with your
phone.

Lay the phone flat inside the vehicle (for example on the table) with the **top edge of
the phone pointing toward the front**. Libell shows a top-down view of the RV: green
wheels are fine, orange wheels show which ramp step to drive up onto and how many mm they
are missing, and red means even your tallest step is not enough — reposition instead. A
bubble level sits in the middle of the diagram, and a big "Your RV is level!" confirms
when you are done. Everything works offline once loaded; there is no account.

## Using it on your phone

Open the app link above and, when you want it permanently available:

- **Android (Chrome):** menu → **Add to Home screen** / **Install app**
- **iOS (Safari):** Share → **Add to Home Screen**

It then launches standalone, like any other app, and keeps working with no signal.

First-time setup lives under the **☰ menu** (yellow warning lamps in the top bar remind
you until it is done):

1. **Settings** — wheelbase and front/rear track width (mm), your leveling ramps' step
   heights in mm (e.g. `20; 40; 60`), tolerance and display stability.
2. **Calibration** — put the phone on a known-level surface and tap _Calibrate now_ to
   cancel phone/case bias.

Two platform notes:

- **iOS needs one tap.** Safari only releases motion data after a user gesture, so the app
  shows a "Start" button. Android grants access silently.
- **HTTPS is required.** Motion sensors are unavailable on plain HTTP origins.

## How leveling works

From the device gravity vector `(gx, gy, gz)`:

```
roll  = atan2(gx, gz)   // side/side
pitch = atan2(gy, gz)   // front/back
```

Wheel positions in the vehicle plane (`x` = right, `y` = front; all lengths in mm),
wheelbase `L`, front
track width `Wf`, rear track width `Wr`: FL `(-Wf/2,+L/2)`, FR `(+Wf/2,+L/2)`,
RL `(-Wr/2,-L/2)`, RR `(+Wr/2,-L/2)`. Each wheel's height is
`z_i = x_i·tan(roll) + y_i·tan(pitch)`. Blocks go only _under_ wheels, so the highest
wheel is the reference: `lift_i = max(z) − z_i ≥ 0`, shown in whole mm together with the
configured ramp step height closest to the lift. The vehicle is **level when no
wheel sits more than the tolerance (mm, default 20) below the highest wheel** — height
based, so wheelbase and track width are inherently accounted for. An optional stored
calibration is subtracted from every reading, and a hysteresis stage keeps the display
still while the phone lies still. Full spec in `docs/03-ARCHITECTURE.md`.

## Tech

- TypeScript (strict) + Vite, no UI framework — plain DOM and inline SVG
- Vitest, Prettier
- `vite-plugin-pwa` (Workbox) for the manifest and offline service worker
- Static deployment to GitHub Pages

## Developing

```sh
npm install
npm run dev           # http://localhost:5173/libell/
npm run test          # unit tests
npm run typecheck     # tsc --noEmit
npm run build         # production build into dist/
```

The base path defaults to `/libell/` for GitHub Pages project hosting. Override it with
`BASE_PATH=/ npm run build` for a custom domain or root-level hosting.

## Deployment, versions & releases

Pushes to `main` build and publish `dist/` to GitHub Pages via
`.github/workflows/deploy.yml`. This requires **Settings → Pages → Source: GitHub
Actions** to be enabled once for the repository.

The `VERSION` file holds the current **major.minor**; each deploy is tagged
`vMAJOR.MINOR.PR` (the merged pull request's number), the version is shown in the app's
footer, and the first deploy of a new major.minor creates a GitHub Release. Release texts
live in `docs/releases/<tag>.md` and are applied automatically on push.

Every CI run also uploads the built site as a `libell-site-<sha>` artifact, so a branch
can be previewed before it is merged.

## Development docs

See `docs/01-CONTRIBUTING.md` for the workflow and `CLAUDE.md` for architecture rules.
Enable the shared git hooks once: `git config core.hookspath .githooks`.
