# Architecture

## Stack

- Kotlin + Jetpack Compose (Material 3)
- Gradle Kotlin DSL, version catalog in `gradle/libs.versions.toml`
- `minSdk 24`, `targetSdk`/`compileSdk 35`, JVM target 17
- Package `com.moggleif.levelmate`

## Layers

```
com.moggleif.levelmate
├── MainActivity.kt   # single activity; FLAG_KEEP_SCREEN_ON; portrait; hosts Compose
├── domain/           # PURE Kotlin (no android.* imports) — unit-testable
│   ├── LevelingCalculator.kt
│   └── Settings.kt   # LevelSettings (wheelbase, track width, block height, tolerance)
├── data/             # SettingsRepository — Jetpack DataStore (Preferences)
├── sensor/           # OrientationSensor — gravity vector as a Flow
└── ui/               # LevelViewModel (StateFlow), screens, components, theme
```

Rule: `domain/` never imports Android. All sensor/IO/Compose concerns live outside it, so
the leveling math is trivially testable on the JVM.

## Leveling math (`domain/LevelingCalculator.kt`)

Input: gravity vector `(gx, gy, gz)` in device coordinates (x = right, y = up-screen =
toward front, z = out of screen) and `LevelSettings`. All lengths in **centimetres**.

```
roll  = atan2(gx, gz)        # side/side
pitch = atan2(gy, gz)        # front/back

# wheel positions (x = right, y = front), L = wheelbase, W = track width
FL(-W/2, +L/2)  FR(+W/2, +L/2)
RL(-W/2, -L/2)  RR(+W/2, -L/2)

z_i    = x_i*tan(roll) + y_i*tan(pitch)
lift_i = max(z) - z_i          # >= 0, because blocks only go under wheels
blocks = round(lift_i / blockHeight)
isLevel = |roll| < tolerance && |pitch| < tolerance     # degrees, default 0.5
```

The highest wheel is always the reference (no calibration). Output: per-wheel
`{position, liftCm, blocks}`, plus `rollDeg`, `pitchDeg`, `isLevel`.

## Sensor (`sensor/OrientationSensor.kt`)

Prefer `Sensor.TYPE_GRAVITY`. If unavailable, use `TYPE_ACCELEROMETER` with a low-pass
filter to isolate gravity. Either way, exponentially smooth the output to reduce jitter.
Exposed as a `Flow` (e.g. `callbackFlow` registering/unregistering the `SensorEventListener`).

## State (`ui/LevelViewModel.kt`)

`LevelViewModel` combines the sensor flow with the settings flow and emits a
`StateFlow<LevelUiState>` computed via `LevelingCalculator`. The UI collects it with
`collectAsStateWithLifecycle`.

## Settings (`data/SettingsRepository.kt`)

Jetpack DataStore (Preferences). Defaults: wheelbase 400 cm, track width 180 cm, block
height 4 cm, tolerance 0.5°.

## UI

RV top-down diagram is the hero element (see `docs/02-REQUIREMENTS.md` R4–R6); the bubble
level is secondary. All user-facing strings are English in `res/values/strings.xml`.

## Build / CI notes

`gradle/wrapper/gradle-wrapper.jar`, `gradlew`, `gradlew.bat` are not committed (binary).
CI regenerates the wrapper, then runs `./gradlew test lintDebug assembleDebug`.
