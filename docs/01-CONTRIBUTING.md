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
```

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
- Develop on `claude/progress-check-bnbuog`. Don't open a pull request unless asked.

## Code rules

See `CLAUDE.md`. Key points: the `domain/` layer stays pure (no `window`, `document`,
`navigator` or `localStorage`) so it is unit-testable in plain Node; all user-facing
strings are English; colors come from the CSS custom properties in `src/ui/styles.css`.
