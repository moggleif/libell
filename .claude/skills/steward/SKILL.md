---
name: steward
description: How a Claude thread drives a Libell pull request to merge - bring in main, run the checks and the review skills (clean-code-review, docs-sync, test-quality), fix or report what they find, then ask for the merge. Use whenever you open, update or are about to ask to merge a PR in this repository.
---

# Steward: driving a Libell PR to merge

Every merge to `main` deploys (ADR 0007), so a PR is only ready when it is green, up to
date with `main`, and has passed the three review skills. This skill is the order to do
that in. It adds no rules of its own beyond `CLAUDE.md` and `docs/01-CONTRIBUTING.md`;
where they say more, they win.

## Before asking to merge

Do these in order, every time, also after a rebase or a fix pushed for review:

1. **Bring in `main`.** Fetch it and rebase or merge it into the PR branch. Resolve
   conflicts by keeping both sides' behaviour; ask only when that is impossible.
2. **Run the fast checks** locally:
   `npm run format:check && npm run typecheck && npm run test`. For a change to layout,
   wiring or a sensor flow, also `npm run build` and then `npm run fit` or
   `npm run flows`, whichever applies.
3. **Run the review skills** on the diff against `main`, in this order:
   - `clean-code-review`
   - `test-quality`
   - `docs-sync`
4. **Fix what they find** in the PR when the fix is in scope. For a finding you leave,
   say why in one line (pre-existing and tracked in an issue, or out of this PR's
   scope). Never weaken a test, a guard baseline, a coverage floor or a limit to get
   green.
5. **Push and wait for CI** on the new head. Red CI is yours to fix before anything
   else; "flaky" is not a cause until a re-run on the same commit proves it.
6. **Ask for the merge** with one short message: what the PR changes for the user, that
   CI is green, and what the skills found and you fixed or left. Then wait for the
   maintainer's explicit go-ahead. A PR is merged with a merge commit, never squashed
   over someone else's history.

## While a PR is open

- One PR per issue step, small enough to read in one sitting. New work found along the
  way becomes a new issue, not a bigger PR.
- When several PRs are queued, they go in one at a time: only the PR at the head of the
  queue brings in `main` and merges, so the others don't keep rebasing on each other.
- Review comments are answered on their thread: small asks are fixed and pushed, larger
  ones get a proposal and wait for the author.

## After the merge

- Close the issue the PR finishes, or tick its step if the issue has several.
- Hardware can only be tested on the deployed build, so say what to check on the real
  phone or box, if anything, in the merge reply.
