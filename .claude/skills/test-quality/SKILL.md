---
name: test-quality
description: Check the tests of a Libell change - written first from the acceptance criteria, pinning behaviour rather than implementation, never weakened, and with regression tests in place before any refactor. Use on every change before it is committed or merged, and whenever the steward skill asks for it.
---

# Test quality

Libell is built test first (step 2 of the definition of done in `CLAUDE.md`). The
coverage floor (see "Quality guards" in `docs/01-CONTRIBUTING.md`) proves that code
runs under some test; this skill checks that the tests actually pin the behaviour the
issue asked for.

## How to run it

1. Read the issue's Given/When/Then acceptance criteria and the requirement it updates
   in `docs/02-REQUIREMENTS.md`.
2. Get the diff against `main`: `git diff origin/main...HEAD`, and list the test files
   it adds or changes.
3. Walk the checklist below. Fix gaps in the same change; report anything left as one
   line per finding with `file:line` and the reason.

## Checklist

**Written first, from the criteria**

- Every Given/When/Then in the issue has at least one test that would fail without the
  change. Name the test after the behaviour (`'shows the ramp plan when …'`), not after
  the function.
- For a bug fix, the first commit (or at least the test) reproduces the bug: run the
  new test against `main` and see it fail before trusting it.

**Pins behaviour, not implementation**

- Tests go through the module's public interface (its exports, the component's options
  and the DOM it builds), not through private helpers or call counts on internals.
- Assertions are exact where the behaviour is exact: a value, a text key, a state,
  rather than "truthy" or "called".
- Domain math is checked against hand-derived values with symmetric, simple geometry,
  like the existing tests in `src/domain/`.
- UI tests check what the user would see (text through the `t()` key, classes the CSS
  hooks onto, aria attributes) and that strings come from `t()` in every language.

**Never weakened**

- No existing test is deleted, skipped (`.skip`, `.todo`, `it.only` left behind) or
  loosened (an exact value turned into a range, an assertion removed, a timeout raised
  to hide slowness) to get green. Field-regression tests encode real bugs. If a test
  truly describes behaviour the issue changes, the change says so and the requirement
  changes with it.
- No coverage floor, size baseline or limit in `scripts/quality/` or `vite.config.ts`
  is lowered or raised to get green.

**Refactors**

- Before a refactor touches an exported function, type, component options or module
  boundary, tests pinning today's behaviour exist and pass on `main` (Morgan's rule from
  #415–#422). The refactor then passes the **same** tests unchanged; a refactor PR that
  edits an existing assertion is not a pure refactor.

**Reliable**

- No real timers, network or random values without control: use fake timers and the
  simulators (`?easylevel-sim`, `?xparkle-sim` and their modules in `src/sensor/`).
- Tests are independent: no order dependence, no state leaking through `localStorage`
  or module globals between tests.

**Beyond unit tests**

- A change that affects layout or height is checked by `npm run fit`; a change to the
  wiring in `src/main.ts` or `src/app/` by `npm run flows`. Run the one that applies
  before asking to merge, since unit tests in happy-dom measure every height as zero.
