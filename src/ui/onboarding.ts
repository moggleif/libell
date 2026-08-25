/**
 * First-run onboarding wizard (issue #43, reworked #184, design-reviewed
 * for #189 and again since): what Libell does, language/appearance/sound
 * preferences, which vehicle is being leveled, how to place the phone,
 * the vehicle measurements, the ramp model, calibration. Every step but
 * welcome, sensor-source and vehicle-type can be skipped; whatever is
 * skipped stays flagged by the warning lamps, so the wizard guides
 * without ever blocking.
 *
 * Reuses the real settings form and calibration section for every
 * step's actual FIELDS and LOGIC — one source of truth, never a
 * wizard-only duplicate that can drift from the real thing (#184's whole
 * complaint about the pre-rework wizard). It does not reuse those
 * components' own persistent-state chrome (Save/Undo/Reset): a wizard
 * step and a settings page are different interaction models — linear
 * and disposable vs. persistent and revisitable — and stacking a
 * settings page's CRUD controls under the wizard's own Next/Skip/Back
 * just doubled the decisions a first-time user had to parse per screen.
 * `createSettingsForm`'s compact modes render no `actions` row; Next
 * alone submits the embedded form (see the nav handler below).
 *
 * Welcome step (design-review follow-up): the very first thing shown,
 * before any question or form — what Libell is for (reuses `about.text`)
 * and that the guide ahead is short and skippable. No prior step existed
 * before this that explained why the following questions matter.
 *
 * Vehicle type (#184): "What are you leveling?" (motorhome or caravan —
 * the same two choices and labels Settings uses), always asked once —
 * right after the sensor-source step when that one exists, otherwise
 * right after the language/appearance/sound steps. `vehicleChoice` starts
 * at whatever the stored settings already say (not hardcoded to
 * motorhome) and is read by every
 * later step: the placement and measurements illustrations pick the
 * matching shape (`helpIllustrations.ts`), and the measurements step is
 * built with `vehicleType` overridden to this choice so its field
 * labels/visibility (axle-to-jockey, hidden front track width, ...)
 * already match — see `settingsPanel.ts`'s existing vehicle-aware
 * relabeling, reused as-is.
 *
 * Calibration (#184, split into two steps on a design review):
 * `calibrationSection.ts` is still the single source of truth for both
 * halves' copy and behavior — Settings → Calibration and the wizard show
 * the exact same UI, never a wizard-only rebuild of either half. What
 * changed is pacing: the two concepts (sensor calibration, vehicle zero)
 * now get one wizard step each, `sensorElement`/`vehicleElement` from
 * `createCalibrationSection`, instead of both stacked under one heading
 * with up to seven buttons on screen at once. Splitting by step also
 * replaces the ordering hint a combined step needed ("do the sensor
 * first") — the steps are already in that order.
 *
 * Sensor source choice (#135, ADR 0014): when an external sensor option
 * actually exists (`isWebBluetoothSupported()` — the exact same gate
 * `menu.ts` already uses before offering the "External sensor" page), a
 * step asks "This phone" vs. "external sensor" and branches the rest of
 * the wizard:
 *   - "This phone" (the default, and the only option when the gate is
 *     false): unchanged phone flow below.
 *   - external: connect + installation calibration (reusing
 *     `sensorSourceSection.ts`'s component whole — the same "Set vehicle
 *     level" block #131 added to the real menu page, never a wizard-only
 *     duplicate) followed directly by the settings/dimensions step.
 * `sensorChoice` starts at `'phone'`; the step list re-resolves against it
 * on every change on the source step, not just once when Next is pressed
 * (#189 follow-up — otherwise the "n / total" progress readout could
 * commit to a total that a later choice then falsified). Closing the
 * wizard (✕) before or during that step never *saves* anything, so an
 * unfinished choice always leaves the app on the phone sensor (the
 * existing `DEFAULT_SETTINGS.sensorSource`), never an ambiguous state.
 *
 * Appearance (#110): whether this instance renders Classic or Modern
 * structure is decided once, up front, from `initialSettings.appearance`
 * — not re-evaluated while the wizard is open, even if the embedded
 * settings form (appearance/measurements/ramps steps) lets the user flip
 * the preset mid-flow. A fresh wizard picks up the new preset the next
 * time it opens, since `showOnboarding` is always called anew (see
 * `main.ts`).
 *
 * Usability pass for less tech-savvy users (#189: a persona like seniors
 * leveling their first motorhome): a "Back" button (from the second step
 * on) so a wrong tap doesn't require finishing the wizard or restarting
 * it; every skippable step that can leave a warning lamp (R11) lit pairs
 * its Skip control with a note saying so. `currentSettings` tracks the
 * wizard's own latest save (from either embedded form) so a Back visit
 * after Next auto-saved shows what was just entered, not the wizard's
 * original snapshot.
 *
 * Language / Appearance / Sound steps (#189 introduced these as one
 * combined "General" step; a later design review split it): three steps,
 * one per actual decision, not one step per what used to share a Settings
 * section header. Language stands alone — being able to read the rest of
 * the guide matters before anything else, a reason none of the other
 * fields share. Theme + Appearance is one "how it looks" decision; Chime
 * + Continuous audio guidance is one "what it sounds like" decision. All
 * three reuse the exact fields/handlers the full form's General section
 * has (`createSettingsForm`'s 'language'/'appearance'/'sound' compact
 * modes). Skippable (the shipped defaults are already a complete choice);
 * unlike the other skippable steps they get no warning-lamp hint, since
 * skipping any of them never lights one.
 *
 * Ramps step (design review): the ready-made ramp model/custom
 * step-height picker and ramp count — reachable from Settings before, but
 * never from the wizard, even though it's what the ramp catalog and
 * per-wheel step guidance actually run on. Reuses the same
 * `createSettingsForm`'s 'ramps' compact mode as the measurements step
 * pattern: skippable, with the warning-lamp consequence hint, since
 * skipping it leaves the shipped default ramp model in place.
 */
