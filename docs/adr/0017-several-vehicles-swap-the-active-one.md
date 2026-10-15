# 0017 — Several vehicles: only the active one lives in the app's keys

**Status:** Accepted, 2026-10-15

## Context

Issue #599: an owner with a motorhome and a caravan, or who borrows a family member's
vehicle, wants each one's setup kept, not retyped. Morgan: "Boxen åker med fordonet
också. Man har en box per fordon." So a vehicle is more than R41's geometry. It is also
its sensor source and box (remembered device, direction, password), its zeros and their
fine adjustment, its targets and its hitch height. The phone's own sensor calibration
(R11) and the app-wide preferences (tolerance, unit, sound, look, language) describe the
phone or the person, so they are shared.

Every store and module reads these values from fixed `localStorage` keys today
(`settingsStore.ts`, `calibrationStore.ts`, `sensorDeviceStore.ts`), and the box
connection, calibration layers and level screen are all built from them at start-up.

## Decision

**Only the active vehicle lives in the ordinary keys.** The other vehicles wait as
snapshots in one list under `libell.vehicles` (`src/data/vehicleStore.ts`). A snapshot
holds the vehicle's settings fields (`VEHICLE_FIELDS` in `src/domain/vehicles.ts`, R41's
eight plus `sensorSource` and `sensorDevices`) and the raw values of its keys, which each
store names (`vehicleCalibrationKeys`, `vehicleFlagKeys`, `rememberedDeviceKeys`).

**Switching stores the active vehicle, restores the other one and reloads the app**
(`src/app/vehicles.ts`). The reload is the switch: every module starts from the new
vehicle exactly as it does on open, the old box is disconnected with the page, and the
new one reconnects as R33 describes. Nothing else in the app knows there is more than
one vehicle.

**An install from before #599 needs no migration.** With no list stored, the list is one
unnamed vehicle whose values are the ones already in the ordinary keys, so nothing moves
and nothing can be lost.

A restored snapshot can only write the keys the stores name, and its settings go back
through `parseSettings`, so a corrupt snapshot falls back to defaults like any stored
value.

## Alternatives considered

- **Key every value by vehicle id** (`libell.vehicleCalibration.<id>` and so on). Every
  store, and every module that holds one of their values, would need the active id, and
  switching would still have to rebuild the box connection and calibration layers in
  place. Much wider change for the same behaviour.
- **Switch in place without a reload.** Every holder of vehicle state (the settings
  copy, calibration layers, targets, hitch height, the box controller) would need a
  reset path, each a chance to keep a stale value from the previous vehicle.

## Consequences

- A vehicle switch reloads the app, which takes about a second; the settings page
  closes.
- A new per-vehicle stored value must be added to its store's vehicle key list, or it
  stays shared. A new per-vehicle setting must be added to `VEHICLE_FIELDS`.
- Waiting vehicles' values are not migrated by later start-up migrations until they
  become active again; the stores' parsers already accept older values.
