---
name: clean-code-review
description: Review a Libell change for Clean Code (names, small functions, duplication, dead code, comments) before it is committed or merged. Use on every diff that touches src/ or scripts/, and whenever the steward skill asks for it.
---

# Clean Code review

The goal for Libell's code is _Clean Code_ by Robert C. Martin. The machine guards in
`scripts/quality/` (see "Quality guards" in `docs/01-CONTRIBUTING.md`) catch size and
unused exports; this review covers what needs judgement. It reviews the **diff**, not the
whole repository: report what the change adds or makes worse, and fix it in the same
change when the fix is small.

## How to run it

1. Get the diff against `main`: `git diff origin/main...HEAD -- src scripts`.
2. Read every changed function in full, not only the changed lines, and walk the
   checklist below.
3. Fix what you can in the change. For anything you leave, write one line per finding:
   `file:line`, what is wrong, and why it stays (for example "pre-existing, tracked in
   #NNN"). Don't report what the guards already enforce.

## Checklist

**Names**

- A name says what the thing is or does, in the vocabulary of `docs/02-REQUIREMENTS.md`
  and the terminology already in the code (calibrate vs. zero, Sensorbox, ramp). No
  abbreviations a newcomer would have to decode, no `data`, `info`, `handle`, `tmp`.
- Booleans read as a question (`isLevel`, `hasCalibration`); functions are verbs, values
  are nouns.
- One name per concept across the codebase: don't introduce a synonym for something
  that already has a name.

**Functions**

- Each function does one thing at one level of abstraction. A function that builds DOM
  _and_ decides state _and_ formats text is three functions.
- New functions stay well below the guard's limit; the limit is a ceiling, not a target.
  If a function needs a comment to separate its sections, the sections are functions.
- Few parameters: more than three usually wants an options object or a smaller job.
  No boolean flag parameters that switch between two behaviours; write two functions.
- No hidden side effects: a function named `get…` or `compute…` does not write storage,
  mutate its argument or touch the DOM.

**Duplication**

- Search for an existing helper before writing one (`rg` for the operation, not only
  the name). Shared UI pieces live in `src/ui/` (for example the diagram parts), shared
  pure logic in `src/domain/`.
- Two blocks that differ only in a value or a string are one function with a
  parameter.

**Dead code**

- No commented-out code, no unused parameters kept "for later", no branch nothing can
  reach. Code that only tests reach stays with its tests (decision in #376).

**Comments**

- A comment says _why_, never _what_ the next line does and never the history of how
  it got there (that is git's job, #421). Issue numbers belong in a comment only when
  the code would look wrong without the reason.
- A comment that is no longer true is a bug: fix or delete it in the same change.

**Layers and project rules**

- The non-negotiable rules in `CLAUDE.md` hold: pure `domain/`, strings through `t()`,
  colors from CSS custom properties, no `innerHTML`, millimetres everywhere. A
  violation is always a finding.
- Dependencies point inward: `ui/` and `app/` may use `domain/`, never the reverse.

## Refactors

When the change is a refactor, the rule from #415–#422 applies: regression tests for
every interface the refactor changes are written first and pass on `main`, the same
tests pass unchanged afterwards, and the behaviour is identical. The test-quality skill
checks that part.
