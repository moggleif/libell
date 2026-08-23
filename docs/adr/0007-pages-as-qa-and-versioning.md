# 0007 — GitHub Pages doubles as QA; candidate builds are X.Y.CR&lt;PR&gt;

**Status:** Accepted, 2025 (backfilled 2026-08-23)

## Context

There is one hosted environment (GitHub Pages) and a need to tell, from a phone's
footer, whether the deployed build is a blessed release or a work-in-progress merge.
Running a second QA environment would double the hosting/deploy machinery for a
single-developer project.

## Decision

The `VERSION` file holds major.minor. The **first** deploy of a new major.minor is the
release: version `X.Y.0`, git-tagged, published as a GitHub Release (notes from
`docs/releases/vX.Y.0.md` when present). Every **later** merge on the same minor
deploys as a QA/candidate build versioned `X.Y.CR<PR>` (the merged PR number). The
footer shows the version; local dev shows `X.Y.Z – local <timestamp>`; a CI build
without `BUILD_VERSION` shows nothing rather than something wrong.

## Alternatives considered

- **Separate QA environment** (branch previews / second Pages site) — rejected: more
  moving parts than the project needs; CI's `libell-site-<sha>` artifact covers
  pre-merge preview.
- **Plain semver patch per deploy** — rejected: `1.2.7` doesn't tell a tester whether
  they are looking at the release or a candidate; `1.2.CR68` does, at a glance.

## Consequences

- One environment, one workflow; the footer is the QA contract.
- `main` is therefore always deployed — merges must keep the app usable.
- The unusual `CR` scheme needs explaining exactly once (here and in CLAUDE.md).
