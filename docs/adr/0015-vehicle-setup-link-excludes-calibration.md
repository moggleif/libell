# 0015 — A shared "vehicle setup" link carries geometry only, never calibration

**Status:** Accepted, 2026-08-26

## Context

Issue #207: a user wants to share their vehicle's setup with family members who level
the same RV/motorhome, so they don't have to re-measure and retype the wheelbase,
track widths, ramp steps and drain preference by hand. `LevelSettings` (and its
adjacent stored calibration values) mixes several kinds of data that must not all
travel together: the physical vehicle's own dimensions, per-phone/per-box calibration
tied to exactly where one sensor sits, and personal UI/behavior preferences. This ADR
settles which of those a share link is allowed to carry, and how the link itself fails
safely, before any UI is built against it.

## Decision

**A new, narrow payload type — not the whole `LevelSettings`.** `domain/vehicleShare.ts`
defines `VehicleGeometry`, a fixed `Pick` of exactly eight fields: `vehicleType`,
`rearAxle`, `wheelbaseMm`, `trackWidthFrontMm`, `trackWidthRearMm`,
`rampStepHeightsMm`, `rampCount`, `drainPosition`. `pickVehicleGeometry` extracts it
from a live `LevelSettings`; `applyVehicleGeometry` merges it back in via a plain
object spread, touching only those eight keys.

**Calibration never enters this type at all — not filtered out, structurally absent.**
The phone's sensor bias, the vehicle-zero placement offset (ADR 0010), and the
EasyLevel installation offset (ADR 0014) are each tied to exactly where one physical
phone or box sits in one physical vehicle; sharing any of them to a different phone or
a different mounting spot would silently produce a wrong reading with no error to
show. Because `VehicleGeometry` is a `Pick` of `LevelSettings`'s own field names, it
cannot accidentally acquire a calibration field later without a visible type change —
the exclusion is enforced by TypeScript, not by a runtime denylist someone could forget
to update.

**UI/behavior preferences are excluded on the same reasoning as calibration, for a
different reason.** Tolerance, stability, dwell timing, display unit, sound, theme,
appearance and sensor source are per-person choices about how the app behaves, not
facts about the vehicle — "share my RV's measurements" should not silently overwrite a
family member's own accessibility/preference choices.

**The link fails closed on anything at the envelope level, falls back per-field
otherwise.** `encodeVehicleGeometry` wraps the geometry in `{ v: 1, g: ... }`,
UTF‑8/base64url-encodes it, and the caller places it after a URL `#` fragment — never
sent to any server (there is no backend, `SECURITY.md`), so it never reaches request
logs either. `decodeVehicleGeometry` returns `null` — reject the whole link, apply
nothing — for anything malformed, truncated, or carrying an unrecognized schema
version. Once that envelope check passes, individual fields fall back independently to
`DEFAULT_SETTINGS`'s values, reusing `parseSettings`'s own exported validators
(`positiveNumber`, `normalizeHeights`) rather than reimplementing them — the same
"one bad value never breaks the whole thing" posture `parseSettings` already applies to
stored settings, applied here to a received link instead.

**No encryption.** None of the eight fields are sensitive or personal — this decision
is about correctness (never silently apply wrong data) rather than confidentiality.

## Alternatives considered

- **Share the entire `LevelSettings` object** — rejected: the whole reason this ADR
  exists. Would silently overwrite the recipient's calibration and preferences with
  values wrong for their setup.
- **A denylist of fields to strip before encoding** (`{ ...settings }` minus
  calibration-adjacent keys) — rejected: a denylist must be remembered and updated
  every time `LevelSettings` grows a new field; an allowlist `Pick` fails safe by
  default — a new field is simply absent from `VehicleGeometry` until someone
  deliberately adds it.
- **Reject the whole link on any single corrupt field** (strict all-or-nothing
  decoding) — rejected: inconsistent with how the rest of the app already treats
  untrusted input (`parseSettings`), and a link corrupted in one byte (e.g. by a
  messaging app's link-preview rewriting) would become unusable instead of degrading
  one field to its default.
- **Encrypt or sign the payload** — rejected: nothing in it is confidential, and a key
  exchange between family members would add friction for no real protection; the
  version check plus per-field validation already prevents a malformed link from doing
  anything worse than falling back to defaults.

## Consequences

- `src/domain/vehicleShare.ts`: new pure module — `VehicleGeometry`,
  `pickVehicleGeometry`, `applyVehicleGeometry`, `encodeVehicleGeometry`,
  `decodeVehicleGeometry`. `src/domain/settings.ts` exports `positiveNumber` and
  `normalizeHeights` so this module reuses them instead of duplicating validation
  logic.
- `src/ui/vehicleShare.ts` builds the shareable URL (`appUrl()` + `#setup=<encoded>`,
  reusing `share.ts`'s existing native-share/clipboard-fallback path) and reads a
  pending link off `location.hash` at startup, consuming it immediately so a refresh
  never re-prompts.
- `src/ui/incomingVehicleSetup.ts` previews the decoded geometry and requires an
  explicit tap before `applyVehicleGeometry` ever runs — never automatic.
- `docs/02-REQUIREMENTS.md` gains R40 for the user-visible behavior; this ADR covers
  only the payload-shape and fail-closed decisions behind it.
- Extending `VehicleGeometry` to cover a new "this is part of the vehicle" field later
  is a one-line addition to the `Pick` (plus a schema-version bump if the change isn't
  additive); it can never happen by accident the way a denylist miss could.
