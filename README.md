# LevelMate

LevelMate is an Android app that helps you level a motorhome / RV.

Lay your phone flat inside the vehicle (for example on the table) with the **top edge of
the phone pointing toward the front**. LevelMate then shows a top-down view of the RV with
the wheels that need raising (in cm and number of leveling blocks) plus a live bubble
level. No calibration, no runtime permissions.

> **Status:** this repository currently contains the project foundation — CI, docs, and a
> buildable skeleton. Features are built incrementally; see the GitHub issues and
> `docs/02-REQUIREMENTS.md`.

## How leveling works

From the device gravity vector `(gx, gy, gz)`:

```
roll  = atan2(gx, gz)   // side/side
pitch = atan2(gy, gz)   // front/back
```

Wheel positions in the vehicle plane (`x` = right, `y` = front), wheelbase `L`, track
width `W`: FL `(-W/2,+L/2)`, FR `(+W/2,+L/2)`, RL `(-W/2,-L/2)`, RR `(+W/2,-L/2)`. Each
wheel's height is `z_i = x_i·tan(roll) + y_i·tan(pitch)`. Blocks go only *under* wheels, so
the highest wheel is the reference: `lift_i = max(z) − z_i ≥ 0`, shown as cm and
`round(lift_i / blockHeight)` blocks. Level when `|roll| < tolerance` and
`|pitch| < tolerance` (default 0.5°). Full spec in `docs/03-ARCHITECTURE.md`.

## Tech

- Kotlin + Jetpack Compose (Material 3), Gradle Kotlin DSL with a version catalog
- `minSdk 24`, `targetSdk`/`compileSdk 35`, package `com.moggleif.levelmate`

## Building

> **The Gradle wrapper binary is not committed.** `gradle/wrapper/gradle-wrapper.jar`,
> `gradlew`, and `gradlew.bat` are binary/generated and cannot be pushed through the
> text-based GitHub API, so they are intentionally absent.

Generate them once:

- **Android Studio**: open the project — it generates the wrapper automatically.
- **Command line** (with a system Gradle installed): `gradle wrapper --gradle-version 8.11.1`

Then:

```sh
./gradlew test          # unit tests
./gradlew lintDebug     # Android lint
./gradlew assembleDebug # debug APK
```

CI (`.github/workflows/ci.yml`) regenerates the wrapper automatically before running
tests, lint, and the debug build.

## Development

See `docs/01-CONTRIBUTING.md` for the workflow and `CLAUDE.md` for architecture rules.
Enable the shared git hooks once: `git config core.hookspath .githooks`.
