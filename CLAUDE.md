# CLAUDE.md – LevelMate (Android)

LevelMate is an Android app that helps level a motorhome / RV. The user lays the
phone flat inside the vehicle (the top edge of the phone pointing toward the
front) and the app shows which wheels need to be raised and by how much, plus a
live bubble level.

This document defines the architecture rules and quality requirements. Clarity
over cleverness.

---

## 0. Tech stack

- Kotlin + Jetpack Compose (Material 3)
- Gradle Kotlin DSL, version catalog in `gradle/libs.versions.toml`
- `minSdk 24`, `targetSdk 35`, `compileSdk 35`
- Package: `com.moggleif.levelmate`
- One `MainActivity` + `LevelViewModel` (StateFlow)
- Settings persisted with Jetpack DataStore (Preferences)
- No runtime permissions, no calibration

## 1. Package layout (target)

```
com.moggleif.levelmate
├── MainActivity.kt
├── domain/          # PURE Kotlin, no Android imports — fully unit-testable
│   ├── LevelingCalculator.kt
│   └── Settings.kt
├── data/            # SettingsRepository (DataStore)
├── sensor/          # OrientationSensor (TYPE_GRAVITY + fallback)
└── ui/              # Compose screens, ViewModel, theme, components
```

The repo currently holds a buildable **skeleton** (placeholder `MainActivity`, theme, one
example test). Each feature is built incrementally via the GitHub issue backlog — see
`docs/02-REQUIREMENTS.md` for the behaviors and the tracking issue for order.

## 2. Core principles

- `domain/` must stay pure (no `android.*` imports) so the leveling math is
  trivially testable. All sensor/IO/Compose concerns live outside `domain/`.
- All user-facing strings are **English** and live in `res/values/strings.xml`.
- Material 3 theming only. Don't hardcode colors that bypass the theme.
- The activity is locked to portrait and keeps the screen on
  (`FLAG_KEEP_SCREEN_ON`).
- No calibration feature. The reference is always the highest wheel.

## 3. Leveling math (see `domain/LevelingCalculator.kt`)

From the gravity vector `(gx, gy, gz)`:
- `roll = atan2(gx, gz)`, `pitch = atan2(gy, gz)`

Wheel positions in the vehicle plane (`x` = right, `y` = front), wheelbase `L`,
track width `W`:
- Front-left `(−W/2, +L/2)`, Front-right `(+W/2, +L/2)`,
  Rear-left `(−W/2, −L/2)`, Rear-right `(+W/2, −L/2)`

Per-wheel height: `z_i = x_i·tan(roll) + y_i·tan(pitch)`. Blocks only go *under*
wheels, so the reference is the highest wheel: `lift_i = max(z) − z_i ≥ 0`.
Display cm and `round(lift_i / blockHeight)` blocks. "Level" when
`|roll| < tolerance` and `|pitch| < tolerance` (default 0.5°). All lengths are
in centimetres.

## 4. Quality requirements

- Run before committing: `./gradlew test lintDebug`
- Work is **behavior-driven and issue-driven**: each feature has a GitHub issue with
  Given/When/Then acceptance criteria (sourced from `docs/02-REQUIREMENTS.md`). Write the
  test first, then the implementation, then make it pass.
- The leveling math will be covered by `LevelingCalculatorTest`. Any change to the math
  must keep those tests green and add cases for new behavior.

## 5. Git workflow

- Develop on the feature branch `claude/rv-leveling-app-LzsVU-4Ppuq`.
- One issue per increment; small, reviewable commits. Reference the issue in the commit.
- Descriptive commit messages; create new commits rather than amending pushed work.
- Do not open a pull request unless explicitly asked.
- Enable the shared hooks once: `git config core.hookspath .githooks`.

## 6. The gradle-wrapper.jar caveat

`gradle/wrapper/gradle-wrapper.jar`, `gradlew`, and `gradlew.bat` are binary /
generated and are **not** committed (they can't be pushed through the text-based
GitHub API). Regenerate them by opening the project in Android Studio or running
`gradle wrapper` once. CI regenerates the wrapper automatically. See `README.md`.
