# 0004 — The repository is text-only; binary assets are generated

**Status:** Accepted, 2025 (backfilled 2026-08-23)

## Context

The PWA needs PNG icons in several sizes and a manifest screenshot. Committed binaries
bloat history, cannot be reviewed in diffs, and drift from their source artwork.

## Decision

The repository contains no binary files. `public/icons/icon.svg` is the single icon
source; `scripts/generate-icons.mjs` renders the PNGs during `npm run build` (sharp),
and `scripts/generate-screenshots.mjs` renders the manifest screenshot from the built
app in `?demo` mode (Playwright). All generated output is gitignored.

## Alternatives considered

- **Commit the PNGs** — rejected: unreviewable diffs, repeated re-export toil, and the
  screenshot would go stale with every UI change.
- **Git LFS** — rejected: infrastructure for a problem generation removes entirely.

## Consequences

- Every asset is reproducible and always matches the current UI.
- `npm run build` needs sharp, and the deploy workflow needs a Chromium — accepted
  build-time dependencies (dev-only; nothing ships to the client).
- The `?demo` flag exists partly for this: a fixed synthetic tilt so screenshots are
  deterministic and the app is demoable without sensors.
