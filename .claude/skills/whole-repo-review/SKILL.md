---
name: whole-repo-review
description: Review the whole of Libell's main for drift that no single PR shows - Clean Code across files, docs against the app, test quality, the product rules, the static-host and security rules, issue hygiene, accessibility, the app run in every language and theme, CSS, the PWA and security in depth - and report to Morgan with issues for the real findings. Use only when Morgan writes "granska" (#504); it never runs on a schedule.
---

# Whole-repo review ("granska")

The CI guards (see "Quality guards" in `docs/01-CONTRIBUTING.md`) and the per-PR skills
(`clean-code-review`, `test-quality`, `docs-sync`, `steward`) check each change. This
review looks at all of `main` at once for what accumulates between changes: duplication
across modules, documents that drifted from the app, tests that stopped pinning
behaviour, issues that are already done. It runs **only when Morgan writes "granska"**
in a thread, never on a timer, and it changes nothing: **no code changes, no PRs, no
merges**. Its output is a report in the thread and an issue per real finding.

## Before you start

1. Check out current `main` (`git fetch origin main && git checkout origin/main`) and
   note the commit in the report.
2. Run the fast checks so the report starts from a known state:
   `npm run format:check && npm run typecheck && npm run test`.
3. Read the open issues (`list_issues` for the repository, all of them) so "File
   issues" can tell a new finding from a tracked one.
4. Run `npm run build`; areas 8 and 10 look at the built app.

## The eleven areas

Walk them in this order. Each area names the per-PR skill it leans on; apply that
skill's checklist to the **whole tree**, not to a diff, and ignore the "diff against
`main`" steps in it.

**1. Clean Code across files** (checklist: `.claude/skills/clean-code-review/SKILL.md`)

- Duplication between modules: `rg` for repeated operations (a loop over wheels, a
  storage read, a DOM pattern), not only repeated names. Two modules that each have
  their own version of a helper is a finding.
- Unclear names, synonyms for one concept, leaky abstractions (a UI module that knows
  a storage key, a sensor adapter that formats text).
- Logic in the wrong layer: anything in `src/domain/` that reaches `window`,
  `document`, `navigator` or `localStorage` (ADR 0002), any `ui/` import from
  `domain/` in the wrong direction.
- Functions that sit just under the size limits but still do several things: the
  guard measures lines, this review measures responsibilities. The longest functions
  per file are a good place to start (`scripts/quality/functionSizes.ts` lists them).

**2. Docs against the app** (checklist: `.claude/skills/docs-sync/SKILL.md`)

- `docs/02-REQUIREMENTS.md`: pick each requirement and find the code or test that
  implements it; a requirement with no implementation, or behaviour with no
  requirement, is a finding.
- In-app help (`help.*` keys in `src/ui/messages/`) and `README.md` against what the
  app does today, in every shipped language.
- `docs/03-ARCHITECTURE.md` and the ADRs in `docs/adr/` against the code: modules,
  layer seams, sensor paths, storage keys, formulas, CI jobs.
- The canonical-sources table at the top of `CLAUDE.md`: every owner it names still
  owns that truth and nothing restates it elsewhere.

**3. Test quality** (checklist: `.claude/skills/test-quality/SKILL.md`)

- Tests that pin implementation (spying on internals, asserting call order) instead of
  behaviour.
- Bug fixes with no regression test: walk the closed bug issues since the last review
  and find each one's test.
- Weak assertions (`toBeDefined`, `not.toThrow` as the only check, snapshot-only tests).
- The coverage trend: run `npm run test:coverage` and compare with the floors in
  `vite.config.ts`; a floor that could be raised is a finding too.

**4. Morgan's product rules**

