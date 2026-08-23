# 0006 — Feedback via pre-filled GitHub issue URL, no backend

**Status:** Accepted, 2025 (backfilled 2026-08-23)

## Context

Users should be able to report bugs from inside the app. The obvious designs need a
server or a secret: an API endpoint, or a GitHub token that files issues — and this
project is a static site with no backend and no place to keep a secret.

## Decision

The in-app feedback form builds a `github.com/.../issues/new` URL pre-filled (via query
parameters) with category, title, description and app metadata, and opens it in a new
tab with `noopener`. The visitor posts the issue under their own GitHub account.

## Alternatives considered

- **Backend/serverless relay holding a token** — rejected: infrastructure, abuse
  surface and a secret to rotate, for a hobby-scale flow. (Modeled on sbsommar's
  feedback feature, which has an API; this is the static-site adaptation.)
- **`mailto:`** — rejected: loses structure, breaks on phones without a mail app, and
  reports end up unsearchable.

## Consequences

- Zero secrets in the client; reports arrive as normal, triageable GitHub issues.
- Requires the reporter to have (or create) a GitHub account — an accepted filter.
- Metadata (app version, screen, user agent) is visible to the user before posting —
  transparency by construction.
