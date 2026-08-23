# 0001 — No UI framework: plain DOM and inline SVG

**Status:** Accepted, 2025 (backfilled 2026-08-23)

## Context

Libell is one screen plus a menu: a diagram, some numbers, a settings form. It must
load fast on a phone at a campsite, work fully offline, and stay maintainable by
occasional contributors (often AI agents) without framework churn.

## Decision

No UI framework. Components are functions that build DOM with `createElement` /
`createElementNS` and return elements; the diagram is hand-written inline SVG; state
flows one way from `main.ts` via `update()` methods driven by `requestAnimationFrame`.

## Alternatives considered

- **React/Preact/Svelte** — rejected: adds a build-time dependency treadmill and
  kilobytes for what is essentially one live-updating SVG; no list rendering or complex
  state to justify it.
- **Web components** — rejected: no reuse across projects planned; adds ceremony
  without removing any code.

## Consequences

- Tiny bundle (precache ~80 KiB), no framework upgrades, trivially auditable output.
- DOM wiring is manual: components expose explicit `update()` contracts, and UI tests
  need a DOM environment rather than framework test utils.
- Building all DOM through `createElement`/`textContent` doubles as the XSS guard —
  there is no `innerHTML` anywhere (see SECURITY.md).
