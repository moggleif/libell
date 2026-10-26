# Contributing

## Prerequisites

- Node.js 22 (or any version supported by the pinned Vite/Vitest majors)
- npm 10+

## Getting started

```sh
npm install
npm run dev      # dev server on http://localhost:5173/
```

## Build & test

```sh
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit, app + tooling configs
npm run test          # Vitest unit tests
npm run test:coverage # the same, failing if coverage drops below its floor (CI runs this)
npm run build         # icons + typecheck + production build into dist/
npm run preview       # serve the production build locally
npm run smoke         # Playwright: the built app renders (needs `build` first)
npm run flows         # Playwright: the app's flows through main.ts's real wiring (needs `build` first)
npm run fit           # Playwright: it all fits a phone screen (needs `build` first)
npm run bundle        # bundle guard: what loads at start, gzip budgets, precache (needs `build` first)
npm run timing        # Playwright: cold start to the level screen, CPU ×4 (needs `build` first)
```

The app is served from the root of `libell.app`, so the base path defaults to `/`. The
deploy workflow passes the base path GitHub Pages reports as `BASE_PATH`, and the
Playwright scripts read the same variable, so `BASE_PATH=/libell npm run build` builds for
a project site ([ADR 0020](adr/0020-own-domain-at-the-root.md)).

