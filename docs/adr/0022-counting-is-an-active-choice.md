# 0022 — Anonymous counting is an active choice, made before anything else

**Status:** Accepted, 2026-10-25. Supersedes the "on by default" part of ADR 0021.

## Context

ADR 0021 (#674) made anonymous counting on from the start, with a guide step that
explained it and a switch to turn it off. While writing the privacy policy (#675), Morgan
decided (2026-10-25, #699) that counting must be an active choice the user makes before
they can do anything else in the app, and that nothing is counted before it. Libell's UX
rule is never to block the user; this is the one gate Morgan asked for, so it is kept to
a single clear screen.

## Decision

- **The choice comes first.** With no choice stored, the first thing the app shows is one
  screen that explains the counting and asks, with two equal buttons, "Count" and "Don't
  count". The intro, an incoming setup link and everything else wait behind it.
- **Nothing before the choice.** The app start is counted only after the answer, and only
  after "Count".
- **Stored as made.** `libell.counting` holds `on` or `off`, apart from the settings so a
  settings reset keeps it; "Delete all Libell data" removes it, and the user is asked
  again. Missing or unreadable storage means not chosen, which never counts.
- **Existing users.** Those counted by default under ADR 0021 had not chosen, so they are
  asked at their next start. #674's off flag (`libell.countingOff`) is migrated to `off`.
- **A browser privacy signal is an answer.** With Global Privacy Control or Do Not Track
  the screen is skipped and nothing is counted. `?demo` skips it too, as it never counts.
- **The guide step goes.** The guide no longer has a counting step; the Privacy tab's
  switch changes the choice later.

## Alternatives considered

- **Keep the step in the guide** — rejected: "Look around first" skips the guide, so the
  choice would not be made by everyone.
- **Ask only new users** — rejected: users counted by default never chose.
- **Store the GPC/DNT answer as "Don't count"** — rejected: the signal already stops
  every request, and storing it would hide the choice from someone who later turns the
  signal off.

## Consequences

- Every new user, and every existing user without a stored choice, meets the choice
  screen once before the intro. It must fit a small phone whole in every language.
- The flows and fit tests store a choice before opening the app, and test the screen
  itself on its own.
- Counted numbers drop to those who chose "Count"; the public statistics show only them.
