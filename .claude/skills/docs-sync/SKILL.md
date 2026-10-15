---
name: docs-sync
description: Check that a Libell change keeps the documentation true, in the same change: requirements, in-app help in every language, architecture, ADRs and CLAUDE.md. Use on every change before it is committed or merged, and whenever the steward skill asks for it.
---

# Docs in sync

Libell's rule is one owner per truth: the canonical-sources table at the top of
`CLAUDE.md` says which document owns which fact. A change that alters a fact updates its
owner **in the same change**, links to it from everywhere else, and never writes the fact
a second time. The doc paths guard (see "Quality guards" in `docs/01-CONTRIBUTING.md`)
catches file names that no longer exist; this skill covers what needs judgement.

## How to run it

1. Get the diff against `main`: `git diff origin/main...HEAD`.
2. Sort each changed thing into the questions below and answer each one with yes, no
   or not affected.
3. Fix every gap in the same change. Report what you changed in one line per document,
   and anything you could not decide as a question for the user.

## The questions

**Behaviour → `docs/02-REQUIREMENTS.md`**

- Does the change alter what a user sees or can do? Then the matching requirement (R…)
  is updated, or a new one added, as desired-state Given/When/Then, and the issue is
  referenced. A bug fix that restores the written behaviour needs no change; a fix that
  makes the behaviour different from what is written does.
- The requirement describes the finished behaviour, not the change ("shows X", never
  "now shows X").

**In-app help and strings → `src/ui/messages/`**

- Does the change alter something the help pages explain (the `help.*` keys) or the
  introduction describes? Then the text is updated in **every** language in `LANGUAGES`
  (`src/ui/i18n.ts`), not only Swedish and English. The parity test only proves the keys
  exist; it cannot tell that a translation still says the old thing.
- New or changed strings follow the terminology the app already uses (in Swedish:
  _Kalibrera_ only for the phone's own sensor, _Nollställ_ for the vehicle's zero,
  _kloss_ never "ramp", _Sensorbox_).

**How it is built → `docs/03-ARCHITECTURE.md`**

- Does the change add, remove, rename or move a module, a layer seam, a sensor path, a
  storage key, a CI job or a build step? Then the architecture text that describes it is
  updated.
- Does it change the math (leveling, smoothing, calibration)? Then the formulas in the
  architecture document still match the code.

**Why → `docs/adr/`**

- Is this a decision that is hard to reverse or that a future contributor would
  otherwise re-litigate (a new runtime dependency, a new storage format, a new external
  surface, a layer rule)? Then it gets a new ADR in the same change, following
  `docs/adr/README.md`, and the index there lists it. An old ADR is never edited; a
  reversal is a new ADR that supersedes it.

**Setup, workflow and rules → `docs/01-CONTRIBUTING.md`, `CLAUDE.md`, `SECURITY.md`**

- A new script, flag, check or workflow step is described in the contributing guide.
- A new durable rule for everyone working in the repo goes in `CLAUDE.md`, as a rule and
  not a fact owned elsewhere. When `CLAUDE.md` and the code disagree, the code is right:
  fix the guide in the same change.
- A change to what the app sends, stores or loads is checked against `SECURITY.md`.

**Default values and colors**

- Default settings are stated only in `DEFAULT_SETTINGS` (`src/domain/settings.ts`),
  colors only in `src/ui/styles.css`. A document that needs one links there instead of
  copying the number.

## Out of scope

Release texts in `docs/releases/` are written when a minor is released (ADR 0007), not
per change. Dated research notes and ADRs keep the facts of their day.
