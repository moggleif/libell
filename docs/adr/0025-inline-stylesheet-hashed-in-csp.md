# 0025 — The app's stylesheet is inlined and named by its hash in the CSP

**Status:** Accepted, 2026-10-26 (#730).

## Context

After ADR 0024 the only request still holding up the first paint was the app's one
stylesheet, about 8.5 kB gzip. Lighthouse on simulated mobile counted 150 ms of
render-blocking time for it. The CSP (ADR 0005) allowed styles from `'self'` only, so the
stylesheet could not simply be put in the page.

## Decision

- The build puts the stylesheet into `index.html` as one `<style>` block and drops the
  CSS file (the `security-meta-tags` plugin in `vite.config.ts`, with
  `scripts/inlineStylesheets.ts`).
- The CSP's `style-src` names that block by its SHA-256 hash, next to `'self'`. No other
  inline style runs: no `'unsafe-inline'`, and style attributes stay refused as before.
- The development server is untouched; it has no CSP.

## Alternatives considered

- **Keep the linked stylesheet** — rejected: measured on Lighthouse mobile, inlining
  takes the first paint from 1.2 s to 0.7 s and the largest paint from 1.6–1.9 s to 1.5 s.
- **`'unsafe-inline'` in `style-src`** — rejected: it would let any injected style run.
- **Inline only the "critical" part** — rejected: a tool to split it, for a stylesheet
  that is small already.
- **The static pages too** — not needed: their stylesheet is under 1 kB and they already
  score 100.

## Consequences

- `index.html` grows by the stylesheet. It is precached with everything else, so the
  service worker still serves it offline.
- Any change to the CSS changes the hash; the build computes it, so nothing is kept by
  hand.
- A stylesheet Vite would emit for a lazily loaded part would not be inlined (it is not
  linked from the page) and loads by `'self'` as before.
