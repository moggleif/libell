# 0010 — Two-layer calibration: sensor offset + vehicle zero, stored decomposed

**Status:** Accepted, 2026-08-24

## Context

Issue #83 (owner feedback): the original calibration zeroes the phone/case on a
known-level surface — but not the spot in the vehicle where the phone actually lies.
A table tilting 0.4° in a perfectly level motorhome makes the app consistently report
the vehicle as tilted.

## Decision

Two separately stored calibrations, summed into the single offset the leveling math
subtracts (the domain signatures are unchanged):

1. **Sensor calibration** (existing, incl. the 180° flip): the phone's own bias.
2. **Vehicle zero**: with the vehicle verifiably level and the phone in its normal
   place, "Set current position as level" captures the placement's tilt.

The vehicle zero is stored **sensor-corrected** — the raw capture minus the sensor
calibration at capture time — so it is pure placement tilt by construction and stays
valid when the sensor calibration is later redone or cleared. The calibration lamp
clears when at least one layer exists.

## Alternatives considered

- **One combined calibration** ("just capture when level") — rejected: it conflates
  phone bias with placement tilt, so moving the phone to another spot (the floor, a
  different vehicle) drags the old table's tilt along, and redoing either half means
  redoing both.
- **Storing the vehicle zero raw** (not sensor-corrected) — rejected: a later sensor
  recalibration would silently corrupt it; decomposed terms stay independently
  replaceable.
- **Auto-capturing the zero when the app shows level** — rejected: circular (the app's
  own judgment would define its reference) and surprising; an explicit user action
  with a verifiability instruction is the honest contract.

## Consequences

- `combineCalibrations` / `vehicleZeroFromReading` live in `src/domain/calibration.ts`
  with the flip math; storage under `libell.vehicleCalibration` with the same
  validate-on-read discipline (±15° cap).
- The Calibration section (menu and onboarding step alike) presents both layers with
  their own status and clear buttons.
- Accuracy now depends on the phone returning to the same spot — that is inherent in
  the feature and stated in the intro text.
