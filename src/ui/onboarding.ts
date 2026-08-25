/**
 * First-run onboarding wizard (issue #43, reworked #184): how to place
 * the phone, which vehicle is being leveled, the vehicle measurements,
 * calibration. Every step but the sensor-source and vehicle-type ones
 * can be skipped; whatever is skipped stays flagged by the warning
 * lamps, so the wizard guides without ever blocking. Reuses the real
 * settings form, calibration section and illustrations — one source of
 * truth, never a wizard-only duplicate that can drift from the real
 * thing (#184's whole complaint about the pre-rework wizard).
 *
 * Vehicle type (#184): a new step, "What are you leveling?" (motorhome
 * or caravan — the same two choices and labels Settings uses), always
 * shown once — right after the sensor-source step when that one exists,
 * otherwise first. `vehicleChoice` starts at whatever the stored settings
 * already say (not hardcoded to motorhome) and is read by every later
 * step: the placement and measurements illustrations pick the matching
 * shape (`helpIllustrations.ts`), and the measurements step is built with
 * `vehicleType` overridden to this choice so its field labels/visibility
 * (axle-to-jockey, hidden front track width, ...) already match — see
 * `settingsPanel.ts`'s existing vehicle-aware relabeling, reused as-is.
 *
 * Calibration (#184): embeds `createCalibrationSection` whole, exactly as
 * Settings → Calibration does — no more reduced/compact rendering of its
 * own, which used to look visibly older than the real Modern two-card
 * design (#109) it stood in for. "Use the same" is the point: one
 * calibration UI, not two that can drift apart.
 *
 * Sensor source choice (#135, ADR 0014): when an external sensor option
 * actually exists (`isWebBluetoothSupported()` — the exact same gate
 * `menu.ts` already uses before offering the "External sensor" page), a
 * new first step asks "This phone" vs. "external sensor" and branches
 * the rest of the wizard:
 *   - "This phone" (the default, and the only option when the gate is
 *     false): unchanged phone flow below.
 *   - external: connect + installation calibration (reusing
 *     `sensorSourceSection.ts`'s component whole — the same "Set vehicle
 *     level" block #131 added to the real menu page, never a wizard-only
 *     duplicate) followed directly by the settings/dimensions step.
 * `sensorChoice` starts at `'phone'` and is only read once, when Next is
 * pressed from the source step — closing the wizard (✕) before or during
 * that step never sets anything, so an unfinished choice always leaves
 * the app on the phone sensor (the existing `DEFAULT_SETTINGS.sensorSource`),
 * never an ambiguous state.
 *
 * Appearance (#110): whether this instance renders Classic or Modern
 * structure is decided once, up front, from `initialSettings.appearance`
 * — not re-evaluated while the wizard is open, even if the embedded
 * settings form (step 2) lets the user flip the preset mid-flow. A
 * fresh wizard picks up the new preset the next time it opens, since
 * `showOnboarding` is always called anew (see `main.ts`).
 *
 * Usability pass for less tech-savvy users (#189, a devil's-advocate
 * review focused on personas like seniors leveling their first
 * motorhome): a "Back" button (only from the second step on) so a wrong
 * tap doesn't require finishing the wizard or restarting it; the
 * measurements/general steps' Next now also saves their form before
 * advancing (previously Next and a form's own Save were fully
 * independent, by design for #159 — that guard, that Save itself never
 * advances or closes the wizard, is unchanged, only Next now also
 * saves); every skippable step that can leave a warning lamp (R11) lit
 * pairs its Skip control with a note saying so; and the calibration step
 * gets a one-line steer on which of its two concepts (sensor calibration
 * vs. vehicle zero) to actually do first. `currentSettings` tracks the
 * wizard's own latest save (from either form) so a Back visit after Next
 * auto-saved shows what was just entered, not the wizard's original
 * snapshot.
 *
 * General step (#189, at the user's own suggestion): a new first step —
 * Language, Theme, Chime, Continuous audio guidance, the exact fields
 * `createSettingsForm`'s new 'general' compact mode reuses from the full
 * form's General section — always shown, right before everything else,
 * since being able to read the rest of the guide matters before any of
 * it. Skippable (the shipped defaults are already a complete choice);
 * unlike the other skippable steps it gets no warning-lamp hint, since
 * skipping it never lights one.
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
    hint.className = isModern ? 'onboarding__text--modern' : 'settings__hint';
    hint.textContent = t('onboard.skip.consequence');
    return hint;
  }

  const settingsStep: Step = {
    title: t('menu.settings'),
    skipLabel: t('onboard.skipDefaults'),
    build: () => [
      // vehicleType is overridden to the vehicle step's choice (#184) so
      // this reduced form's field labels/visibility already match —
      // settingsPanel.ts's own vehicle-aware relabeling does the rest.
      measuresIllustration(t('menu.settings'), vehicleChoice),
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

  // Language, Theme, Chime, Continuous audio guidance (#189, at the
  // user's suggestion): the same General section fields the full
  // Settings form has (`createSettingsForm`'s 'general' compact mode),
  // not a wizard-only reimplementation. Always the very first step —
  // knowing the app is legible matters before anything else — and reads
  // `currentSettings` like the measurements step, so a language change's
  // immediate reload (unrelated to Next/Save; see settingsPanel.ts's own
  // languageSelect handler) never fights with a value saved seconds
  // earlier here. No skip-consequence hint: unlike measurements/
  // calibration, skipping this step leaves no warning lamp (R11) lit —
  // the shipped defaults are already a complete, valid choice.
  const generalStep: Step = {
    title: t('settings.general'),
    skipLabel: t('onboard.skipDefaults'),
    build: () => [
      createSettingsForm(
        currentSettings,
        (settings) => {
          currentSettings = settings;
          options.onSettingsSaved(settings);
        },
        undefined,
        { compact: 'general' },
      ),
      moreInMenuNote(),
    ],
  };

  // What to actually do first (#189): the embedded section below packs two
  // distinct concepts (sensor calibration, vehicle zero) and a two-capture
  // flip technique into one step with no priority order — a first-time
  // user got no steer on which button matters. This one-line hint doesn't
  // duplicate calibrationSection.ts's own copy, just orders it.
  function calibrationGuidanceHint(): HTMLParagraphElement {
    const hint = document.createElement('p');
    hint.className = isModern ? 'onboarding__text--modern' : 'menu__text';
    hint.textContent = t('onboard.calibration.hint');
    return hint;
  }

  // Embeds the exact same calibration UI Settings → Calibration shows —
  // no reduced rendering of its own (#184; used to look visibly older
  // than the real Modern two-card design, #109).
  const calibrationStep: Step = {
    title: t('menu.calibration'),
    skipLabel: t('onboard.skipStep'),
    build: () => [
      calibrationGuidanceHint(),
      createCalibrationSection(options).element,
      skipConsequenceHint(),
    ],
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

  const phoneSteps = [placementStep, settingsStep, calibrationStep];
  const externalSteps = [connectStep, settingsStep];

  // generalStep always leads (#189) — every branch below prepends it.
  let steps: Step[] = sourceChoiceAvailable
    ? [generalStep, sourceStep, vehicleStep, ...phoneSteps]
    : [generalStep, vehicleStep, ...phoneSteps];

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
    // or closing (✕) and restarting from step 1. Always appended first —
    // in Classic's plain column that puts it furthest from the primary
    // Next action at the bottom; in Modern's column-reverse nav (see the
    // CSS) that puts it last/least prominent instead, below Skip. Never
    // shown on the first step, matching Skip's own "not always present"
    // convention.
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
      // Leaving a step with its own embedded form — settings (measurements)
      // or general (#189): Next used to be fully independent of the
      // embedded form's own Save button (a deliberate choice for #159, so
      // that Save's normal "return to main screen" behavior never fired
      // inside the wizard) — but that meant a user who typed measurements
      // or flipped a General toggle and tapped Next, the near-universal
      // wizard convention, lost it silently. Submitting the form here
      // saves whatever is currently in it without changing what Save
      // itself does when pressed directly (#159's guard is untouched).
      if (step === settingsStep || step === generalStep) {
        body.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
      }
      // Leaving the source step: branch the rest of the wizard onto the
      // chosen path — read once, here, never re-evaluated afterward.
      if (step === sourceStep) {
        steps = [
          generalStep,
          sourceStep,
          vehicleStep,
          ...(sensorChoice === 'external' ? externalSteps : phoneSteps),
        ];
      }
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
