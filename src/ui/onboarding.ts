/**
 * First-run onboarding wizard (issue #43, reworked #184, design-reviewed
 * for #189 and again since): what Libell does, language/appearance/sound
 * preferences, which vehicle is being leveled, how to place the phone,
 * the vehicle measurements, the ramp model, calibration. Nothing has to be
 * done to go on: Next always advances, and whatever is left undone stays
 * flagged by the warning lamps, so the wizard guides without ever blocking.
 *
 * One path for zeroing (#365): neither path asks to zero the vehicle. A
 * first run is usually at home, not parked level, so both say the zero
 * happens the first time the user parks, and the lamp reminds until then.
 * Skip is only offered where Next would save something (measurements,
 * ramps); everywhere else Next is the one way on, and a step-specific note
 * says what leaving it undone means.
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
 * Calibration (#184): `calibrationSection.ts` is still the single source
 * of truth for the phone-calibration copy and behavior — the wizard shows
 * its `sensorElement`, never a wizard-only rebuild. The vehicle-zero step
 * a design review once split off is gone again (#365), see above.
 *
 * Sensor source choice (#135, ADR 0014): when an external sensor option
 * actually exists (`hasAvailableExternalSensor()` — the exact same gate
 * `main.ts` already uses before offering the "External sensor" page), a
 * step asks "This phone" vs. "external sensor" and branches the rest of
 * the wizard:
 *   - "This phone" (the default, and the only option when the gate is
 *     false): unchanged phone flow below.
 *   - external: connect, then installation offset (design review: split
 *     into two steps — see the two steps' own doc comment below), reusing
 *     `sensorSourceSection.ts`'s halves — the same "Set vehicle level"
 *     block #131 added to the real menu page, never a wizard-only
 *     duplicate — followed by the settings/dimensions and ramps steps.
 * `sensorChoice` starts at `'phone'`; the step list re-resolves against it
 * on every change on the source step, not just once when Next is pressed
 * (#189 follow-up — otherwise the "n / total" progress readout could
 * commit to a total that a later choice then falsified). Closing the
 * wizard (✕) before or during that step never *saves* anything, so an
 * unfinished choice always leaves the source exactly as it was (the
 * phone, `DEFAULT_SETTINGS.sensorSource`, on a first run), never an
 * ambiguous state. With a box already active, the phone path leaves out
 * the phone calibration steps (#287) — see `phoneSteps` below.
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
 * it; every step that can leave something undone carries a note saying
 * what that means, specific to the step (#365). `currentSettings` tracks the
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
 * modes). Only Back and Next (#365): Skip did exactly what Next does, since
 * the form shows the shipped defaults until changed.
 *
 * Ramps step (design review): the ready-made ramp model/custom
 * step-height picker and ramp count — reachable from Settings before, but
 * never from the wizard, even though it's what the ramp catalog and
 * per-wheel step guidance actually run on. Reuses the same
 * `createSettingsForm`'s 'ramps' compact mode as the measurements step
 * pattern: skippable, with a note that the default ramps stay in place.
 */
import type { LevelSettings, VehicleType } from '../domain/settings';
import { createSettingsForm } from './settingsPanel';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { createSensorSourceSection, type SensorSourceOptions } from './sensorSourceSection';
import {
  availableExternalSensors,
  hasAvailableExternalSensor,
  type ExternalSensorDescriptor,
} from '../sensor/externalSensors';
import {
  legendIllustration,
  measuresIllustration,
  placementIllustration,
} from './helpIllustrations';
import { SEVERITY_GLYPH } from './rvDiagram';
import { t, type MessageKey } from './i18n';

export interface OnboardingOptions extends CalibrationOptions, SensorSourceOptions {
  /**
   * The per-source options for each available external sensor (#272).
   * With more than one available the wizard offers them all rather than
   * silently picking one, so a user who owns the other box is not quietly
   * steered to the first. Optional: callers with a single source can leave
   * it out and the wizard uses this bag as it always did.
   */
  sensorOptionsFor?(sensor: ExternalSensorDescriptor): SensorSourceOptions;
  initialSettings: LevelSettings;
  onSettingsSaved(settings: LevelSettings): void;
  /**
   * Called whenever the wizard closes, either way — ✕ at any point, or
   * reaching the end. `done` distinguishes the two (design review,
   * follow-up): true only when every step was actually stepped through
   * to the end (whatever individual steps the user chose to skip along
   * the way), false for an early ✕. Both still count as "seen" for the
   * auto-launch gate (`hasSeenOnboarding`) — only `done` decides whether
   * "Show introduction" still reads as an unfinished first-run task
   * (green) or a plain re-launch (secondary), see `infoMenu.ts`.
   */
  onFinished(done: boolean, path: SensorChoice): void;
}

