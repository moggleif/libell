# 0008 — Caravan mode: the axle is the reference, the jockey is bidirectional

**Status:** Accepted, 2026-08-23

## Context

Issue #72: caravan owners — the nearest adjacent user group — level differently from a
motorhome. A caravan has one axle plus a jockey wheel on the drawbar. Ramps still fix
side/side, but front/back is fixed by cranking the jockey wheel, which unlike ramps
moves in **both** directions.

## Decision

Caravan leveling gets its own domain module (`src/domain/caravan.ts`) instead of being
forced through the four-wheel math: the axle is the reference plane, roll drives a ramp
recommendation for the low axle wheel, and pitch drives a **signed** jockey correction
(positive = crank up). Settings are reused rather than extended: `trackWidthRearMm` is
the axle track, `wheelbaseMm` the axle-to-jockey distance (relabeled in the form), and
`vehicleType: 'motorhome' | 'caravan'` selects the pipeline. The display hysteresis
core (`stabilizeLift`) is shared; the jockey's magnitude and direction get the same
dead-band + dwell treatment. The UI mirrors the motorhome conventions in a separate
`caravanDiagram` sharing the `.rv-diagram` styles.

## Alternatives considered

- **Model the caravan as a degenerate four-wheel vehicle** (jockey duplicated as both
  front wheels) — rejected: lifts are non-negative by construction, so "crank the
  jockey down" is inexpressible; the app would tell the user to ramp both axle wheels
  instead of one crank of the handle.
- **New settings fields (axle track, jockey distance)** — rejected: two more numbers to
  migrate and explain, when the existing fields carry the same physical meaning under a
  per-vehicle label.
- **One generic N-wheel engine** — rejected: the jockey is not a wheel with a lift, it
  is a signed actuator; generalizing the four-wheel record typing to cover it costs
  more clarity than two small pipelines.

## Consequences

- `main.ts` grows a per-vehicle engine seam (compute → stabilize → render behind one
  tick function); switching vehicle type rebuilds the level screen.
- The jockey is never "red": any correction is crankable, so severity maps to
  ok/adjust only.
- Horse and cargo trailers get support for free — they level the same way.