The Playwright scripts need a build to serve, so they are not part of the
pre-commit set — CI runs them after `build`. `flows` (#374, #392) drives the simulated
boxes (`?easylevel-sim`, `?xparkle-sim`), the counting choice, the first-run guide, the level screen, sound,
navigation, settings saves, start-up and switching vehicles through the real wiring in `src/main.ts`, one
file per flow in `scripts/flows/` with the shared helpers in `scripts/flows/harness.mjs`;
extend it before you change how `main.ts` connects the `src/app/` modules. `fit` (#239, #241, #243) opens **every**
view — level, the counting choice, first-run guide, settings, help, external sensor, the iOS sensor guide,
the incoming shared-setup dialog — against small-phone viewports in every appearance,
and fails on anything below the fold, a page that scrolls sideways, content wider than
its container, a view whose end cannot be scrolled to, a diagram taller than the space
it was given, a wheel card that has drifted off its wheel, or a guide calibration step
spaced differently than Classic's rules space it (#572).

Languages are walked per viewport rather than everywhere (`languages` on each entry of
`VIEWPORTS`): the language dimension catches text that runs longer than its space, and
the space is tightest on the iPhone SE, so every language is walked there (the list is
read from the dictionaries in `src/ui/messages/`). The 320px entry is about width, where
German is the worst case and English the baseline; the roomiest screen is a structural
sanity check where one language suffices. That is 3 language-runs per appearance plus
one per language. If you widen the matrix, watch the run time. `FIT_APPEARANCE=modern npm run fit` walks a single appearance; CI runs one job per
appearance side by side (#494), and the list in `.github/workflows/ci.yml` must name
every appearance (a unit test checks it). It exists because the unit tests cannot catch any of that: Vitest runs in
happy-dom, which has no layout engine, so every height and width it measures is zero.
Whenever you add a view, add a step, or change a layout, this is the check that tells
you it still fits.

It ends with a **static** check over `styles.css`, which is not a stylistic
preference: on iOS a `position: fixed; inset: 0` box is laid out against the
toolbar-free _large_ viewport while `window.innerHeight` is the small one, so its
bottom sits behind Safari's bar with nothing to scroll. Chromium makes the two
identical, so the bug is invisible at runtime here — every full-screen container is
therefore required, in the stylesheet, to set `height: 100svh` (with `100vh` above it
as the fallback) and to pad its bottom by `env(safe-area-inset-bottom)`. Add a
full-screen container and you must add it to `VIEW_CONTAINERS` in the script.

Three more things to know if you extend it. It seeds preferences through the **real**
localStorage keys (`libell.settings` for the settings object, `libell.language` and
`libell.onboarded` on their own — see `src/data/settingsStore.ts`); write anything else
and every run silently falls back to the defaults, which quietly collapses the whole
sweep to one combination tested many times. The level view is only reachable with
`?demo`, since a CI machine has no motion sensor. And the incoming-setup view is
reached by pressing the app's own "share vehicle setup" button and opening the link it
produces — `.settings__share-vehicle` is a stable hook for exactly that, so the test
does not have to carry a copy of the i18n table.

## Deployment

Every merge to `main` builds and publishes `dist/` to GitHub Pages via
`.github/workflows/deploy.yml`, which needs **Settings → Pages → Source: GitHub Actions**
enabled once for the repository. Versions, candidate builds and release texts
(`docs/releases/`) are specified in ADR 0007
([`docs/adr/0007-pages-as-qa-and-versioning.md`](adr/0007-pages-as-qa-and-versioning.md)).
Every CI run also uploads the built site as a `libell-site-<sha>` artifact, so a pull
request can be previewed before it is merged.

## Testing on a real phone

Sensor APIs require a **secure context**, so `http://<your-lan-ip>:5173` will not deliver
motion events. Either:

- use the deployed GitHub Pages URL (HTTPS, always current with `main`), or
- tunnel the dev server through HTTPS (e.g. `npx localtunnel --port 5173`), or
- forward the port over USB so the phone sees it as `localhost`, which counts as secure:
  `adb reverse tcp:5173 tcp:5173`.

On iOS the app cannot read motion until you tap the in-app "Start" button — that is a
Safari requirement, not a bug.

A Sensorbox needs Web Bluetooth: Chrome on Android works, iPhone needs the Bluefy browser
([`docs/ios-easylevel-bluefy-guide.md`](ios-easylevel-bluefy-guide.md)). Without a box,
`?easylevel-sim` and `?xparkle-sim` simulate one in any browser.

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

## Quality guards

`npm run test` also runs the guards in `scripts/quality/` over the app source (#475), so
they block a merge like any failing test. The size guard also measures `scripts/` (#518),
the browser test scripts included. Each failure names the file and what to do.

- **Size:** a function may span at most 50 lines (inner functions included) and a file
  at most 400 (`src/ui/messages/` is exempt). Functions and files that were longer when
  the guard arrived are listed in `scripts/quality/size-baseline.json`; they may shrink
  but never grow, and the guard asks you to lower or remove an entry once they shrink.
  Never raise a baseline or a limit to get green: split the code instead.
- **Unused exports:** every exported function, constant or class in `src/` must be
  imported by some other file (a test or a script counts, see #376). Exported types are
  left alone, since they describe a module's interface. When the guard fails, drop
  `export` if the file uses the name itself, or delete the code if nothing does.
- **Doc paths:** every repository path and file name mentioned in `README.md`,
  `CLAUDE.md`, `SECURITY.md`, the numbered documents in `docs/` and the repo skills in
  `.claude/skills/` must exist. When you
  rename or move a file, update the documents that name it in the same change. ADRs are
  dated records and are not checked.
- **ADR numbers:** every ADR in `docs/adr/` has its own number, and the index in
  `docs/adr/README.md` lists each one once, in numeric order (#711). Before merging a new
  ADR, check that no other branch merged the same number first.
- **Element helper:** in `src/ui/` and `src/app/`, an element whose class is set on the
  line after `document.createElement` is built with `createElement(tag, className)`
  from `src/ui/dom.ts` instead (#521). The other small builders live there too, so
  a module does not write its own copy: `button`, `textElement`, `paragraph` and
  `externalLink` (#710).
- **Bundle:** after the build, CI runs `npm run bundle` (ADR 0024). It fails when the
  entry file holds a module listed in `entryExcludes` in
  `scripts/quality/bundle-budget.json` (those load after the first render, through their
  seams), when a file is over its gzip budget there, or when a file is not precached.
  Lower a budget when a change makes the files smaller; never raise one to get green,
  load more after the first render instead. A change to what loads at start reports
  `npm run timing` before and after in its pull request.
- **Coverage:** CI runs the unit tests with `npm run test:coverage`, which fails when
  statement, branch, function or line coverage of `src/` drops below the floors in
  `vite.config.ts`. The floors sit about 0.8 points under `main`'s coverage when last
  raised. Raise them when coverage grows; never lower them to get green, add the
  missing tests instead.

## Translations

English (`src/ui/messages/en.ts`) is the source every language is translated from;
Swedish is the original meaning. A new string needs a context entry in
`src/ui/messages/context.ts` and a translation in every language. Every translation, new
language or review, follows the `translate` skill in `.claude/skills/translate/`:
context first, the locked words in `src/ui/messages/glossary.ts`, a blind
back-translation into Swedish, and only the deviations in meaning fixed and reported. The
unit tests check that every key has context and that each language uses its locked word
in the glossary's anchor strings.

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
