# 0011 — Ramp advice is a plan for the ramps the user owns

**Status:** Accepted, 2026-08-24

## Context

Issue #93: ramps are sold in pairs and most owners carry exactly two, yet a combined
roll + pitch tilt leaves three wheels below the highest corner — the per-wheel
"closest step" advice (R3) then asks for three ramps, which is physically impossible.
The app must choose _which_ wheels get the ramps. And when a residual tilt within the
tolerance necessarily remains, owners care where it points: a grey-water tank drains
only if its outlet side stays low.

## Decision

Keep the per-wheel required lifts (R3) untouched and add a **planning layer**
(`src/domain/rampPlan.ts`): an exhaustive search over every assignment of the
configured step heights to wheels, bounded by the new `rampCount` setting (default 2;
a boggie pair costs two ramps, ADR 0009). A candidate plan is scored by the wheel
heights it produces (`step − lift`, re-referenced to the new highest wheel), and the
best plan wins by this preference order:

1. bring every wheel within the tolerance at all;
2. use as few ramps as possible;
3. leave the configured waste-water drain side lowest (`drainPosition`, default none);
4. be as level as possible (smallest max deficit);
5. climb as little as possible (smallest total step height).

Steps that would hoist a wheel more than tolerance + dead band above today's highest
wheel are pruned — the reference wheel keeps every useful plan near the current
plane — so the search stays a few hundred evaluations. Wheel colors follow the plan:
orange = drive up the planned step, red = not even the highest step could fix that
wheel by itself (move the vehicle), toned-down gray = low but left without a ramp
(the set does not stretch to it, so the wheel asks for no action and must not
shout). A wheel a step could fix is never red — the global optimum may hold its
step down to protect an unserved wheel, and that is advice, not an alarm. The
display stabilizer adopts a differing fresh plan only when it is
_clearly_ better under the current lifts (more level by the dead band, level with
fewer ramps, or better for the drain), sustained for the dwell — the same
thermostat-plus-dwell contract the per-wheel display already had.

## Alternatives considered

- **Keep unlimited per-wheel advice** — rejected: recommending three ramps to an
  owner of two is advice that cannot be followed; the user asked for the choice to
  be made for them.
- **Closed-form choice (ramp the low side / low end)** — rejected: discrete step
  heights, unequal track widths and the boggie's double cost make the case analysis
  error-prone; the search space (≤ (steps+1)⁴) is small enough to enumerate exactly.
- **Rigid-body / suspension simulation of the post-ramp pose** — rejected: the app
  already works iteratively (drive up, re-measure); max-deficit against the new
  highest wheel is the same levelness measure R3 and ADR 0003 use.
- **Drain preference above levelness or ramp count** — rejected: drainage is a
  tie-break inside the tolerance, never a reason to advise a worse or more laborious
  setup.

## Consequences

- Two new settings (`rampCount`, `drainPosition`), hidden in caravan mode — a caravan
  ramps one axle wheel and cranks the jockey (ADR 0008), so there is nothing to plan.
- A wheel can be red **with** a planned step (a 200 mm lift still gets the 112
  step — driving up is worth it, the set just cannot finish the job), but only when
  no step could fix it alone. A low wheel _without_ a planned step is a fourth
  display state (`unserved`, gray –) so it reads as information, not as an alarm
  the user is expected to act on.
- The planner runs per frame (three times, for the dead-band-shifted readings); the
  prune keeps that cheap, but a pathologically long step list is bounded by it too.
- Changing plan-relevant settings rebuilds the level screen so the new plan applies
  immediately instead of waiting out the stabilizer's adoption rules.
