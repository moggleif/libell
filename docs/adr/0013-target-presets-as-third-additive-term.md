# 0013 — Target presets: a third additive term, on top of the two-layer calibration

**Status:** Accepted, 2026-08-24

## Context

Issue #122: users park in the same spot for more than one reason — sleeping level,
draining the shower, draining the grey-water tank — and each reason can call for a
deliberately **non-level** vehicle. They want to save more than one of these targets and
switch between them in a couple of taps, with custom names for their own vehicle.

Libell already has two calibration layers (ADR 0010, R11, R24): sensor calibration (the
phone/case's own bias) and the vehicle zero (the placement spot's tilt). Both describe
what "level" **means**. A target preset is different in kind: it is an intentional
request for the vehicle to be **non-level**, applied on top of whatever "level" already
means. Conflating it with either calibration layer — storing it in the same field, or
letting a calibration redo silently change it — would make an intentional drain tilt
indistinguishable from a placement error. This is also distinct from the drain-side ramp
tie-break (#93, R27, ADR 0011): that only chooses between placements that already reach
level tolerance, and never deliberately overshoots it; a target preset here does exactly
that, on purpose.

## Decision

A new domain module, `src/domain/targetPresets.ts`, defines `TargetPreset` (`id`, a
user-entered `name`, and an `offset: Calibration` in degrees) plus the same
validate-on-read discipline `settings.ts`/`calibration.ts` already use (±15° cap, name
length cap, corrupt entries dropped independently). The active target is a separate
`activeTargetId: string | null` — `null` is "Normal" (true level) and is never itself a
stored preset, so it can never be edited away or lost.

The leveling math gains a **third** additive term, without touching
`combineCalibrations`'s existing two-argument signature or semantics: the host calls it
twice —

```
effectiveCalibration = combineCalibrations(
  combineCalibrations(sensorCalibration, vehicleZero),   // ADR 0010, unchanged
  targetOffsetFor(presets, activeTargetId),               // the new term
)
```

`targetOffsetFor` returns `null` for "Normal", and `combineCalibrations(x, null) === x`
(already true and tested), so the two-layer sum is byte-for-byte unaffected whenever no
preset is active — the regression guard the issue asks for falls out of the existing
function rather than a new special case.

Storage lives under its own keys (`libell.targetPresets`, `libell.activeTarget`),
separate from `libell.calibration` and `libell.vehicleCalibration` — never the same
field. Creating a preset captures the current tilt **relative to the two-layer sum**
(`presetOffsetFromReading`), the same capture-first pattern as "Set current position as
level" for the vehicle zero, then asks for a name; there is no built-in fixed list of
target types, so "Shower drain" or "Grey-water drainage" are just names a user picks —
the drain geometry a preset encodes is inherently vehicle-specific.

UI: a new "Targets" menu section (`ui/targetsSection.ts`) lists Normal first, then saved
presets, radio-style select plus a delete button, and a name field + "Save current tilt"
button to add one — built from the same `menu__*` classes `calibrationSection.ts` uses,
so it reads as the same family, but it is **not** a third block inside the Calibration
section (a target is not a calibration). It sits with the "OTHER" items (feedback,
about), not a primary Settings/Calibration/Help card — selecting a target is an optional,
deliberate choice, not part of first-run setup, so it carries no pending status. The main
screen gains one small badge (`ui/targetBadge.ts`) that is hidden whenever Normal is
active and otherwise reads "Target: {name}"; tapping it jumps straight to the Targets
section.

## Alternatives considered

- **Storing the preset offset in the vehicle-zero field** — rejected: the issue is
  explicit that a preset must never be conflated with either calibration layer; clearing
  or redoing calibration would then silently drag or destroy an intentional target.
- **A fixed built-in list of target types** (Normal/Shower/Grey-water) — rejected: the
  actual tilt for "drain toward the shower" is specific to each vehicle's plumbing, and
  the issue calls for custom naming anyway; shipping no built-ins and letting every
  preset be user-captured and named keeps the model uniform and avoids a
  half-configurable "example" a user cannot rename cleanly.
- **A fourth `combineCalibrations` parameter** instead of calling it twice — rejected:
  the two-layer function's own tests and semantics (ADR 0010) stay completely untouched
  this way; the third term is visibly a separate composition step at the call site,
  matching "applied on top of the zero point, never confused with it."
- **Manual numeric entry of the target's degrees** — rejected in favor of capturing the
  current tilt, consistent with the vehicle zero's existing capture-first UX and
  avoiding the least intuitive part of the flow (typing a precise, signed angle).

## Consequences

- No preset active leaves every existing calibration code path byte-for-byte unchanged —
  `combineCalibrations` itself was not modified, only called an extra time.
- A saved preset encodes a specific tilt captured once; it does not automatically track
  if the vehicle's actual drain geometry changes later (a different parking orientation,
  a modified tank) — recapturing is the answer, the same explicit-action contract ADR
  0010 already established for the vehicle zero.
- New files: `src/domain/targetPresets.ts`, `src/ui/targetsSection.ts`,
  `src/ui/targetBadge.ts`; `src/data/settingsStore.ts` gains
  `load/saveTargetPresets` and `load/saveActiveTargetId`; `src/ui/menu.ts` gains a
  `'targets'` `MenuSection`.
