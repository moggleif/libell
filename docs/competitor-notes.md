# Competitor notes (internal reference — not a canonical source)

This is a working reference of what we know, suspect, or don't know about other RV
leveling products. It exists so future decisions about Libell's own feature set aren't
made on assumptions about what competitors do.

It is **not** part of the numbered `docs/0N-*.md` series and is **not** a canonical
source per `CLAUDE.md`'s canonical-sources table — nothing here overrides
`docs/02-REQUIREMENTS.md`, `docs/03-ARCHITECTURE.md`, or the ADRs. It is not marketing
copy either: every claim below is tagged so a reader can see how solid it is.

## Tagging

- **Verified** — confirmed by direct inspection (e.g. decompiled app resources), an
  official document we've actually read, or hands-on testing.
- **Inferred** — a reasonable conclusion from indirect evidence, not directly confirmed.
- **Unknown** — an open question. Listed so it doesn't quietly get treated as "no", and
  so nobody re-derives it from scratch later.

When a claim's tag might not be obvious from context, the row says where it comes from.

## EasyLevel / EasyLevel RV (CaraTech AB)

Background: #116 reverse-engineered the BLE protocol by decompiling three official APKs
(EasyLevelRV 2.2.2, EasyLevelRV 2.5.0, EasyLevel 5.0.7, all from APKPure) to support an
optional Libell sensor source; #119 tracks a small iOS bridge app for the same hardware.
That work also produced an inventory of the app's UI strings, referenced informally when
issue #127 was filed, but — as of this doc — the string-inventory detail itself isn't
written up in #116 or #119's issue bodies/comments. The rows below are split accordingly:
protocol facts are Verified against #116/#119; UI/feature facts are Inferred, pending
that inventory being committed somewhere citable.

### BLE protocol (Verified — per #116, #119)

