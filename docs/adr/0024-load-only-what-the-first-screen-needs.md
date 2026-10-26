# 0024 — Load only what the first screen needs

**Status:** Accepted, 2026-10-26 (#708). Carried out in steps, one pull request each.

## Context

The app shipped as one JavaScript file of 1 173 kB (gzip 363 kB). 850 kB of it was the
24 message dictionaries, of which a phone uses one. On a mid-range phone over 4G
(Lighthouse mobile) the level screen appeared at 2.9 s, and every start parsed and ran
the whole file, even from the service worker's cache. Morgan (2026-10-26): "Ladda smart
från start. Lazy load."

## Decision

- **One dictionary.** Each `src/ui/messages/<lang>.ts` is a file of its own. Start-up
  works out the language (the stored choice, else the phone's) and waits for that file
  before it builds the app; `t()` stays synchronous. A language change already reloads
  the app, so nothing re-renders in place. If the file cannot load, English is used.
  Build-time code (the static pages, findability) and the parity tests still read every
  dictionary.
- **The first screen first.** The help and privacy pages, the settings, the Sensorbox
  pages and drivers and the rarely used paths are dynamic imports behind small seams in
  `src/app/` that keep today's interfaces. They load when the phone is idle after the
  first render, or at once when they are needed sooner.
- **The first visit.** With no counting choice or guide stored, the counting choice, the
  intro and the guide are the first screens, so they load at once, beside the dictionary.
- **Offline is unchanged.** Every file stays precached, so the app still works with no
  signal after the first visit. A file that cannot load shows a reload prompt, never a
  silent failure.
- **Nothing blocks the first render.** The service-worker registration is deferred.
- **Guarded and measured.** `npm run bundle` (`scripts/bundle-guard.mjs`) fails the build
  when the entry file holds a module that must load later, when a file is over its gzip
  budget in `scripts/quality/bundle-budget.json`, or when a file is not precached. The
  budgets only ever tighten. `npm run timing` measures a cold start in `?demo` on a CPU
  slowed four times; each step reports it before and after.

## Alternatives considered

- **Keep one file and rely on the service worker** — rejected: the cache saves the
  download, not the parse and run on every start, and the first visit still waits.
- **Fetch the dictionaries as JSON** — rejected: a second loading path and types to keep
  in sync by hand; a TypeScript file keeps each dictionary typed and checked as today.
- **Load the lazy parts only on first use** — rejected: the first tap would wait, and
  loading them while the phone is idle costs nothing the user notices.
- **Split further than the first screen** — rejected: below a few kB each extra file is
  one more request on the first visit for no gain.

## Consequences

- Start-up is asynchronous: `main.ts` awaits the dictionary before it builds the app.
- A module that should load later must never be imported statically from the start-up
  path; the bundle guard names the file that breaks this.
- The first visit makes one more request (the dictionary) after the entry file, which is
  far smaller than the dictionaries it replaces.
