# 0018 — A stepless wedge is a ramp with one height per wheel: the lift itself

**Status:** Accepted, 2026-10-15

## Context

Issue #600: some ramps have no steps. A wedge such as the Andersen Camper Leveler is
driven up as far as needed, anywhere from nothing to its top. The ramp model so far was
a staircase (`rampStepHeightsMm`), and the plan (ADR 0011) chose the closest of those
steps for each wheel. A wedge entered as one step would always be recommended at full
height, and one entered as many small steps would show step numbers that are not
printed on it.

## Decision

A ramp is a staircase or a stepless wedge, said by `LevelSettings.rampStepless`. A
wedge keeps one height in `rampStepHeightsMm`, its maximum, so storage, the shared
setup link (ADR 0015) and every vehicle (ADR 0017) carry it unchanged; anything stored
before this reads as a staircase.

`rampHeightFor(lift, settings)` in `leveling.ts` is the one place that answers "what
height goes under this wheel": the nearest step on a staircase, the lift itself capped
at the maximum on a wedge. The per-wheel lifts, the stabilizer and the plan's search
all call it, so the plan (ADR 0011) is unchanged in kind. For a wedge it weighs one
candidate height per wheel instead of every step, and the preference order still
decides which wheels get the owned ramps. A held plan keeps only which wheels get a
wedge: the stabilizer refits each height to the shown lift every frame
(`fitWedge` in `stability.ts`), because a continuous height has nothing to hold while
a wheel climbs.

The display numbers only real steps (`numberedSteps` in `ramps.ts` is empty for a
wedge). A card with no step to name reads "Drive up" and how far. A red card shows the
wedge's full height, which is how far to drive, rather than the shortfall.

## Alternatives considered

- **Many 1 mm steps.** This needs no new setting, but the cards would number steps that
  do not exist and the search would grow with every millimetre.
- **A separate wedge plan.** It would duplicate ADR 0011's preference order for no
  difference in outcome.

## Consequences

- A catalog model can be marked `stepless` (`RAMP_MODELS`). Its one height is the
  manufacturer's stated maximum, rounded down to whole millimetres.
- Matching a model by its steps also matches by kind, so a 101 mm wedge is never shown
  as a one-step staircase of the same height, nor the other way round.
