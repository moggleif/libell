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

/** Modern legend rows (#110): status color swatch, glyph, short text —
 * same three severities the diagram itself uses. */
const LEGEND_ROWS: [string, keyof typeof SEVERITY_GLYPH, MessageKey][] = [
  ['onboarding__legend-swatch--ok', 'none', 'onboard.legend.ok'],
  ['onboarding__legend-swatch--up', 'small', 'onboard.legend.up'],
  ['onboarding__legend-swatch--no', 'large', 'onboard.legend.no'],
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
 * step's bar in `--level`, the rest in `--surface-sunken`. */
function buildModernProgress(current: number, total: number): HTMLElement {
  const bars = document.createElement('div');
  bars.className = 'onboarding__bars';
  bars.setAttribute('role', 'img');
  bars.setAttribute('aria-label', `${current + 1} / ${total}`);
  for (let i = 0; i < total; i += 1) {
    const bar = document.createElement('span');
    bar.className = i === current ? 'onboarding__bar onboarding__bar--active' : 'onboarding__bar';
    bars.append(bar);
  }
  return bars;
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

  // Discoverability mention (#154), alongside the legend on step 1 — the
  // only place a first-run user is guaranteed to see it, without turning
  // "Continuous audio guidance" on by default (it stays a deliberate
  // opt-in, unlike the shorter "Chime when level", #153).
  function audioGuidanceHint(): HTMLParagraphElement {
    const hint = document.createElement('p');
    hint.className = isModern ? 'onboarding__text--modern' : 'settings__hint';
    hint.textContent = t('onboard.audioGuidance.hint');
    return hint;
  }

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
          audioGuidanceHint(),
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
        audioGuidanceHint(),
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

  const settingsStep: Step = {
    title: t('menu.settings'),
    skipLabel: t('onboard.skipDefaults'),
    build: () => [
      // vehicleType is overridden to the vehicle step's choice (#184) so
      // this reduced form's field labels/visibility already match —
      // settingsPanel.ts's own vehicle-aware relabeling does the rest.
      measuresIllustration(t('menu.settings'), vehicleChoice),
      createSettingsForm(
        { ...options.initialSettings, vehicleType: vehicleChoice },
        options.onSettingsSaved,
        undefined,
        { compact: true },
      ),
      moreInMenuNote(),
    ],
  };

  // Embeds the exact same calibration UI Settings → Calibration shows —
  // no reduced rendering of its own (#184; used to look visibly older
  // than the real Modern two-card design, #109).
  const calibrationStep: Step = {
    title: t('menu.calibration'),
    skipLabel: t('onboard.skipStep'),
    build: () => [createCalibrationSection(options).element],
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
    build: () => [createSensorSourceSection(options).element],
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

  let steps: Step[] = sourceChoiceAvailable
    ? [sourceStep, vehicleStep, ...phoneSteps]
    : [vehicleStep, ...phoneSteps];

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
      // Leaving the source step: branch the rest of the wizard onto the
      // chosen path — read once, here, never re-evaluated afterward.
      if (step === sourceStep) {
        steps = [
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
