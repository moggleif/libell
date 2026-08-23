# 0003 — Levelness is a height tolerance in mm, not degrees

**Status:** Accepted, 2025 (backfilled 2026-08-23)

## Context

"Level" needs a threshold. Spirit-level apps use degrees, but the same angle means a
very different wheel-height difference on a short van versus a long motorhome, and
users act in the physical unit of their ramps: millimetres.

## Decision

The vehicle is level when **no wheel sits more than the tolerance (mm, default 20)
below the highest wheel**. All model, settings and display values are millimetres;
degrees appear only in the small tilt readout.

## Alternatives considered

- **Degree threshold** — rejected: not actionable ("0.4°" tells you nothing about which
  block to use) and vehicle-size dependent; a legacy stored `toleranceDeg` is
  deliberately dropped on migration rather than guessed at.
- **Mixed cm/mm units** — rejected after early versions used cm: one unit everywhere
  removed a class of ×10 bugs; legacy cm values migrate on read (×10).

## Consequences

- Wheelbase and track width are inherently accounted for; the tolerance means the same
  thing on every vehicle.
- The user must enter measurements in mm (mitigated by defaults and the cm display
  option).
