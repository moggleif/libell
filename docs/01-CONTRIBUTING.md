# Contributing

## Prerequisites

- JDK 17
- Android SDK (via Android Studio, or `sdkmanager`)

## Gradle wrapper

The binary `gradle/wrapper/gradle-wrapper.jar` (and `gradlew` / `gradlew.bat`) are **not**
committed — they can't be pushed through the text-based GitHub API. Generate them once:

```sh
gradle wrapper --gradle-version 8.11.1   # or just open the project in Android Studio
```

CI regenerates the wrapper automatically, so pull requests are still validated.

## Build & test

```sh
./gradlew test          # JVM unit tests
./gradlew lintDebug     # Android lint
./gradlew assembleDebug # debug APK
```

## Git hooks

Enable the shared hooks once (runs tests + lint before each commit, tests before push):

```sh
git config core.hookspath .githooks
```

## Workflow

- **Behavior- and issue-driven.** Every feature has a GitHub issue with Given/When/Then
  acceptance criteria, sourced from `docs/02-REQUIREMENTS.md`. The tracking issue lists the
  order.
- **Test first.** For testable logic (e.g. the leveling math), write the failing test from
  the issue's acceptance criteria, then implement until green.
- **Small commits**, one increment at a time; reference the issue in the commit message.
- Develop on `claude/rv-leveling-app-LzsVU-4Ppuq`. Don't open a pull request unless asked.

## Code rules

See `CLAUDE.md`. Key points: the `domain/` layer stays pure (no `android.*` imports) so it
is unit-testable; all user-facing strings are English and live in `res/values/strings.xml`;
Material 3 theming only.