| Claim                                                   | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main GATT service UUID                                  | `faf52c20-5078-11e9-b475-0800200c9a66`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Sensor data characteristic                              | `faf52c21-...` (NOTIFY) — 6× signed int16 LE: accel X/Y/Z + gyro X/Y/Z                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Status/config characteristic                            | `faf52c22-...` (NOTIFY/READ) — firmware version, temperature, 6× int16 zero/calibration values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Status characteristic battery/temperature byte layout   | Bytes 2–3 (LE uint16 `rawMv`): battery% = `clamp(trunc(rawMv × 0.1 − 200), 0, 100)` — truncated to a whole percent (the official app's own `(int)` cast, applied before its clamp). Byte 7: firmware tier (thresholds 32/48/64/80/96/112 → tiers 1–7), selecting the temperature formula — tier 1: `clamp(trunc(byte[0] / 16 + 25), −40, 80)` (also truncated); tier 2+: `clamp(int16LE(bytes[0..1]) / 100, −40, 80)` (kept fractional — no truncation on this branch). Re-confirmed, including the truncation the earlier passes missed, by directly decompiling the official `EasyLevel 5.0.7` `.xapk` end to end (`y0/C1207a.java`'s `i()` handler) rather than reading bytecode fragments.                                                                                                                                                                                                                                                                                                                                                            |
| Payload encryption                                      | None found — plain byte-parsed payload, no AES/cipher code in any of the three decompiled app versions (#116 explicitly rules out an earlier assumption of "encrypted BLE")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Write characteristic                                    | None found — zeroing/calibration appears to be done with a physical button on the box itself, not a BLE command                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Device name prefix                                      | Devices identify as `"CARATI..."` (per #119); confirmed as the app's own fallback scan match (below) for boxes too old to advertise the scan UUID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Scan-filter UUID `669a0c20-0008-a7ba-e311-0685c0f7978a` | **Verified**, previously listed as Unknown. This — not the `faf52c20-...` GATT service — is what the official app's `ScanFilter` actually matches against in its BLE _advertisement_ scan (`MainActivity`/`y0/C1213g.java`'s `BleScanner`); `faf52c20-...` is only looked up post-connect. Only used when the user's "legacy sensor" setting is off (the default); when on, the app scans with no service filter at all and instead accepts by device name prefix (`CARATI`) plus RSSI > −80 dBm — Web Bluetooth's `requestDevice()` has no RSSI filter, so Libell covers the legacy case with the name-prefix filter alone. This was #116's one explicitly-flagged, never-verified risk ("boxens exakta annonserings-/skanningsbeteende ... bör verifieras mot en fysisk box innan skanningsfiltret låses fast") — Libell's transport had been filtering `requestDevice()` on `faf52c20-...` itself, which real boxes never advertise, so the OS picker would never have listed one; fixed to filter on this UUID plus the name-prefix fallback instead. |
| On-device fusion                                        | App computes roll/pitch via a complementary/low-pass filter (atan2 on accel + IIR), clipped to ±30° — Libell doesn't need to replicate this exactly since it can derive roll/pitch from the raw gravity vector the same way it already does for the phone's own sensor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### App/UI features (Inferred — attributed to the #116/#119 app string inventory, not independently re-confirmed in this pass)

| Claim                   | Detail                                                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Degree readout          | Numeric degree display with **adjustable resolution**, reportedly in the range ±0.05°–±2.0°                                                                                                                |
| Vehicle geometry inputs | Track width + wheelbase inputs feed a **single "Height Correction" value** — not per-wheel or per-ramp guidance the way Libell's ramp planning (ADR 0011) works                                            |
| Calibration             | 0° calibration with memory, plus a tolerance setting                                                                                                                                                       |
| Gyro                    | On/off toggle                                                                                                                                                                                              |
| Sensor pairing          | Supports multiple paired sensors                                                                                                                                                                           |
| Saved positions         | Up to 4 saved positions                                                                                                                                                                                    |
| Localization            | Roughly 10 UI languages, including Swedish                                                                                                                                                                 |
| Ramp-aware guidance     | Not found in the app's string inventory — i.e. EasyLevel appears to stop at "raise this end by N", not "here's how many ramp boards/pucks to add," which is the thing Libell's ramp plan (ADR 0011) is for |

None of the above have been re-verified by opening the app or reading CaraTech
documentation directly in this pass — treat them as a starting point, not a citation.
If a future issue depends on any single one of these being exactly right (e.g. the
resolution range, or the saved-position count), re-verify it first.

### Hardware form factor

- **Inferred**: EasyLevel is sold as a standalone BLE sensor box, separate from the
  phone — this is implied by the pairing/BLE flow in #116, not confirmed against
  product photos or a spec sheet in this pass.

## LevelMatePRO / LevelMatePRO+

We have not decompiled the LevelMatePRO app, read CaraTech-equivalent documentation for
it, or tested the hardware. Nothing below should be treated as confirmed.

| Claim                                                                   | Status                               |
| ----------------------------------------------------------------------- | ------------------------------------ |
| BLE protocol (service/characteristic UUIDs, payload format, encryption) | **Unknown** — not reverse-engineered |
| Degree resolution / readout behavior                                    | **Unknown**                          |
| Calibration / zeroing flow                                              | **Unknown**                          |
| Number of sensors supported, saved positions, or presets                | **Unknown**                          |
| Ramp-aware or per-wheel guidance vs. a single correction value          | **Unknown**                          |
| Supported languages                                                     | **Unknown**                          |
| Companion app platform support (iOS/Android/web)                        | **Unknown**                          |

If LevelMatePRO becomes relevant to a concrete decision (e.g. the battery-reporting
protocol question or a differentiation claim in product copy), that work should start
with actually inspecting the product — an APK/IPA teardown, official docs, or hands-on
testing — the same way #116 did for EasyLevel, rather than filling in this table from
general impression.

## Other RV leveling products

No other product has had any research effort spent on it yet. Rather than guess, this
section is a placeholder: add a row (with the same Verified/Inferred/Unknown discipline)
the first time a specific competitor becomes relevant to a decision, instead of trying
to pre-populate a exhaustive market survey here.

## How this feeds other issues

- The battery-reporting protocol question can check the "BLE protocol" table above
  before deciding whether to reverse-engineer another device from scratch.
- Any product-copy differentiation claim (e.g. "per-wheel ramp guidance, not just a
  single correction number") should cite the specific row above it relies on, and
  should not claim more certainty than that row's tag supports — in particular, the
  EasyLevel UI/feature table above is Inferred, not Verified, until the underlying
  string inventory is itself committed somewhere.

## Keeping this current

This file is a snapshot, not a live feed — competitor apps and hardware change without
notice. When a claim here is re-verified, upgrade its tag and note the new source
(issue/PR number or artifact) inline. When a claim is contradicted, correct it in place
rather than leaving both versions to be reconciled by a future reader.
