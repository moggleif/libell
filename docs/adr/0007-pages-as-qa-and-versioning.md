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

## Note (2026-08-24) — the candidate keeps its release number

The candidate format above put `CR<PR>` where the patch belongs, so the footer read
`1.0.CR93` — not placeable as a version, and silent about which release it was built
on. Candidates now keep the full release version and add the marker after it:
`1.0.0 – CR93` in the footer, tagged `v1.0.0-CR93` (a tag takes no spaces, so
`compute-version` builds the two separately). Release builds and the release/candidate
rule are unchanged, and old `vX.Y.CR<PR>` tags still match the check below.

## Note (2026-08-24)

The tag namespace is the version source of truth: `compute-version` decides
release-vs-candidate by listing `v<major.minor>.*` tags. A stale tag from before
this scheme existed (an old `v1.0.0` pointing at early history) made the first
1.0 deploy come out as a candidate instead of the release. Before bumping
`VERSION` to a new major.minor, check for — and remove — any pre-scheme tags in
that namespace.

## Note (2026-08-31) — the version is under the logo, not in a footer

The version was shown in a footer row at the bottom of the level screen. That row
cost a full line of a screen the app was simultaneously being trimmed to fit
(R45), for text nobody reads while leveling, so it was removed and the version
moved under the wordmark in the top bar. Nothing about this decision changes:
release-vs-candidate, the `X.Y.0 – CR<PR>` form and the tag scheme are as above —
only where the string is displayed. "The footer is the QA contract" now reads
"the version line under the logo is the QA contract".

## Note (2026-10-15) — patch releases

The scheme had no way to publish a patch version: `VERSION` held only major.minor, so
every deploy after `X.Y.0` was a candidate. `VERSION` may now also hold
major.minor.patch (#611). The rule is the same with the full version in place of
`X.Y.0`: the first deploy of `1.3.1` is the release `1.3.1`, tagged `v1.3.1` and
published with `docs/releases/v1.3.1.md`; later merges show `1.3.1 – CR<PR>`, tagged
`v1.3.1-CR<PR>`. A two-part `VERSION` still means `X.Y.0`. The check now looks for the
release tag `vX.Y.Z` or a candidate tag `vX.Y.Z-*`, so the old `vX.Y.CR<PR>` tags of
past minors no longer count — they belong to versions that are released already. The
rules moved from shell in `deploy.yml` to `scripts/version.ts`, where they are
unit-tested and shared with the local dev build.