import type { LevelSettings, VehicleType } from '../domain/settings';
import { createSettingsForm } from './settingsPanel';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { createSensorSourceSection, type SensorSourceOptions } from './sensorSourceSection';
import { isWebBluetoothSupported } from '../sensor/easyLevelSensor';
import {
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';
import { SEVERITY_GLYPH } from './rvDiagram';
import { t, type MessageKey } from './i18n';

export interface OnboardingOptions extends CalibrationOptions, SensorSourceOptions {
  initialSettings: LevelSettings;
  onSettingsSaved(settings: LevelSettings): void;
  onFinished(): void;
}

/** Which source the first step's radios currently have selected — 'phone'
 * until the user picks otherwise, so an unfinished/closed wizard always
 * resolves to the phone sensor (see the module doc comment above). */
type SensorChoice = 'phone' | 'external';

// 'menu.sensorSource' ("External sensor") is reused verbatim for the
// external radio's label (screen-cleanup follow-up) — no separate
// "Libell Sensor" product name, which was never real and never will be.
const SOURCE_OPTIONS: [SensorChoice, MessageKey][] = [
  ['phone', 'onboard.source.phone'],
  ['external', 'menu.sensorSource'],
];

// Reuses 'vehicle.motorhome'/'vehicle.caravan' — the exact labels
// Settings already shows for this same choice (#184).
const VEHICLE_OPTIONS: [VehicleType, MessageKey][] = [
  ['motorhome', 'vehicle.motorhome'],
  ['caravan', 'vehicle.caravan'],
];

/** Modern legend rows: status color swatch, glyph, short text — the same
 * four severities the diagram itself uses (#110 originally shipped only
 * the first three; 'unserved' — the gray "ramps don't reach" wheel — was
 * missing here even though Classic's legend and the Help text both cover
 * it). */
const LEGEND_ROWS: [string, keyof typeof SEVERITY_GLYPH, MessageKey][] = [
  ['onboarding__legend-swatch--ok', 'none', 'onboard.legend.ok'],
  ['onboarding__legend-swatch--up', 'small', 'onboard.legend.up'],
  ['onboarding__legend-swatch--no', 'large', 'onboard.legend.no'],
  ['onboarding__legend-swatch--dim', 'unserved', 'onboard.legend.dim'],
];

function buildModernLegend(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'onboarding__legend';
  for (const [swatchClass, severity, textKey] of LEGEND_ROWS) {
    const row = document.createElement('div');
    row.className = 'onboarding__legend-row';

    const swatch = document.createElement('span');
    swatch.className = `onboarding__legend-swatch ${swatchClass}`;
    swatch.setAttribute('aria-hidden', 'true');
    swatch.textContent = SEVERITY_GLYPH[severity];

    const text = document.createElement('span');
    text.className = 'onboarding__legend-text';
    text.textContent = t(textKey);

    row.append(swatch, text);
    container.append(row);
  }
  return container;
}

/** Modern step indicator (#110): one 24×4px bar per step, the current
 * step's bar in `--level`, the rest in `--surface-sunken` — plus a visible
 * "n / total" text (#189), since the bars' only text equivalent used to be
 * an `aria-label`, unreadable to a sighted low-vision user at that size. */
function buildModernProgress(current: number, total: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'onboarding__progress-wrap';

  const bars = document.createElement('div');
  bars.className = 'onboarding__bars';
  bars.setAttribute('role', 'img');
  bars.setAttribute('aria-label', `${current + 1} / ${total}`);
  for (let i = 0; i < total; i += 1) {
    const bar = document.createElement('span');
    bar.className = i === current ? 'onboarding__bar onboarding__bar--active' : 'onboarding__bar';
    bars.append(bar);
  }

  const text = document.createElement('span');
  text.className = 'onboarding__bars-text';
  text.setAttribute('aria-hidden', 'true');
  text.textContent = `${current + 1} / ${total}`;

  wrap.append(bars, text);
  return wrap;
}

function buildClassicProgress(current: number, total: number): HTMLElement {
  const progress = document.createElement('p');
  progress.className = 'onboarding__progress';
  progress.textContent = `${current + 1} / ${total}`;
  return progress;
}

type Step = { title: string; build: () => Element[]; skipLabel?: string };

export function showOnboarding(options: OnboardingOptions): void {
  const isModern = options.initialSettings.appearance === 'modern';
  // Same gate `menu.ts` uses before ever offering the "External sensor"
  // page (#116) — never a dead radio button on Safari/iOS or desktop.
  const sourceChoiceAvailable = isWebBluetoothSupported();

  // Which vehicle every later step's imagery/labels are built for (#184)
  // — starts at whatever is already stored (not hardcoded to motorhome).
  // Every step after the vehicle step reads this live when it builds, so
  // closing the wizard before or during the vehicle step just leaves the
  // stored choice untouched — never an ambiguous state.
  let vehicleChoice: VehicleType = options.initialSettings.vehicleType;

  // The settings step's own source of truth for its form's starting values
  // (#189): updated every time that form saves, so a Back visit after
  // Next auto-saved (see settingsStep below) shows what was just entered,
  // not the stale snapshot the wizard opened with.
  let currentSettings: LevelSettings = options.initialSettings;

  const overlay = document.createElement('div');
  overlay.className = 'onboarding';

  const card = document.createElement('div');
  card.className = 'onboarding__card';
  overlay.append(card);

  // Always escapable: ✕ closes the wizard from any step. It can be
  // reopened any time from the "Show introduction" button at the top of
  // the "?" page's Help tab (screen-cleanup follow-up).
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'onboarding__close';
  close.setAttribute('aria-label', t('onboard.close'));
  close.textContent = '✕';
  close.addEventListener('click', () => finish());

  // What Libell is for, before any question or form (design-review
  // follow-up): the first-ever screen a new user sees used to be a
  // language/theme form, with no "why" ahead of the "how". Reuses
  // 'about.text' rather than separate welcome-only copy. Not skippable in
  // the warning-lamp sense — there's nothing to configure here, just Next.
  const welcomeStep: Step = {
    title: t('onboard.welcome.h'),
    build: () => {
      const what = document.createElement('p');
      what.className = isModern ? 'onboarding__text--modern' : 'menu__text';
      what.textContent = t('about.text');
      const guide = document.createElement('p');
      guide.className = isModern ? 'onboarding__text--modern' : 'menu__text';
      guide.textContent = t('onboard.welcome.t');
      return [what, guide];
    },
  };

  const placementStep: Step = {
    title: t('onboard.step1.h'),
    build: () => {
      const text = document.createElement('p');
      text.className = isModern ? 'onboarding__text--modern' : 'menu__text';
      text.textContent = t('help.what.t');
      if (isModern) {
        // How to read the answer (#71, restyled #110): color swatch
        // + glyph + short text per status, instead of the SVG legend.
        return [
          placementIllustration(t('onboard.step1.h'), vehicleChoice),
          text,
          buildModernLegend(),
        ];
      }
      // How to read the answer (#71): the same legend and caption as
      // the Help section — colors, glyphs and the bubble.
      const legendText = document.createElement('p');
      legendText.className = 'menu__text';
      legendText.textContent = t('help.screen.t');
      return [
        placementIllustration(t('onboard.step1.h'), vehicleChoice),
        text,
        legendIllustration(t('help.screen.h')),
        legendText,
      ];
    },
  };

  // A short, visible note that the compact steps below don't hide these
  // features from the app — they just aren't on this reduced screen
  // (#156); the full forms stay reachable from Settings afterward.
  function moreInMenuNote(): HTMLParagraphElement {
    const note = document.createElement('p');
    note.className = isModern ? 'onboarding__text--modern' : 'menu__text';
    note.textContent = t('onboard.moreInMenu');
    return note;
  }

  // A skippable step's consequence, spelled out (#189): "Skip" alone never
  // said what happens next — the warning lamp (R11) that stays lit is
  // documented in the requirements but was never shown to the user here.
  function skipConsequenceHint(): HTMLParagraphElement {
    const hint = document.createElement('p');
    // Same class as moreInMenuNote() (#189 follow-up) — Classic used to
    // borrow 'settings__hint' (0.8rem, a different component's style) here
    // while its neighboring note used 'menu__text' (0.9rem), so two grey
    // helper lines back-to-back on the same step rendered at different
    // sizes. Modern never had the mismatch since both already shared
    // 'onboarding__text--modern'.
    hint.className = isModern ? 'onboarding__text--modern' : 'menu__text';
    hint.textContent = t('onboard.skip.consequence');
    return hint;
  }

  const settingsStep: Step = {
    // 'help.settings.h' ("The measurements"), not 'menu.settings'
    // ("Settings") — #189 follow-up. This step only ever shows wheelbase/
    // track widths, but titling it "Settings" collided with the
    // moreInMenuNote() line right below it ("More options are available
    // later in Settings"), which points at the real, full Settings page —
    // same word, two different destinations, on the same screen.
    title: t('help.settings.h'),
    // Plain "Skip" (#189 follow-up), not "Skip — use defaults": skipping
    // this step does light a warning lamp (see skipConsequenceHint below),
    // same as Calibration/External sensor — "use defaults" is reserved for
    // the one step (General) that truly has no consequence.
    skipLabel: t('onboard.skipStep'),
    build: () => [
      // vehicleType is overridden to the vehicle step's choice (#184) so
      // this reduced form's field labels/visibility already match —
      // settingsPanel.ts's own vehicle-aware relabeling does the rest.
      measuresIllustration(t('help.settings.h'), vehicleChoice),
      createSettingsForm(
        // Built from currentSettings, not the static options.initialSettings
        // (#189): once Next has auto-saved this step (see the nav handler
        // below), a Back visit must show what was just entered, not the
        // wizard's original snapshot.
        { ...currentSettings, vehicleType: vehicleChoice },
        (settings) => {
          currentSettings = settings;
          options.onSettingsSaved(settings);
        },
        undefined,
        { compact: 'measurements' },
      ),
      moreInMenuNote(),
      skipConsequenceHint(),
    ],
  };

  // A skippable step with no real-world consequence — the shipped
  // defaults are already a complete, valid choice, so skipping never
  // lights a warning lamp (R11) — reused by the three steps below (#189,
  // split by a design review into one step per actual decision: was one
  // combined 'general' step covering all five fields just because they
  // used to share a Settings section header, not because they're one
  // decision). `onSave` always tracks `currentSettings`, same as the
  // measurements step, so a language change's immediate reload (unrelated
  // to Next; see settingsPanel.ts's own languageSelect handler) never
  // fights with a value saved seconds earlier here.
  function buildCosmeticStep(compact: 'language' | 'appearance' | 'sound'): Element[] {
    return [
      createSettingsForm(
        currentSettings,
        (settings) => {
          currentSettings = settings;
          options.onSettingsSaved(settings);
        },
        undefined,
        { compact },
      ),
      moreInMenuNote(),
    ];
  }

  // Language alone (design review): the one field of the five that has to
  // resolve before the rest of the guide is even legible — none of the
  // other four share that reason to lead.
  const languageStep: Step = {
    title: t('settings.language'),
    skipLabel: t('onboard.skipDefaults'),
    build: () => buildCosmeticStep('language'),
  };

  // Theme + Appearance together (design review): one "how it looks"
  // decision, not two — Theme is a sub-choice of Appearance, not an
  // unrelated setting that happened to share a header with it.
  const appearanceStep: Step = {
    title: t('settings.appearance'),
    skipLabel: t('onboard.skipDefaults'),
    build: () => buildCosmeticStep('appearance'),
  };

  // Chime + Continuous audio guidance together (design review): one "what
  // it sounds like" decision.
  const soundStep: Step = {
    title: t('onboard.sound.h'),
    skipLabel: t('onboard.skipDefaults'),
    build: () => buildCosmeticStep('sound'),
  };

  // Ramp model/count (design review): what the ramp catalog and per-wheel
  // step guidance actually run on — arguably the thing that most sets
  // this app apart from a plain bubble-level or sensor-only competitor,
  // yet it never had a wizard step of its own before. Same "vehicle
  // setup" bucket as the measurements step: skippable, but skipping it
  // does leave the shipped default ramp model in place, which may not
  // match what the user actually owns — plain "Skip", with the same
  // warning-lamp consequence hint measurements/calibration get.
  const rampsStep: Step = {
    title: t('settings.tab.ramps'),
    skipLabel: t('onboard.skipStep'),
    build: () => [
      createSettingsForm(
        currentSettings,
        (settings) => {
          currentSettings = settings;
          options.onSettingsSaved(settings);
        },
        undefined,
        { compact: 'ramps' },
      ),
      moreInMenuNote(),
      skipConsequenceHint(),
    ],
  };

  // Split into two steps (design review): was one step embedding both
  // calibration-card halves at once, up to seven buttons deep. Each half
  // is still `calibrationSection.ts`'s own real UI, unmodified — only the
  // wizard-level pacing changed, not the calibration UI itself. The step
  // order (sensor, then vehicle zero) already says which to do first, so
  // there's no separate ordering hint to write here the way the combined
  // step needed one.
  const sensorCalibrationStep: Step = {
    title: t('calibration.sensor.h'),
    skipLabel: t('onboard.skipStep'),
    build: () => [createCalibrationSection(options).sensorElement, skipConsequenceHint()],
  };

  const vehicleZeroStep: Step = {
    title: t('calibration.vehicle.h'),
    skipLabel: t('onboard.skipStep'),
    build: () => [createCalibrationSection(options).vehicleElement, skipConsequenceHint()],
  };

  // External path's calibration equivalent (#135, ADR 0014): the box's
  // own connect flow already ends in its "Set vehicle level" block (#131)
  // once connected, so a single embedded `sensorSourceSection` covers
  // both "connect sensor" and "installation calibration" — reused whole,
  // exactly as it already is on the real menu page, never split apart
  // into wizard-only duplicates. Skippable on the same terms as the
  // phone's calibration step above, which it stands in for.
  const connectStep: Step = {
    title: t('menu.sensorSource'),
    skipLabel: t('onboard.skipStep'),
    build: () => [createSensorSourceSection(options).element, skipConsequenceHint()],
  };

  // A labeled radio group for a single wizard choice — shared by the
  // sensor-source and vehicle-type steps below, each just its own value
  // type, options and change handler (#184).
  function buildChoiceGroup<T extends string>(
    name: string,
    choices: [T, MessageKey][],
    current: T,
    onChange: (value: T) => void,
  ): HTMLDivElement {
    const group = document.createElement('div');
    group.className = 'onboarding__source';
    for (const [value, labelKey] of choices) {
      const label = document.createElement('label');
      label.className = 'onboarding__source-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      // Themed like every other control in the app (.settings__checkbox
      // does the same) — plain radios default to the browser's own accent
      // color, off-brand and the one hex-free rule CLAUDE.md is strict
      // about (#189 follow-up).
      radio.className = 'onboarding__source-radio';
      radio.name = name;
      radio.value = value;
      radio.checked = current === value;
      radio.addEventListener('change', () => {
        if (radio.checked) onChange(value);
      });
      const text = document.createElement('span');
      text.textContent = t(labelKey);
      label.append(radio, text);
      group.append(label);
    }
    return group;
  }

  let sensorChoice: SensorChoice = 'phone';

  const sourceStep: Step = {
    title: t('onboard.source.h'),
    build: () => {
      const intro = document.createElement('p');
      intro.className = isModern ? 'onboarding__text--modern' : 'menu__text';
      intro.textContent = t('onboard.source.intro');
      return [
        intro,
        buildChoiceGroup('onboarding-source', SOURCE_OPTIONS, sensorChoice, (value) => {
          sensorChoice = value;
          // Re-resolve immediately, not just when Next is pressed (#189
          // follow-up): the "n / total" progress readout already commits to
          // a total on this very step (6 for the phone path, the default),
          // so picking "external" here must update it right away — a total
          // that only turns out to have been wrong once you've moved on is
          // worse than one that updates as you choose.
          steps = resolveSteps();
          renderStep();
        }),
      ];
    },
  };

  // "What are you leveling?" (#184) — always asked once, right after the
  // sensor-source step when it exists, otherwise first. Every later
  // step reads `vehicleChoice` (see its declaration above) to match.
  const vehicleStep: Step = {
    title: t('onboard.vehicle.h'),
    build: () => {
      const intro = document.createElement('p');
      intro.className = isModern ? 'onboarding__text--modern' : 'menu__text';
      intro.textContent = t('onboard.vehicle.intro');
      return [
        intro,
        buildChoiceGroup('onboarding-vehicle', VEHICLE_OPTIONS, vehicleChoice, (value) => {
          vehicleChoice = value;
        }),
      ];
    },
  };

  const phoneSteps = [
    placementStep,
    settingsStep,
    rampsStep,
    sensorCalibrationStep,
    vehicleZeroStep,
  ];
  const externalSteps = [connectStep, settingsStep, rampsStep];

  // welcomeStep, then languageStep/appearanceStep/soundStep, always lead
  // (#189, design review) — every branch below prepends all four. Depends
  // on `sensorChoice`, so it's re-run both up front and every time the
  // source-step radio changes (see sourceStep above) — the displayed step
  // count always matches the path the user has (currently) chosen, never
  // a stale guess from before they picked.
  function resolveSteps(): Step[] {
    const leading = [welcomeStep, languageStep, appearanceStep, soundStep];
    return sourceChoiceAvailable
      ? [
          ...leading,
          sourceStep,
          vehicleStep,
          ...(sensorChoice === 'external' ? externalSteps : phoneSteps),
        ]
      : [...leading, vehicleStep, ...phoneSteps];
  }

  let steps: Step[] = resolveSteps();

  let index = 0;

  function finish(): void {
    overlay.remove();
    options.onFinished();
  }

  function renderStep(): void {
    const step = steps[index];
    if (!step) {
      finish();
      return;
    }
    card.replaceChildren();

    const header = document.createElement('div');
    header.className = 'onboarding__header';
    const progress = isModern
      ? buildModernProgress(index, steps.length)
      : buildClassicProgress(index, steps.length);
    header.append(progress, close);

    const heading = document.createElement('h2');
    heading.className = isModern
      ? 'onboarding__title onboarding__title--modern'
      : 'onboarding__title';
    heading.tabIndex = -1;
    heading.textContent = step.title;

    const body = document.createElement('div');
    body.className = 'onboarding__body';
    body.append(...step.build());

    const nav = document.createElement('div');
    nav.className = isModern ? 'onboarding__nav onboarding__nav--modern' : 'onboarding__nav';
    // Back (#189): a wrong tap on vehicle type or sensor source used to be
    // fixable only by finishing the wizard and correcting it in Settings,
    // or closing (✕) and restarting from step 1. Always appended first, so
    // in both appearances' plain (non-reversed) column it ends up furthest
    // from the primary Next action at the true bottom edge — same order,
    // same "closest to the thumb wins" rule, in Classic and Modern alike.
    // Never shown on the first step, matching Skip's own "not always
    // present" convention.
    if (index > 0) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = isModern
        ? 'menu__action menu__action--secondary onboarding__back--modern'
        : 'menu__action menu__action--secondary';
      back.textContent = t('onboard.back');
      back.addEventListener('click', () => {
        index -= 1;
        renderStep();
      });
      nav.append(back);
    }
    if (step.skipLabel) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = isModern
        ? 'menu__action menu__action--secondary onboarding__skip--modern'
        : 'menu__action menu__action--secondary';
      skip.textContent = step.skipLabel;
      skip.addEventListener('click', () => {
        index += 1;
        renderStep();
      });
      nav.append(skip);
    }
    const next = document.createElement('button');
    next.type = 'button';
    next.className = isModern ? 'menu__action onboarding__next--modern' : 'menu__action';
    next.textContent = index === steps.length - 1 ? t('onboard.done') : t('onboard.next');
    next.addEventListener('click', () => {
      // Leaving a step with its own embedded settings form (measurements,
      // language, appearance, sound, ramps): its own Save/Undo/Reset row
      // isn't mounted here at all (design review — see the file header
      // comment), so Next is the only thing that persists it. Dispatching
      // submit directly reuses the form's real save path (validation, the
      // vehicle full-object merge, etc.) rather than re-deriving it here.
      // No step-identity check needed — only these steps' body ever
      // contains a <form> at all (calibration/connect never do), and the
      // optional chaining below is already a no-op otherwise. #159's
      // separate guard — that submitting this form directly, e.g. by
      // pressing Enter in a field, never itself advances or closes the
      // wizard — is unrelated and unaffected: only this Next click both
      // submits and advances.
      body.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
      index += 1;
      renderStep();
    });
    nav.append(next);

    card.append(header, heading, body, nav);
    heading.focus();
  }

  document.body.append(overlay);
  renderStep();
}
