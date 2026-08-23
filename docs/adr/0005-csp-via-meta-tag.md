# 0005 — CSP is delivered via a meta tag

**Status:** Accepted, 2025 (backfilled 2026-08-23)

## Context

GitHub Pages serves static files and cannot set HTTP response headers, so a
`Content-Security-Policy` header — the normal delivery — is unavailable. The app is
fully self-contained (no CDNs, no analytics, no remote calls).

## Decision

A production-build Vite plugin injects `<meta http-equiv="Content-Security-Policy">`
(everything `'self'`, `object-src 'none'`, `base-uri 'none'`) plus a `no-referrer`
referrer policy into `index.html`. The dev server is exempt (it inlines scripts and
would break).

## Alternatives considered

- **No CSP at all** — rejected: the meta tag still blocks injected external
  script/style, a real hardening layer on top of the no-`innerHTML` rule.
- **Move to a host with headers** (Netlify/Cloudflare) — rejected for now: Pages is
  free, integrated with the deploy workflow, and doubles as the QA server (ADR 0007).

## Consequences

- Injected external resources are refused by the browser at ~zero cost.
- **Known limit:** browsers ignore `frame-ancestors` (and would ignore
  `report-uri`/sandbox) in meta-delivered CSP, so clickjacking protection needs a
  separate guard — tracked in issue #67.
- Any future external resource (fonts, tiles) requires touching the policy in
  `vite.config.ts` consciously.
