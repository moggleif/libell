# 0014 — Sensor source is an abstract seam; calibration split three ways

**Status:** Accepted, 2026-08-25

## Context

Issue #128: #116 (a Web Bluetooth EasyLevel box) and #119 (an iOS native BLE bridge)
each want to feed the leveling engine from a source other than the phone's own
DeviceMotion/DeviceOrientation sensor. Neither issue should invent its own interface or
its own take on calibration — that would fork the leveling pipeline per source and risk
conflating a source's hardware bias with where it physically sits. This ADR settles both
questions once, before #116/#119/#131 build against them.

## Decision

**The seam already exists.** `OrientationSensor` (`start()/getState()/getGravity()` in
`src/sensor/orientation.ts`) is formalized in code comments as the one interface every
gravity source implements — proven today by two independent implementations already
living side by side: the real phone sensor and the fixed-tilt `?demo` stand-in in
`main.ts`. `main.ts` selects between implementations at exactly one line; `domain/`
(ADR 0002) never sees which one is active, only the resulting `GravityVector`.

**One genuine gap, closed minimally.** Nothing today identifies _which_ source produced
a reading, which #128 needs so a lost external source can be reported by name instead of
silently substituted. `OrientationSensor` gains `getSource(): SensorSource`; `SensorSource`
is a new type in `src/domain/settings.ts` (pure, no browser API), currently the
single-member union `'phone'`. `LevelSettings` gains a matching `sensorSource: SensorSource`
field, defaulting to `'phone'` and validated by `parseSettings` like every other field. No
settings-panel control is added — there is nothing else to choose yet, and a picker with
one permanently-disabled option is exactly the confusing dead UI #128 asks to avoid. The
field exists purely so a second adapter (#116/#119) extends the union and gets a working
selector, instead of introducing the concept from scratch.

**Calibration splits three ways, explicitly non-overlapping:**

1. **Sensor calibration** (R11, existing `libell.calibration`) — hardware/measurement
   bias. Source-specific: a phone's bias and a future external sensor's bias are
   different numbers and must never share a field. A second source gets its own
   calibration storage, keyed by `SensorSource`, never written into `libell.calibration`
   (which is, and stays, the phone's own bias).
2. **Installation/placement offset** (R24's vehicle zero, ADR 0010, `libell.vehicleCalibration`)
   — where the source physically sits. The _mechanism_ generalizes as-is to any source
   (capture with the vehicle verified level, store sensor-corrected, sum via
   `combineCalibrations`); only the _storage_ generalizes per source, the same way as
   above — a future external sensor's installation offset is its own stored value, never
   overwriting the phone's.
3. **Desired vehicle target** (ADR 0013, target presets) — orthogonal to both above,
   unchanged by this ADR, and already source-independent since it is applied after
   whichever source's two terms produced "level."

The composition stays exactly `combineCalibrations(combineCalibrations(sensorCal,
installOffset), targetOffset)` (ADR 0013's third term, unmodified). A second source does
not add a fourth term — it supplies its own `sensorCal`/`installOffset` values for the
first two, selected by whichever `SensorSource` is active. `domain/` needs no change:
`computeLeveling`/`computeCaravanLeveling` already take a `GravityVector` and a
`Calibration | null` with no notion of provenance.

## Alternatives considered

- **A richer interface now** (battery level, RSSI, connection-quality fields) — rejected:
  no real hardware exists in this codebase yet to design those fields against, and #116's
  own protocol notes flag details (advertising behavior, exact packet layout) still
  unverified against a physical box. Extend again when a concrete need exists.
- **One calibration blob keyed by source** (e.g. `{ phone: {...}, easylevel: {...} }`
  inside `Calibration`) instead of separate top-level storage keys — deferred, not
  decided: no second source exists yet to design the concrete shape against. This ADR
  commits to the _rule_ (never conflate) and leaves the exact storage shape to #116/#131.
- **A visible, disabled sensor-source picker** — rejected: untestable against a real
  second option and confusing before one exists; the setting is scaffolding at the
  type/storage layer only, per #128's own guidance.
- **Renaming `vehicleCalibration`/"vehicle zero" to a source-neutral name now** — rejected:
  no second source consumes it yet, and renaming a shipped storage key on spec risks churn
  #116/#131 would redo once the real shape is known. The generalization is stated as a
  rule here, not forced into a rename.

## Consequences

- `src/domain/settings.ts`: new `SensorSource` type (`'phone'` only) and a
  `sensorSource: LevelSettings` field, defaulting to `'phone'`; `parseSettings` validates
  it and falls back on anything else, including a future value this build doesn't know.
- `src/sensor/orientation.ts`: `OrientationSensor` gains `getSource(): SensorSource`;
  `createOrientationSensor()` returns `'phone'`. `src/main.ts`'s `?demo` sensor implements
  it too — the type checker now enforces that both stay one interface.
- No settings UI, no BLE code, no second adapter: this PR is the seam and the rule, not a
  working external sensor. #116 and #119 implement `OrientationSensor` against this
  contract instead of defining their own; #131 (installation calibration UX) follows the
  three-way split above rather than re-deriving it.
- No new user-visible behavior — `sensorSource` is inert until a second adapter exists,
  so `docs/02-REQUIREMENTS.md` gains no new requirement number in this change.
