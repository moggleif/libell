# CLAUDE.md – Libell (PWA)

Libell is an installable web app (PWA) that helps level a motorhome / RV. The user lays
the phone flat inside the vehicle (top edge toward the front) and the app shows which
wheels need to be raised and by how much, plus a live bubble level.

This is the standing guide for anyone — human or AI agent — working in this repository.
It contains only durable rules: nothing session-specific, and no facts that live in
code or in another document. When this guide and the code disagree, the code is right
and this guide has a bug — fix the guide in the same change. Clarity over cleverness.

## Canonical sources — who owns which truth

| Truth                                       | Owner                                          |
| ------------------------------------------- | ---------------------------------------------- |
| What the app does (behaviors, G/W/T)        | `docs/02-REQUIREMENTS.md`                      |
| How it is built (layers, math, sensors, CI) | `docs/03-ARCHITECTURE.md`                      |
| Why it is built that way (decisions)        | `docs/adr/`                                    |
| How to set up, build, test, contribute      | `docs/01-CONTRIBUTING.md`                      |
| Security model and reporting                | `SECURITY.md`                                  |
| Default setting values                      | `DEFAULT_SETTINGS` in `src/domain/settings.ts` |
| User-facing strings                         | `src/ui/i18n.ts` (sv + en)                     |
| Colors                                      | CSS custom properties in `src/ui/styles.css`   |

Never restate another document's facts — link to them. A fact written twice is a bug
waiting to drift.

## Directory layout

```
src/
├── main.ts        # entry point: wires sensor → state → render
├── domain/        # PURE TypeScript, no browser APIs — fully unit-testable
├── data/          # settingsStore.ts (localStorage: settings + calibration)
├── sensor/        # orientation.ts (DeviceMotion / DeviceOrientation)
└── ui/            # DOM + SVG components, hamburger menu, i18n, styles
```

## Non-negotiable code rules

- `domain/` must stay pure: **no `window`, `document`, `navigator` or `localStorage`**
  (ADR 0002). All sensor, storage and DOM concerns live outside it.
- All user-facing strings go through `t()` with **both Swedish and English** entries.
  Never hardcode UI text in components; the parity unit test must stay green.
- Colors come from the CSS custom properties in `src/ui/styles.css` — no hex values in
  components. Both light and dark palettes must work.
- No UI framework, no `innerHTML` — DOM is built with `createElement`/`textContent`
  (ADR 0001; this is also the XSS guard, see `SECURITY.md`).
- **All lengths are millimetres** — model, math, settings and storage alike (ADR 0003);
  only the display layer formats cm.
- The app must work fully **offline** and inside a static-host CSP (ADR 0005): no CDNs,
  no remote requests, no new external resources.
- The repository stays **text-only** (ADR 0004): new artwork is SVG plus a generator
  change, never a committed binary.

## Definition of done — walk this list for every increment

1. **Anchor it.** The change traces to a GitHub issue with Given/When/Then acceptance
   criteria; behavior changes update `docs/02-REQUIREMENTS.md` **in the same change**,
   and an architecturally significant decision gets a new ADR (see `docs/adr/README.md`).
2. **Test first.** Where the logic is testable (domain, parsing, stores), write the
   failing test from the acceptance criteria, then implement until green. Never weaken
   or delete an existing test to get green — field-regression tests encode real bugs.
3. **Verify visually.** For UI changes, run the app with `?demo` (fixed synthetic tilt,
   works without sensors — also used by the screenshot generator) and check both
   languages and both themes when they are affected.
4. **All checks green before committing:**
   `npm run format:check && npm run typecheck && npm run test`
   (the shared hooks run these — enable once with `git config core.hookspath .githooks`).
5. **Commit small.** One issue per increment, the issue referenced in the message,
   descriptive subject; new commits rather than amending pushed work.
6. **Branch, don't push to `main`.** Work on a feature branch; every merge to `main`
   deploys (ADR 0007), so `main` must always be releasable. Do not open a pull request
   unless asked.

## Conventions worth knowing (so you don't rediscover them)

- **`?demo` query flag**: replaces the sensor with a fixed tilt — the way to run,
  screenshot or test the app on any sensorless machine.
- **Versioning**: `VERSION` holds major.minor; first deploy of a minor is the release
  (`vX.Y.0`), later merges deploy as QA candidates (`vX.Y.CR<PR>`). Details in ADR 0007.
- **Secure context**: sensors need HTTPS or `localhost`; iOS additionally needs a user
  gesture. Real-phone testing options are in `docs/01-CONTRIBUTING.md`.
- **Sensor preference**: `DeviceMotionEvent.accelerationIncludingGravity` first,
  `DeviceOrientationEvent` fallback, smoothed — specified in `docs/03-ARCHITECTURE.md`.
