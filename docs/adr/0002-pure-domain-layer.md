# 0002 — The domain layer is pure TypeScript

**Status:** Accepted, 2025 (backfilled 2026-08-23)

## Context

The leveling math is the product: wrong output puts a 3.5-tonne vehicle on the wrong
blocks. It must be exhaustively unit-testable, including edge cases that are awkward to
reproduce with a physical phone.

## Decision

Everything under `src/domain/` is pure TypeScript with **no browser APIs** — no
`window`, `document`, `navigator` or `localStorage`. Sensors, storage and DOM live in
`src/sensor/`, `src/data/` and `src/ui/` and pass plain values in.

## Alternatives considered

- **Mocking browser APIs in tests** — rejected: mocks drift from real behavior and make
  the math tests depend on test-infrastructure fidelity instead of arithmetic.
- **No layering (logic in the components)** — rejected: ties every math change to DOM
  churn and makes regression tests for field bugs (hysteresis flapping, celebration
  re-arming) nearly impossible to write.

## Consequences

- The domain tests run in plain Node (`environment: 'node'`), fast and deterministic;
  field regressions are captured as unit tests.
- Some duplication of types across the boundary is accepted (e.g. results passed as
  plain objects).
- The rule is enforced by review, not tooling — a lint rule would strengthen it.
