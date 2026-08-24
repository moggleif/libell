# 0009 — A boggie is one leveling axle at its midpoint, with paired wheels

**Status:** Accepted, 2026-08-24

## Context

Issue #81: tag-axle motorhomes and tandem-axle caravans are common in the target
group. In practice both low-side wheels of a boggie go up on **equal** steps —
ramping only one unloads the other and stresses the bogie suspension — and the
computed height difference within a pair (spacing 60–100 mm apart × tan of a small
tilt) is a few mm, absorbed by the suspension.

## Decision

Model a boggie as **one leveling axle at its midpoint**: the math, the stabilizers
and the per-side recommendation are untouched. The change is a setting
(`rearAxle: 'single' | 'boggie'`, an independent dimension from the vehicle type)
plus presentation: the diagrams draw a wheel **pair** per side sharing one severity,
one glyph and one label set, and the measurement hint says to measure wheelbase /
axle-to-jockey to the boggie's centre. No new length fields — the pair's internal
spacing matters only for drawing and is fixed in the SVG.

## Alternatives considered

- **Per-wheel modeling (six wheels / three axles)** — rejected: it would produce
  different step recommendations within a pair, which is precisely the wrong advice
  for a bogie, and it forces new measurements (axle spacing) on the user for zero
  actionable gain.
- **More vehicle types** (motorhome-tag, caravan-tandem, …) — rejected: axle
  configuration is orthogonal to vehicle kind; two settings compose, four enum
  values would drift apart.
- **A boggie spacing setting for the drawing** — rejected: a number to type that
  changes nothing the user acts on.

## Consequences

- Zero domain-math changes; `parseSettings` defaults old stored settings to single.
- The diagrams' wheel-marker code is shared (`wheelMarkers`): one rect, or two
  shorter rects in the same footprint so glyphs and labels keep their positions.
- Twin wheels (dual mounting on one hub) remain out of scope — same position in the
  vehicle plane, nothing to configure.
