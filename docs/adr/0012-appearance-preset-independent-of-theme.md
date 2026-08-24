# 0012 — Appearance is a second preset axis, independent of light/dark theme

**Status:** Accepted, 2026-08-24

## Context

Issue #104 (following a visual design review — a design-canvas handoff proposing a
redesigned surfaces palette, main view, menu, settings, calibration and onboarding,
issues #106–#110). The redesign is a deliberate, opt-in alternative look, not a
replacement of today's: the product owner wants to keep shipping the current design
("Classic") for users who prefer it, while offering the new one ("Modern") as a
choice. `theme: ThemeSetting` (`system`/`light`/`dark`) already owns the light/dark
axis (ADR — light theme via `prefers-color-scheme`, issue #46) and cannot also carry
a second, unrelated meaning.

## Decision

Add `appearance: AppearanceSetting` (`'classic' | 'modern'`, default `'classic'`) to
`LevelSettings`, parsed and defaulted the same way every other setting is
(`parseSettings`, one bad field never breaks startup). Applied via a new
`data-appearance` attribute on `<html>` (`applyAppearance`, mirroring
`applyTheme`/`data-theme` in `src/ui/theme.ts`) — orthogonal to `data-theme`, so the
two combine freely (Modern-dark, Modern-light, Classic-dark, Classic-light). CSS
tokens for the Modern surface family (`--surface`, `--surface-raised`, a new
`--surface-sunken`, `--outline`, `--on-surface`, `--on-surface-muted`) are defined
under `[data-appearance='modern']`, crossed with the same three theme-resolution
paths the base tokens already use (bare `:root`, the light `prefers-color-scheme`
media query, and explicit `[data-theme]`). Status colors
(`--level`/`--lift-*`/`--warning`) are **not** duplicated — both presets keep the
same meaning for green/orange/red/gray, only the neutral surfaces differ. A new
`settings.appearance` field in the Settings form follows the existing theme
select's pattern exactly: live preview on change, persisted only on Save.

This ADR covers the token plumbing and the setting itself. Each screen adopts the
Modern tokens (and, where the design calls for it, different markup — wheel cards,
settings tabs, full-screen menu rows) in its own issue (#106–#110); until those land,
choosing "Modern" changes only the raw surface colors underneath the unchanged
Classic layout.

## Alternatives considered

- **Repurpose `theme` into a four-way enum** (`light`/`dark`/`modern-light`/
  `modern-dark`) — rejected: conflates two independent questions (does the user
  prefer light or dark? do they want the new redesign?) into one field, doubling the
  states for `followSystemTheme` to track and making a future third preset an
  8-value enum.
- **A build-time flag / separate deployment** — rejected: ADR 0007 already makes
  every `main` merge a live deploy; a separate preset build doubles the release
  surface for what is a runtime, per-user preference, not a rollout mechanism.
- **Replace the Classic tokens outright** (as the design handoff's README literally
  proposes) — rejected by the product owner: existing users should not have the
  look changed under them without an explicit, reversible choice.

## Consequences

- A third settings axis (vehicle type, theme, appearance) that combine freely;
  `settingsPanel.ts` keeps them as independent `<select>` fields, same disabled/Undo
  semantics as every other field.
- Two full surface palettes to maintain contrast on (WCAG AA) instead of one —
  checked for both presets whenever either changes.
- `--surface-sunken` is new and, for Classic, has no component that reads it yet
  (defaults to `--surface`, a safe no-op); Modern's tabs/cards (#108 et al.) are the
  first consumers.
- Components that have not yet adopted Modern-specific markup still render (with the
  Modern color tokens, unchanged layout) rather than breaking — the preset is additive
  per screen, never all-or-nothing.
