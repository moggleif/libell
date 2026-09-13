# 0016 — External sensors are a registry of described sources

**Status:** Accepted, 2026-09-13. Resolves the two deferrals in
[ADR 0014](0014-sensor-source-seam-and-three-way-calibration-split.md) (which stands
otherwise: the seam and the three-way calibration split are unchanged).

## Context

ADR 0014 settled the seam — `OrientationSensor`, and `SensorSource` so a lost external
source can be reported by name — and explicitly deferred two shapes because no second
source existed to design them against: how a source's **storage** is keyed, and how its
**settings** are held. It named #116/#131 as the issues that would resolve them.

They did, in the only way a single-device codebase can: `'easylevel'` stayed a bare
string, and every consumer above the seam interpreted it for itself. The storage keys
(`libell.easyLevelDeviceId`, `libell.easyLevelInstallCalibration`), the settings fields
(`easyLevelMounting`, `easyLevelConnectDelay*`), the availability gate
(`isEasyLevelAvailable()`), the UI's status type (imported straight from
`sensor/easyLevelProtocol.ts`), the staleness timeout (`STALE_TIMEOUT_EASYLEVEL_MS`, in
the pure domain layer) and the shipped strings in five languages each name the one
device. Adding a second one duplicates all of it.

A second device is now specified rather than hypothetical: `docs/competitor-notes.md`
carries the decompiled protocol for the Xparkle RVS01 (#261). That is the condition
ADR 0014 set for revisiting this.

## Decision

**An external sensor source is described by one value, owned by `sensor/`.** A
descriptor carries its `id` (the `SensorSource` member), its `displayName` (the product
name, never translated), `isAvailable()` (can it work in this browser right now), and
its `capabilities` — which rows and controls its device page has something to put in.
`src/sensor/externalSensors.ts` holds the registry of descriptors and the three queries
everything above the seam needs: what is available, is anything available, and find one
by stored id.

**The descriptor is data, not behavior.** Connecting, retrying, reconnecting and
capturing an installation offset belong to the controller (#265); packet layouts belong
to each protocol module. A descriptor answers "what is this, can it work here, what can
it tell me" and nothing else. That boundary is what keeps it from growing into a plugin
system, and it is why the capability list is a closed set of concrete UI questions
rather than an open bag.

**`id` is the one identifier.** It is the persisted `sensorSource` value, the storage
key segment (#263) and the per-device settings key (#264), so a source cannot be filed
under one name and rendered under another.

**The phone is not in the registry.** It is the always-available fallback, has nothing
to connect, nothing to remember and no page of its own. `SensorSource` still includes
it, because that enum answers "which source is active", not "which sources are
external".

**Forward compatibility is unchanged.** `parseSettings` already falls back to `'phone'`
for a `sensorSource` it does not recognize; `externalSensorById` returns null for the
same input rather than throwing. An older build must keep ignoring a newer build's
source, never crash on it.

## Alternatives considered

- **Leave it until the second adapter is actually written.** Rejected: the adapter would
  then arrive as one diff that both adds a device and rewrites the storage, settings,
  UI and string layers — unreviewable, and the migrations inside it would be the
  riskiest part of the change rather than their own reviewed increment.
- **A registry with dynamic registration** (`register(descriptor)` at startup).
  Rejected: nothing here is loaded dynamically, a static array is trivially testable,
  and registration order becomes a hidden dependency the moment it is a function call.
- **Put the descriptor in `domain/`.** Rejected: `isAvailable()` reads `navigator` and
  query flags, which ADR 0002 forbids there. `domain/` keeps only the `SensorSource`
  union, which it already had.
- **One big "device" object that also owns connecting.** Rejected: that is the
  controller (#265), and merging the two would put a live connection's state machine in
  the same value the UI renders from — the coupling that made the current code hard to
  extend in the first place.
- **Translate the product name.** Rejected: a brand is identical in every language, and
  a translated brand is a bug. The surrounding sentence is what gets translated, with
  the name substituted into it (#267).

## Consequences

- `src/sensor/externalSensors.ts` is new: the descriptor type, the registry, and
  `availableExternalSensors()` / `hasAvailableExternalSensor()` / `externalSensorById()`.
- `easyLevelSensor.ts` publishes `EASYLEVEL_DESCRIPTOR`. The string "EasyLevel", its
  availability rule and its capability set are stated there and nowhere else.
- `main.ts` and `onboarding.ts` ask the registry instead of asking about one device. With
  one source registered the answer is identical, so no behavior changes in this ADR's own
  change.
- The follow-ups this unblocks, each its own increment: per-source storage (#263),
  per-source settings (#264), the controller extraction (#265), adapter-owned staleness
  timeouts (#266), parameterised strings (#267), and a device page that renders declared
  capabilities (#268).
- A third source — #119's iOS native bridge — becomes a descriptor plus an adapter,
  rather than a second round of the same duplication.
