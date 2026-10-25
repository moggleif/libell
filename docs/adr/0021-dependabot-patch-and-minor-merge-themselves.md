# 0021 — Dependabot's patch and minor updates merge themselves on green CI

**Status:** Accepted, 2026-10-25.

## Context

Dependabot opened one PR per package each week, and a Claude thread collected them into
one PR and merged it by hand (#592, #693). Every npm dependency is build-time only
(`SECURITY.md`), and the required check "Check, Test & Build" already runs the unit
tests, the guards and the Playwright checks against the built app. Morgan chose to
automate it (#694).

## Decision

`.github/dependabot.yml` groups all patch and minor updates into one PR a week for npm
and one for GitHub Actions. A major version keeps a PR of its own.

`.github/workflows/dependabot-auto-merge.yml` turns on GitHub's auto-merge, with a merge
commit, for a Dependabot PR whose updates are all patch or minor, read with
`dependabot/fetch-metadata`. GitHub then merges it when the required check is green. The
workflow runs on `pull_request`, never checks out the PR's code, and runs only when
Dependabot both opened the PR and caused the event, so a person's push to its branch
leaves the PR for a person.

A major version, or a group the metadata cannot classify, waits for Morgan's merge.

## Alternatives considered

- **Grouping only.** Fewer PRs, but someone still has to merge each one.
- **Auto-merge on `pull_request_target`.** It gets a write token for any PR, which is
  riskier than `pull_request`, where GitHub gives Dependabot's PRs a token with only the
  permissions the job asks for.
- **A personal access token for the merge.** It would make the merge start the deploy,
  but it adds a long-lived secret to look after.

## Consequences

- The repository must have "Allow auto-merge" turned on, and `main` must require
  "Check, Test & Build"; without a required check, auto-merge would merge at once.
- GitHub does not start workflows from a merge made with the workflow's own token, so a
  Dependabot merge does not deploy by itself. It reaches libell.app with the next merge
  of a person's PR, as part of that QA build (ADR 0007). Nothing a user sees changes
  with these updates, so nothing is lost by waiting.
- An auto-merge lands on `main` outside the one-at-a-time queue. A thread whose PR is
  next in the queue brings in `main` as usual before it merges.
