# Libell

**➡️ Open the app: <https://moggleif.github.io/libell/>**

Libell is an installable web app (PWA) that helps you level a motorhome / RV with your
phone. It doesn't just tell you how far off level you are — it turns that tilt into a
plan for the ramps you actually own: which wheels to drive up, onto which step, and when
your ramps can't finish the job at all.

Lay the phone flat inside the vehicle (for example on the table) with the **top edge of
the phone pointing toward the front**. Libell shows a top-down view of the RV: green
wheels are already within tolerance, orange wheels show which ramp step to drive up onto
and how many mm they are missing, gray wheels are low but get no ramp because your ramp
set doesn't stretch that far, and red means even your tallest step can't fix that wheel
by itself — reposition instead. If no arrangement of your ramps reaches level at all, the
status line says so and gives a rough sense of how far off ("close" or "far"). A bubble
level sits in the middle of the diagram, and a big "Your RV is level!" confirms when you
are done. Everything works offline once loaded; there is no account.

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

Want to use an external EasyLevel BLE sensor instead of the phone's own tilt sensor?
That works today on Chrome/Android; on iPhone, Safari doesn't support Web Bluetooth at
all, but [there's a supported workaround](docs/ios-easylevel-bluefy-guide.md).

## How leveling works

The phone's gravity vector gives the vehicle's roll and pitch; from your wheelbase and
track widths the app computes each wheel's required lift, taking the **highest wheel as
the reference** (blocks only go _under_ wheels). Because ramps are sold in pairs and most
owners carry only two or three, raising every low wheel independently is often not
physically possible, so a planning layer picks which wheels get which of your configured
ramp steps — favoring the plan that levels the vehicle with the fewest ramps and, when a
choice remains, keeps your waste-water drain side lowest. The vehicle counts as level
when no wheel sits more than the tolerance below the highest one. The full math, defaults
and display pipeline are specified in `docs/03-ARCHITECTURE.md`, and the ramp-planning
decision in `docs/adr/0011-ramp-plan-for-owned-ramps.md` — those documents are the single
source for the formulas.

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

The `VERSION` file holds the current **major.minor**. The first deploy of a new
major.minor is the release — `vX.Y.0`, tagged and published as a GitHub Release; every
later merge on the same minor is a QA/candidate build named after the release it builds
on plus the merged pull request: shown as `X.Y.0 – CR<PR>` under the app's logo and
tagged `vX.Y.0-CR<PR>`. Release texts live in `docs/releases/<tag>.md` and are applied
automatically on push.

Every CI run also uploads the built site as a `libell-site-<sha>` artifact, so a branch
can be previewed before it is merged.

## Development docs

See `docs/01-CONTRIBUTING.md` for the workflow and `CLAUDE.md` for architecture rules.
Enable the shared git hooks once: `git config core.hookspath .githooks`.
