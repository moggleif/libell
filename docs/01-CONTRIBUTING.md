# Contributing

## Prerequisites

- Node.js 22 (or any version supported by the pinned Vite/Vitest majors)
- npm 10+

## Getting started

```sh
npm install
npm run dev      # dev server on http://localhost:5173/libell/
```

## Build & test

```sh
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit, app + tooling configs
npm run test          # Vitest unit tests
npm run build         # icons + typecheck + production build into dist/
npm run preview       # serve the production build locally
npm run smoke         # Playwright: the built app renders (needs `build` first)
npm run fit           # Playwright: it all fits a phone screen (needs `build` first)
```

The two Playwright scripts need a build to serve, so they are not part of the
pre-commit set — CI runs them after `build`. `fit` (#239, #241) walks the level view
and every step of the first-run wizard against small-phone viewports, in both
appearances and all five languages, and fails on anything below the fold, any content
that has to scroll, a diagram taller than the space it was given, or a wheel card that
has drifted off its wheel. It exists because the unit tests cannot catch any of that:
Vitest runs in happy-dom, which has no layout engine, so every height it measures is
zero. When you add or grow a wizard step, or change the level view's layout, this is
the check that tells you it still fits.

Two things to know if you extend it. It seeds preferences through the **real**
localStorage keys (`libell.settings` for the settings object, `libell.language` on its
own — see `src/data/settingsStore.ts`); write anything else and every run silently
falls back to the defaults, which quietly collapses the whole sweep to one combination
tested many times. And the level view is only reachable with `?demo`, since a CI
machine has no motion sensor.

## Testing on a real phone

Sensor APIs require a **secure context**, so `http://<your-lan-ip>:5173` will not deliver
motion events. Either:

- use the deployed GitHub Pages URL (HTTPS, always current with `main`), or
- tunnel the dev server through HTTPS (e.g. `npx localtunnel --port 5173`), or
- forward the port over USB so the phone sees it as `localhost`, which counts as secure:
  `adb reverse tcp:5173 tcp:5173`.

On iOS the app cannot read motion until you tap the in-app "Start" button — that is a
Safari requirement, not a bug.

## Binary assets

The repository is kept **text-only**. `public/icons/icon.svg` is the single icon source;
`scripts/generate-icons.mjs` renders the PNG variants during `npm run build`, and those
PNGs are gitignored. Add new artwork as SVG and extend the generator rather than committing
raster files.

## Git hooks

Enable the shared hooks once (format + typecheck + tests before each commit, tests + build
before push):

```sh
git config core.hookspath .githooks
```

## Workflow

- **Behavior- and issue-driven.** Every feature has a GitHub issue with Given/When/Then
  acceptance criteria, sourced from `docs/02-REQUIREMENTS.md`. The tracking issue lists the
  order.
- **Test first.** For testable logic (e.g. the leveling math), write the failing test from
  the issue's acceptance criteria, then implement until green.
- **Small commits**, one increment at a time; reference the issue in the commit message.
- Develop on a feature branch, never directly on `main`. Don't open a pull request
  unless asked.
- When a change alters behavior, update `docs/02-REQUIREMENTS.md` in the same PR; an
  architecturally significant change also gets an ADR in `docs/adr/` (see its README).

## Code rules

See `CLAUDE.md`. Key points: the `domain/` layer stays pure (no `window`, `document`,
`navigator` or `localStorage`) so it is unit-testable in plain Node; all user-facing
strings go through `t()` in `src/ui/i18n.ts` with coverage in every shipped language; colors
come from the CSS custom properties in `src/ui/styles.css`.
