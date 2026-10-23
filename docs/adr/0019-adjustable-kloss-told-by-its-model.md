# 0019 — An adjustable kloss is told by its model, and "driven up" by a falling lift

**Status:** Accepted, 2026-10-23

## Context

Issue #687: on an adjustable kloss (Lippert LEVEL9, #686) one movable step is set before
driving up, and changing it means driving off. Libell's plan (ADR 0011) counts from the
tilt as it is now, so its steps are right only while the wheels stand on the ground.
Morgan asked for one line above the vehicle that says to set the kloss first and stays
until level. Two things had to be decided: how the app knows the kloss is adjustable, and
how it knows the vehicle has driven up onto it.

## Decision

A catalog model can be marked `adjustable` in `RAMP_MODELS`, and `isAdjustableRamp`
reads it through `matchRampModel`, the same match that names the kloss in Settings
(R21). No setting is stored: storage, the shared setup link (ADR 0015) and every vehicle
(ADR 0017) are unchanged.

"Driven up" is told in `domain/adjustableGuide.ts` from the largest lift on the wheel
cards. After the vehicle has moved (R25) and stands still again, a fall of at least half
the smallest step below the ground reading within `SETTLE_MS` means it stands on the
klossar. Without that fall, the reading where it stands becomes the new ground reading.
The window is there because the stabilized figures catch up a moment after the vehicle
stops (`stability.ts`).

## Alternatives considered

- **A stored `rampAdjustable` setting**, like `rampStepless` (ADR 0018). It would need a
  migration, a field in the share link and a control in Settings, for a property that
  belongs to the product, not the user's choice.
- **Remembering the plan and showing the next step as a change** ("from step 3 to step
  4"). That needs the app to trust that the user followed the plan. Morgan found it
  strange, and the kloss has to come off to move the step anyway, so measuring again
  from the ground gives the right steps with nothing to remember.
- **Letting the user say which step each wheel stands on.** It is exact but costs an
  input every time.

## Consequences

- A custom set with exactly LEVEL9's steps is treated as LEVEL9, as its name already is.
- Driving to a flatter spot right after a measurement can read as a drive-up, and the
  line then says to drive off. Driving off and measuring again is harmless, and it is the
  same advice.
- Only the motorhome engine shows the line; a caravan gets it if an adjustable kloss is
  ever sold for one.