- Never block or refuse an action; show the problem and guide instead (#411). Any
  disabled control, swallowed action or "cannot" message is a finding unless it is the
  agreed exception (no box connected: greyed zero/direction controls and "—").
- Terminology: _Kalibrera_ only for the phone's own sensor, _Nollställ_ for the
  vehicle's zero, always _kloss_ (never "ramp"), _Sensorbox_. Check every language in
  `src/ui/messages/` and the help pages, not only Swedish.
- Consistent wording across every shipped language: the same key says the same thing in
  each language, at the same level of detail.
- No feature that needs a step in the Xparkle app (changing the box password is the
  one agreed exception, #367).

**5. Static-host and security rules**

- Offline only: no remote requests, no CDN, no new external resource (ADR 0005):
  `rg "https?://" src public` and judge every hit.
- No `innerHTML` (ADR 0001): `rg innerHTML src` must find nothing outside tests that
  prove its absence.
- No hex colours outside `src/ui/styles.css`: `rg "#[0-9a-fA-F]{3,8}\b" src --glob
'!styles.css'`.
- `npm audit` and `npm outdated`: report vulnerabilities and major versions behind.
  A dependency upgrade is an issue, never a change made by this review.

**6. Issue hygiene**

- Open issues whose work is merged: for each open issue, search `main`'s history for
  its number (`git log --oneline --grep "#NNN"`) and read the diff; done is a finding
  that the owning thread closes, not an issue to file.
- Stale issues: open for weeks with no linked work and no decision; list them in the
  report for Morgan to decide.
- TODOs in code with no issue: `rg "TODO|FIXME|XXX" src scripts`; each hit either
  names an open issue or becomes a finding.

**7. Accessibility**

- Every control (button, toggle, tab, input, summary) has an accessible name: visible
  text, a `<label>`, or an `aria-label` that comes from `t()`. Icon-only buttons (the
  top bar, the sensor icon, the mute button) are the usual gap.
- Roles and states: tabs use `role="tab"`/`aria-selected`, toggles expose their state
  (`aria-pressed` or a checkbox), live values that change on their own (the status
  line, toasts) sit in an `aria-live` region.
- Screen-reader names for what is drawn: the lamps, the bubble level and each wheel's
  readout in the diagram say in words what the picture shows.
- Focus: tab order follows the visual order, every focusable element shows a visible
  focus ring in both palettes, and opening or closing a page moves focus somewhere
  sensible.
- Contrast: text and icon colours from `src/ui/styles.css` against their backgrounds
  meet WCAG AA (4.5:1 for text, 3:1 for large text and UI parts) in both the light and
  the dark palette; compute the ratios from the custom properties.
- Reduced motion: animations (the bubble, the celebration, transitions) respect
  `prefers-reduced-motion`.

**8. The app run for real**

- Serve the built app (`npx vite preview`) and drive it with Playwright (the
  pre-installed Chromium, `CHROMIUM_PATH` as in the other scripts) at phone width
  (375 px wide). Choose the language by writing `libell.language` to `localStorage`
  before load, and the theme with the browser's `colorScheme` emulation.
- In every language in `LANGUAGES` (`src/ui/i18n.ts`) and both themes, open each
  screen with `?demo`: the level view, the introduction's steps, each Settings tab,
  each Help tab and the Sensorbox page; open the box flow again with `?easylevel-sim`.
- Look for overflow, clipped or cut-off text, buttons that wrap to two lines, text in
  the wrong language and layouts that differ between languages. The fit test in CI
  (`npm run fit`) proves the level view and guide fit one screen; this area covers the
  screens it does not measure.
- Save the screenshots as `/mnt/project-files/granska/<date>/<lang>-<theme>-<screen>.png`
  and link the folder in the report. Every overflow is a finding naming the language,
  the theme and the screen.

**9. CSS** (`src/ui/styles.css`)

- Dead rules: for each class selector, `rg` the class name in `src/`; a selector no
  component creates is a finding.
- Duplicated declarations: the same block of properties repeated under several
  selectors, or one selector defined twice.
- Palettes: every custom property set in the light palette is also set in the dark
  one, and the other way round; a colour used but defined in only one palette is a
  finding.
- Hardcoded sizes and colours: repeated magic numbers (spacing, radii, font sizes)
  that should be a custom property, and any colour value outside the custom properties.

**10. The PWA**

- `vite.config.ts` manifest: name, short name, start URL and scope under the deploy
  base, display, theme and background colours, and the icons
  (`scripts/generate-icons.mjs`) in the sizes and purposes the manifest names.
- Precache: compare the service worker's precache list in `dist/sw.js` with the files
  in `dist/`; a file the app loads that is not precached breaks the offline start.
- The update path: a new version is detected, installed and reloaded once (the
  update code in `src/app/` and its tests), never in a loop.
- Offline start after a deploy: serve `dist/`, load the app once, stop the server,
  reload; the app must start.
- Bundle size: note the size of `dist/assets/*.js` and `*.css` from the build output
  and compare it with the last report in `/mnt/project-files/granska/`; a large jump
  with no matching feature is a finding.

**11. Security in depth** (`SECURITY.md`)

- The CSP in `vite.config.ts` against what the built app actually loads: every
  script, style, font, image and connection it uses is allowed, nothing broader is.
- Untrusted input: the share link's `#setup=` code and every other value from outside
  the app goes through `src/domain/untrustedValues.ts`; read each caller and check it
  validates before use.
- `localStorage` is untrusted too: a hand-edited or corrupted value must fall back to
  defaults, never crash or reach the DOM unchecked.
- Workflows in `.github/workflows/`: the least `permissions:` each job needs, actions
  pinned to a full commit SHA, no secrets exposed to pull requests from forks.
- `SECURITY.md` describes all of the above as it is today.

## Weigh the findings

Keep a finding only when you can show it with `file:line` evidence and say what the
fix is. Drop anything the guards already enforce, anything tracked in an open issue
(link it instead), and anything that is a matter of taste. Order the rest by value:
a wrong requirement or a security gap first, duplication and naming last.

## File issues

One issue per real finding, at most about eight per run, highest value first; the rest
go in the report only. Before creating one, search the open issues for the file, the
module and the words of the finding so no duplicate is filed. Each issue has:

- A title in the form "area: what is wrong", and a body with the `file:line` evidence
  and the fix in one paragraph.
- Given/When/Then acceptance criteria for the finished state.
- For a refactor, the refactor rule block:

  > Regression tests for every interface this changes are written first and pass on
  > `main`; the same tests pass unchanged afterwards and the behaviour is identical.
  > Small PRs. The goal is _Clean Code_ (Robert C. Martin).

- The label(s) the repository already uses for that kind of work, and a note that it
  came from the "granska" review on the commit noted in "Before you start".

## Report

One reply in the thread where Morgan wrote "granska", in Swedish, short:

- The commit reviewed and the state of the fast checks.
- Every area, 1 to 11, named as fine (one line) or with its findings below.
- What was found, one line per finding with `file:line` and a link to its issue, or
  "ej ärende" with the reason for the ones left in the report only.
- Issues to close (area 6) and stale issues for Morgan to decide.

When nothing is found, the report is one or two lines saying so. The review never
pushes, opens a PR or merges; a fix starts as its own issue in its own thread.