/** Which source the first step's radios currently have selected — 'phone'
 * until the user picks otherwise, so an unfinished/closed wizard always
 * resolves to the phone sensor (see the module doc comment above). */
export type SensorChoice = 'phone' | 'external';

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

/**
 * `skippable` is only set where Next saves a form (#365) — elsewhere Skip
 * did exactly what Next does. `note` says what leaving this step undone
 * means, specific to the step (#365; #189 had one generic note on every
 * step). `renderStep` puts it right above the nav buttons it explains,
 * not at the end of the (scrollable) body — see #239: there it was both
 * the first thing pushed out of view and three lines of the height budget.
 */
type Step = {
  title: string;
  build: () => Element[];
  skippable?: true;
  note?: () => string;
};

export function showOnboarding(options: OnboardingOptions): void {
  const isModern = options.initialSettings.appearance === 'modern';
  // Same gate `main.ts` uses before ever offering the "External sensor"
  // page (#116, widened by #220 to include the simulated box, and by #262
  // to ask the registry rather than one device) — never a dead radio
  // button on Safari/iOS or desktop.
  const sourceChoiceAvailable = hasAvailableExternalSensor();

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
  close.addEventListener('click', () => finish(false));

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
      if (!sourceChoiceAvailable) return [what, guide];
      // The box is not in Settings (#365): say where it lives.
      const sensor = document.createElement('p');
      sensor.className = guide.className;
      sensor.textContent = t('onboard.welcome.sensor');
      return [what, guide, sensor];
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

  // What leaving a step undone means (#189, made step-specific by #365).
  // Lives in the nav next to the buttons it explains, not at the end of
  // the step's body (#239): it reads as their caption, it stays visible
  // when a tall step's body scrolls, and it costs no body height.
  function stepNote(text: string): HTMLParagraphElement {
    const hint = document.createElement('p');
    hint.className = 'onboarding__skip-hint';
    hint.textContent = text;
    return hint;
  }

  const settingsStep: Step = {
    // 'help.settings.h' ("The measurements"), not 'menu.settings'
    // ("Settings") — #189 follow-up. This step only ever shows wheelbase/
    // track widths.
    title: t('help.settings.h'),
    skippable: true,
    note: () => t('onboard.note.measurements', { lamp: t('lamp.setup') }),
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
    ],
  };

  // A preference step — the shipped defaults are already a complete,
  // valid choice, so there is nothing to skip and no note (#365) — reused
  // by the three steps below (#189,
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
    ];
  }

  // Language alone (design review): the one field of the five that has to
  // resolve before the rest of the guide is even legible — none of the
  // other four share that reason to lead.
  const languageStep: Step = {
    title: t('settings.language'),
    build: () => buildCosmeticStep('language'),
  };

  // Theme + Appearance together (design review): one "how it looks"
  // decision, not two — Theme is a sub-choice of Appearance, not an
  // unrelated setting that happened to share a header with it.
  const appearanceStep: Step = {
    title: t('settings.appearance'),
    build: () => buildCosmeticStep('appearance'),
  };

  // Chime + Continuous audio guidance together (design review): one "what
  // it sounds like" decision.
  const soundStep: Step = {
    title: t('onboard.sound.h'),
    build: () => buildCosmeticStep('sound'),
  };

  // Ramp model/count (design review): what the ramp catalog and per-wheel
  // step guidance actually run on — arguably the thing that most sets
  // this app apart from a plain bubble-level or sensor-only competitor,
  // yet it never had a wizard step of its own before. Same "vehicle
  // setup" bucket as the measurements step: skippable, but skipping it
  // does leave the shipped default ramp model in place, which may not
  // match what the user actually owns — the note says so (#365).
  const rampsStep: Step = {
    title: t('settings.tab.ramps'),
    skippable: true,
    note: () => t('onboard.note.ramps'),
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
    ],
  };

  // The phone's own calibration only (#365): the vehicle zero needs the
  // vehicle parked level, which a first run at home rarely is, so it waits
  // for the first parking on both paths — said here, reminded by the lamp.
  // `calibrationSection.ts`'s real card, without Check/Clear: nothing to
  // check or clear on a first run, and Settings keeps them under More.
  const sensorCalibrationStep: Step = {
    title: t('calibration.sensor.h'),
    note: () => t('onboard.note.calibrate', { next: t('onboard.next'), lamp: t('lamp.calibrate') }),
    build: () => {
      const section = createCalibrationSection(options, 'wizard').sensorElement;
      // Inside the card, in its own text style: part of the same advice.
      const later = document.createElement('p');
      later.className = isModern ? 'calibration-card__body' : 'menu__text';
      later.textContent = t('onboard.zeroLater', { lamp: t('lamp.zero') });
      section.append(later);
      return [section];
    },
  };

  // External path's calibration equivalent (#135, ADR 0014): connect the
  // box, then check its position live (#317) — both the exact same
  // components the box's pages show, never a wizard-only rebuild, and both
  // skippable on the same terms as the phone's calibration steps, which
  // this pair stands in for.
  //
  // Connecting is asynchronous (a live Web Bluetooth device picker, then a
  // GATT connect), so it's possible to tap Next before it resolves. The
  // position step then says no box is connected yet and that Next goes on
  // (#365), and redraws itself if the connection lands while it is shown —
  // no guard, matching the wizard's "never block" rule (#189).
  /** One option bag per available source (#272). Falls back to this bag
   * alone when the caller supplies no per-source factory. */
  function sourceBags(): SensorSourceOptions[] {
    const perSource = options.sensorOptionsFor;
    if (!perSource) return [options];
    return availableExternalSensors().map((sensor) => perSource(sensor));
  }

  const connectStep: Step = {
    title: t('menu.sensorSource'),
    note: () => t('onboard.note.connect', { next: t('onboard.next') }),
    build: () => sourceBags().map((bag) => createSensorSourceSection(bag).connectElement),
  };

  // Only the box's position, live (#317, the #309 UX review): direction
  // and zero wait for the first parking — the zero needs level ground,
  // which a first run at home rarely has — where the box's own page guides
  // them and the amber lamp reminds until they are done.
  const boxPositionStep: Step = {
    title: t('onboard.boxPosition.h'),
    build: () => {
      const textClass = isModern ? 'onboarding__text--modern' : 'menu__text';
      const bags = sourceBags();
      const isActive = (bag: SensorSourceOptions) => bag.getSensorSource() === bag.sensor.id;
      const sections = bags.filter(isActive).map((bag) => createSensorSourceSection(bag));
      const later = document.createElement('p');
      later.className = textClass;
      later.textContent = t('onboard.boxPosition.later');
      if (sections.length === 0) {
        // No box connected (#365): say so, and that Next goes on. Should a
        // connection started on the previous step land while this is
        // shown, the step redraws with the live position.
        const notConnected = document.createElement('p');
        notConnected.className = textClass;
        notConnected.textContent = t('onboard.boxPosition.notConnected', {
          next: t('onboard.next'),
        });
        const wait = () => {
          if (!notConnected.isConnected) return;
          if (bags.some(isActive)) renderStep();
          else requestAnimationFrame(wait);
        };
        requestAnimationFrame(wait);
        return [notConnected, later];
      }
      // Live while the step is shown; stops once it is left.
      const tick = () => {
        if (!later.isConnected) return;
        for (const section of sections) section.refreshLive();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return [...sections.map((section) => section.positionElement), later];
    },
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
      // With a box already active (#287), say up front what the phone path
      // leaves out and where to switch — never switch from here (ADR 0014).
      const externalNote: HTMLElement[] = [];
      if (externalActive) {
        const note = document.createElement('p');
        note.className = isModern ? 'onboarding__text--modern' : 'menu__text';
        note.textContent = t('onboard.source.externalActive', {
          disconnect: t('sensorSource.disconnect'),
        });
        externalNote.push(note);
      }
      return [
        intro,
        ...externalNote,
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

  // External-sensor path (#285): the phone-placement step above is skipped
  // (the box, not the phone, is what must sit right), but its "how to read
  // the answer" half is still needed — shown on its own here.
  const readScreenStep: Step = {
    title: t('help.screen.h'),
    build: () => {
      if (isModern) return [buildModernLegend()];
      const legendText = document.createElement('p');
      legendText.className = 'menu__text';
      legendText.textContent = t('help.screen.t');
      return [legendIllustration(t('help.screen.h')), legendText];
    },
  };

  // An external sensor already active (#287): the wizard never switches
  // the source (✕ must leave it as it was, ADR 0014), and #285 disables
  // every phone-calibration action while a box is active — so the phone
  // path leaves the calibration step out rather than leading into a
  // screen where nothing can be pressed. The source step says so.
  const externalActive = options.getSensorSource() !== 'phone';
  const phoneSteps = externalActive
    ? [placementStep, settingsStep, rampsStep]
    : [placementStep, settingsStep, rampsStep, sensorCalibrationStep];
  const externalSteps = [connectStep, boxPositionStep, readScreenStep, settingsStep, rampsStep];

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

  function finish(done: boolean): void {
    overlay.remove();
    options.onFinished(done, sourceChoiceAvailable ? sensorChoice : 'phone');
  }

  function renderStep(): void {
    const step = steps[index];
    if (!step) {
      finish(true);
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

    // A calibration step embeds `calibrationSection.ts`'s real card, whose
    // own header is [heading, status pill] — and that heading is word for
    // word the step heading right above it. So the header row is folded
    // into the step heading (#239): the pill, the one thing the heading
    // does not say ("NOT DONE" / "DONE"), moves up beside it, and the
    // duplicate heading goes. Worth ~23 px, which is the difference
    // between this step fitting an iPhone SE screen and not. The pill is
    // still the same element `refreshCalibration` holds a reference to and
    // keeps up to date — only its place in the DOM changed. Settings'
    // own copy of the card, where no such outer heading exists, is
    // untouched.
    const cardHeader = body.querySelector('.calibration-card__header');
    if (cardHeader) {
      const pill = cardHeader.lastElementChild;
      if (pill && pill !== cardHeader.firstElementChild) heading.append(pill);
      cardHeader.remove();
    }
    // Classic builds the same card without that header wrapper — a bare
    // `h3.menu__heading` and no pill — so the duplicate is dropped by what
    // it says rather than by where it sits. Matching on the text is the
    // point, not a shortcut: it removes a heading only when the step
    // heading above already carries those exact words, whatever component
    // put it there and whatever the appearance calls it.
    for (const embedded of body.querySelectorAll('h3')) {
      if (embedded.textContent?.trim() === step.title.trim()) embedded.remove();
    }

    const nav = document.createElement('div');
    nav.className = isModern ? 'onboarding__nav onboarding__nav--modern' : 'onboarding__nav';
    // The note first, so it reads as a caption for the buttons right under
    // it (#239 — see stepNote above).
    if (step.note) nav.append(stepNote(step.note()));
    // Back and Skip share one row above Next (#239): stacked full width
    // they were three buttons and 174 px of a 553 px iPhone SE screen,
    // spent entirely on navigation. Side by side they are one 43 px row,
    // and Next keeps the full-width bottom edge — the same top-to-bottom
    // order (Back, Skip, Next) and the same "closest to the thumb wins"
    // rule as before, in Classic and Modern alike.
    const secondaryRow = document.createElement('div');
    secondaryRow.className = 'onboarding__nav-row';
    // Back (#189): a wrong tap on vehicle type or sensor source used to be
    // fixable only by finishing the wizard and correcting it in Settings,
    // or closing (✕) and restarting from step 1. Never shown on the first
    // step, matching Skip's own "not always present" convention.
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
      secondaryRow.append(back);
    }
    if (step.skippable) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = isModern
        ? 'menu__action menu__action--secondary onboarding__skip--modern'
        : 'menu__action menu__action--secondary';
      skip.textContent = t('onboard.skipStep');
      skip.addEventListener('click', () => {
        index += 1;
        renderStep();
      });
      secondaryRow.append(skip);
    }
    // Welcome has neither, and an empty row would still cost its gap.
    if (secondaryRow.childElementCount > 0) nav.append(secondaryRow);
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
