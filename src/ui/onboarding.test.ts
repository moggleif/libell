// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { showOnboarding, type OnboardingOptions } from './onboarding';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import { setLanguage, t } from './i18n';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import type { Calibration } from '../domain/calibration';

setLanguage('en');

// Module-scoped, not per-describe (a per-test mutation whose cleanup ran as
// the test's own last line used to leak into every later test whenever an
// assertion above it threw first, skipping that cleanup line): every test
// that touches `navigator` restores from the same afterEach, regardless of
// how the test itself ends.
const originalNavigator = globalThis.navigator;

function withoutBluetooth(): void {
  Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
}

function withBluetooth(): void {
  Object.defineProperty(globalThis, 'navigator', {
    value: { bluetooth: {} },
    configurable: true,
  });
}

afterEach(() => {
  document.body.replaceChildren();
  Object.defineProperty(globalThis, 'navigator', {
    value: originalNavigator,
    configurable: true,
  });
});

function makeOptions(overrides: Partial<OnboardingOptions> = {}): OnboardingOptions {
  const initialSettings = overrides.initialSettings ?? DEFAULT_SETTINGS;
  return {
    initialSettings,
    // Real callers (main.ts) always derive both from the same
    // `settings` object — keep the fixture honest about that instead
    // of letting the two drift apart in tests.
    appearance: initialSettings.appearance,
    onSettingsSaved: () => {},
    onFinished: () => {},
    getCalibration: () => null,
    calibrate: () => null,
    readTilt: () => ({ rollDeg: 0, pitchDeg: 0 }),
    applyCalibration: () => {},
    clearCalibration: () => {},
    getVehicleCalibration: () => null,
    calibrateVehicle: () => null,
    clearVehicleCalibration: () => {},
    getCalibrationCapturedAt: () => null,
    getVehicleCalibrationCapturedAt: () => null,
    checkCalibration: () => 'checked',
    checkVehicleCalibration: () => 'checked',
    // SensorSourceOptions (#135) — same fixture values menu.test.ts uses,
    // since main.ts wires both from the same set of real callbacks.
    sensor: EASYLEVEL_DESCRIPTOR,
    getSensorSource: () => 'phone',
    getSensorState: () => 'idle',
    connectSensor: () => Promise.resolve('unsupported'),
    disconnectSensor: () => {},
    getInstallCalibration: () => null,
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    clearInstallCalibration: () => {},
    getMounting: () => 'standard',
    isMountingPicked: () => false,
    setMounting: () => {},
    ...overrides,
  };
}

function modernSettings(): LevelSettings {
  return { ...DEFAULT_SETTINGS, appearance: 'modern' };
}

function classicSettings(): LevelSettings {
  return { ...DEFAULT_SETTINGS, appearance: 'classic' };
}

function card(): HTMLElement {
  return document.querySelector('.onboarding__card')!;
}

function next(): void {
  const buttons = [...card().querySelectorAll('button')];
  const nextButton = buttons.find(
    (b) => b.textContent === t('onboard.next') || b.textContent === t('onboard.done'),
  )!;
  nextButton.click();
}

function back(): void {
  const buttons = [...card().querySelectorAll('button')];
  const backButton = buttons.find((b) => b.textContent === t('onboard.back'))!;
  backButton.click();
}

// Welcome, Language, Appearance and Sound (#189, split by a later design
// review) are always the first four steps now — most tests below are
// about whatever used to be the first step (vehicle, or source with Web
// Bluetooth). `open` shows the wizard and skips past all four once, so
// every subsequent next()-call sequence in this file reads exactly as it
// did before any of them existed.
function open(overrides: Partial<OnboardingOptions> = {}): void {
  showOnboarding(makeOptions(overrides));
  next(); // welcome -> language
  next(); // language -> appearance
  next(); // appearance -> sound
  next(); // sound -> vehicle (or source)
}

function pickVehicle(value: 'motorhome' | 'caravan'): void {
  const radio = card().querySelector<HTMLInputElement>(
    `input[name="onboarding-vehicle"][value="${value}"]`,
  )!;
  radio.checked = true;
  radio.dispatchEvent(new Event('change'));
}

describe('onboarding wizard — welcome step (design review)', () => {
  it('is the very first step, explaining what Libell is for before any question or form', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.welcome.h'));
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('1 / 9');
    expect(card().textContent).toContain(t('about.text'));
    expect(card().textContent).toContain(t('onboard.welcome.t'));
    // Nothing to configure here — no form fields, no Skip control.
    expect(card().querySelector('input, select')).toBeNull();
    expect(card().textContent).not.toContain(t('onboard.skipStep'));
  });

  it('points to the sensor icon for the box only where an external sensor is an option (#365)', () => {
    withoutBluetooth();
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().textContent).not.toContain(t('onboard.welcome.sensor'));
    document.body.replaceChildren();
    withBluetooth();
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().textContent).toContain(t('onboard.welcome.sensor'));
  });

  it('has no Back button — it is the first step', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().textContent).not.toContain(t('onboard.back'));
  });

  it('Next advances straight to the language step', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    next();
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('settings.language'));
  });
});

describe('onboarding wizard — language/appearance/sound steps (#189, split by a design review)', () => {
  it('language: just the Language select, Back and Next only (#365), no Skip', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    next(); // welcome -> language
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('settings.language'));
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 9');
    expect(card().querySelectorAll('select')).toHaveLength(1);
    expect(card().querySelector('input[type="checkbox"]')).toBeNull();
    expect(card().textContent).toContain(t('onboard.back'));
    expect(
      [...card().querySelectorAll('button')].some((b) => b.textContent === t('onboard.skipStep')),
    ).toBe(false);
  });

  it('appearance: Theme + Appearance selects, nothing else', () => {
    open({ initialSettings: classicSettings() });
    back(); // vehicle -> sound
    back(); // sound -> appearance
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('settings.appearance'));
    expect(card().querySelectorAll('select')).toHaveLength(2);
    expect(card().querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('sound: Chime + Continuous audio guidance checkboxes, nothing else', () => {
    open({ initialSettings: classicSettings() });
    back(); // vehicle -> sound
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.sound.h'));
    expect(card().querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(card().querySelector('select')).toBeNull();
  });

  it('none of the three has Skip or a note (#365), and none render a Save/Undo/Reset row', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    for (const title of [t('settings.language'), t('settings.appearance'), t('onboard.sound.h')]) {
      next();
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(title);
      expect(card().querySelector('.onboarding__skip-hint')).toBeNull();
      const buttonTexts = [...card().querySelectorAll('button')].map((b) => b.textContent);
      expect(buttonTexts).not.toContain(t('onboard.skipStep'));
      expect(buttonTexts).not.toContain(t('settings.undo'));
      expect(buttonTexts).not.toContain(t('settings.resetAll'));
    }
  });

  it('Next saves a changed toggle before advancing, same as the measurements step', () => {
    let saved: LevelSettings | null = null;
    showOnboarding(
      makeOptions({ initialSettings: classicSettings(), onSettingsSaved: (s) => (saved = s) }),
    );
    next(); // welcome -> language
    next(); // -> appearance
    next(); // -> sound
    const chime = card().querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const flipped = !chime.checked;
    chime.checked = flipped;
    chime.dispatchEvent(new Event('input'));
    next(); // sound -> vehicle; must save first
    expect(saved).not.toBeNull();
    expect(saved!.soundOnLevel).toBe(flipped);
  });
});

describe('onboarding wizard — Classic (no Web Bluetooth): vehicle, placement, settings, ramps, calibration', () => {
  it('shows the "n / total" text progress, not bars, and lands on the vehicle step right after Sound', () => {
    open({ initialSettings: classicSettings() });
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.vehicle.h'));
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('5 / 9');
    expect(card().querySelector('.onboarding__bars')).toBeNull();
  });

  it('the vehicle step offers Motorhome/Caravan, motorhome pre-selected by default', () => {
    open({ initialSettings: classicSettings() });
    const radios = [
      ...card().querySelectorAll<HTMLInputElement>('input[name="onboarding-vehicle"]'),
    ];
    expect(radios.map((r) => r.value)).toEqual(['motorhome', 'caravan']);
    expect(radios[0]!.checked).toBe(true);
    expect(radios[1]!.checked).toBe(false);
  });

  it('pre-selects whatever vehicle type is already stored, not always motorhome', () => {
    open({ initialSettings: { ...classicSettings(), vehicleType: 'caravan' } });
    const radios = [
      ...card().querySelectorAll<HTMLInputElement>('input[name="onboarding-vehicle"]'),
    ];
    expect(radios[1]!.checked).toBe(true);
  });

  it('renders the SVG legend illustration and caption on the placement step, not legend rows', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    expect(card().querySelector('.illu')).not.toBeNull();
    expect(card().textContent).toContain(t('help.screen.t'));
    expect(card().querySelector('.onboarding__legend')).toBeNull();
  });

  it('does not add any modern modifier classes', () => {
    open({ initialSettings: classicSettings() });
    expect(card().querySelector('.onboarding__title--modern')).toBeNull();
    expect(card().querySelector('.onboarding__next--modern')).toBeNull();
    expect(card().querySelector('.onboarding__nav--modern')).toBeNull();
  });

  it('advances through all nine steps and finishes on the last step’s button', () => {
    let finished = false;
    showOnboarding(
      makeOptions({ initialSettings: classicSettings(), onFinished: () => (finished = true) }),
    );
    const titles = [
      t('settings.language'),
      t('settings.appearance'),
      t('onboard.sound.h'),
      t('onboard.vehicle.h'),
      t('onboard.step1.h'),
      t('help.settings.h'),
      t('settings.tab.ramps'),
      t('calibration.sensor.h'),
    ];
    titles.forEach((title, i) => {
      next();
      expect(card().querySelector('.onboarding__title')?.textContent).toContain(title);
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe(`${i + 2} / 9`);
    });
    next(); // "Done" on the last step
    expect(finished).toBe(true);
  });

  // Design review, follow-up: `onFinished`'s argument distinguishes an
  // early ✕ from reaching the end — "Show introduction" (infoMenu.ts)
  // uses it to decide whether it still reads as an unfinished first-run
  // task or a plain re-launch.
  it('onFinished(true) once the last step is reached', () => {
    let done: boolean | undefined;
    showOnboarding(
      makeOptions({ initialSettings: classicSettings(), onFinished: (d) => (done = d) }),
    );
    for (let i = 0; i < 9; i += 1) next();
    expect(done).toBe(true);
  });

  it('the ✕ close button finishes immediately from any step, with onFinished(false)', () => {
    let finished = false;
    let done: boolean | undefined;
    showOnboarding(
      makeOptions({
        initialSettings: classicSettings(),
        onFinished: (d) => ((finished = true), (done = d)),
      }),
    );
    card().querySelector<HTMLButtonElement>('.onboarding__close')!.click();
    expect(finished).toBe(true);
    expect(done).toBe(false);
  });
});

describe('onboarding wizard — vehicle type shapes the rest of the guide (#184)', () => {
  it('picking Caravan and advancing shows the caravan placement illustration, not the motorhome one', () => {
    open({ initialSettings: classicSettings() });
    pickVehicle('caravan');
    next(); // vehicle -> placement
    expect(card().querySelector('.illu__drawbar')).not.toBeNull();
  });

  it('leaving Motorhome selected shows the motorhome placement illustration (no drawbar)', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement (motorhome stays checked)
    expect(card().querySelector('.illu__drawbar')).toBeNull();
  });

  it("a caravan choice relabels the settings step's wheelbase field and hides front track width", () => {
    open({ initialSettings: classicSettings() });
    pickVehicle('caravan');
    next(); // vehicle -> placement
    next(); // placement -> settings
    expect(card().textContent).toContain(t('settings.axleToJockey'));
    const frontTrack = card().querySelector('input[name="trackWidthFrontMm"]')?.closest('label');
    expect(frontTrack?.hidden).toBe(true);
  });

  it('saving from the settings step persists the chosen vehicle type, even though there is no select on this reduced step', () => {
    let saved: LevelSettings | null = null;
    open({
      initialSettings: classicSettings(),
      onSettingsSaved: (s) => (saved = s),
    });
    expect(card().querySelector('select')).toBeNull();
    pickVehicle('caravan');
    next(); // vehicle -> placement
    next(); // placement -> settings
    expect(card().querySelector('select')).toBeNull();
    const form = card().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(saved).not.toBeNull();
    expect(saved!.vehicleType).toBe('caravan');
  });

  it('hides ramp count on the ramps step for a caravan — it ramps one wheel', () => {
    open({ initialSettings: classicSettings() });
    pickVehicle('caravan');
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> ramps
    const rampCountLabel = [...card().querySelectorAll('label')].find((l) =>
      l.textContent?.includes(t('settings.rampCount')),
    );
    expect(rampCountLabel?.hidden).toBe(true);
  });
});

describe('onboarding wizard — the vehicle choice survives a skipped measurements step (#397)', () => {
  function skip(): void {
    const buttons = [...card().querySelectorAll('button')];
    buttons.find((b) => b.textContent === t('onboard.skipStep'))!.click();
  }

  function rampCountLabel(): HTMLLabelElement | undefined {
    return [...card().querySelectorAll('label')].find((l) =>
      l.textContent?.includes(t('settings.rampCount')),
    );
  }

  it("a caravan's ramps step hides the ramp count even when measurements was skipped", () => {
    open({ initialSettings: classicSettings() });
    pickVehicle('caravan');
    next(); // vehicle -> placement
    next(); // placement -> measurements
    skip(); // measurements -> ramps
    expect(rampCountLabel()?.hidden).toBe(true);
  });

  it("the ramps step's Next saves the picked vehicle type, not the stored one", () => {
    const saved: LevelSettings[] = [];
    open({ initialSettings: classicSettings(), onSettingsSaved: (s) => saved.push(s) });
    saved.length = 0; // the preference steps' own saves
    pickVehicle('caravan');
    next(); // vehicle -> placement
    next(); // placement -> measurements
    skip(); // measurements -> ramps
    next(); // ramps -> calibration
    expect(saved.map((s) => s.vehicleType)).toEqual(['caravan']);
  });

  it('finishing with both forms skipped still stores the picked vehicle type', () => {
    let saved: LevelSettings | null = null;
    open({ initialSettings: classicSettings(), onSettingsSaved: (s) => (saved = s) });
    pickVehicle('caravan');
    next(); // vehicle -> placement
    next(); // placement -> measurements
    skip(); // measurements -> ramps
    skip(); // ramps -> calibration
    next(); // calibration -> done
    expect(document.querySelector('.onboarding')).toBeNull();
    expect(saved!.vehicleType).toBe('caravan');
  });

  it('finishing without changing the vehicle saves nothing extra', () => {
    const saved: LevelSettings[] = [];
    open({ initialSettings: classicSettings(), onSettingsSaved: (s) => saved.push(s) });
    saved.length = 0; // the preference steps' own saves
    next(); // vehicle -> placement
    next(); // placement -> measurements
    skip(); // measurements -> ramps
    skip(); // ramps -> calibration
    next(); // calibration -> done
    expect(saved).toEqual([]);
  });
});

describe('onboarding wizard — ramps step (design review): the ramp catalog/count, never in the wizard before', () => {
  it('shows the ready-made ramp picker and ramp count, with the default catalog steps pre-filled', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> ramps
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('settings.tab.ramps'));
    expect(card().textContent).toContain(t('settings.rampHint'));
    expect(card().textContent).toContain(t('settings.ramp'));
    expect(card().textContent).toContain(t('settings.rampCount'));
    // DEFAULT_SETTINGS.rampStepHeightsMm is the 3-step Thule Levelers set.
    expect(card().querySelectorAll('.steps__chip')).toHaveLength(3);
  });

  it('is the classic-style single-select picker even in Modern appearance, not the brand-filtered catalog grid', () => {
    open({ initialSettings: modernSettings() });
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> ramps
    expect(card().querySelector('.klossar__filter')).toBeNull();
    expect(card().querySelector('.klossar__list')).toBeNull();
    expect(card().querySelectorAll('.steps__chip')).toHaveLength(3);
  });

  it('is skippable, with a note that the default ramps stay in place (#365)', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> ramps
    expect(
      [...card().querySelectorAll('button')].some((b) => b.textContent === t('onboard.skipStep')),
    ).toBe(true);
    expect(card().querySelector('.onboarding__skip-hint')?.textContent).toBe(
      t('onboard.note.ramps'),
    );
  });

  it('shows no Save/Undo/Reset row — Next is the only way to persist a changed ramp count', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> ramps
    const buttonTexts = [...card().querySelectorAll('button')].map((b) => b.textContent);
    expect(buttonTexts).not.toContain(t('settings.undo'));
    expect(buttonTexts).not.toContain(t('settings.resetAll'));
  });

  it('also appears on the external-sensor path, as the last step', () => {
    withBluetooth();
    let finished = false;
    open({ initialSettings: classicSettings(), onFinished: () => (finished = true) });
    const external = card().querySelector<HTMLInputElement>('input[value="external"]')!;
    external.checked = true;
    external.dispatchEvent(new Event('change'));
    next(); // source -> vehicle
    next(); // vehicle -> connect
    next(); // connect -> installation offset
    next(); // -> reading the screen
    next(); // -> settings
    next(); // settings -> ramps
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('settings.tab.ramps'));
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('11 / 11');
    next(); // "Done"
    expect(finished).toBe(true);
  });
});

describe('onboarding wizard — calibration: the phone only, zeroing waits for the first parking (#365)', () => {
  function toCalibration(settings: LevelSettings, overrides: Partial<OnboardingOptions> = {}) {
    open({ initialSettings: settings, ...overrides });
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> ramps
    next(); // -> phone sensor calibration
  }

  it('the phone step offers calibrate and flip, but no Check/Clear and no vehicle zero', () => {
    toCalibration(classicSettings());
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('calibration.sensor.h'));
    const buttonTexts = [...card().querySelectorAll('button')].map((b) => b.textContent);
    expect(buttonTexts).toContain(t('calibration.now'));
    expect(buttonTexts).toContain(t('calibration.flip.start'));
    expect(buttonTexts).not.toContain(t('calibration.check'));
    expect(buttonTexts).not.toContain(t('calibration.clear'));
    expect(buttonTexts).not.toContain(t('calibration.vehicle.now'));
    expect(buttonTexts).not.toContain(t('calibration.vehicle.clear'));
  });

  it('says the vehicle is zeroed the first time you park, and the ⚠ Zero lamp reminds', () => {
    toCalibration(classicSettings());
    expect(card().textContent).toContain(t('onboard.zeroLater', { lamp: t('lamp.zero') }));
  });

  it('is the last step: there is no vehicle-zero step on the phone path', () => {
    let done: boolean | undefined;
    toCalibration(classicSettings(), { onFinished: (d) => (done = d) });
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('9 / 9');
    expect(
      [...card().querySelectorAll('button')].some((b) => b.textContent === t('onboard.done')),
    ).toBe(true);
    next();
    expect(done).toBe(true);
  });

  it('has no Skip — Next goes on — and a note that ⚠ Calibrate reminds', () => {
    toCalibration(classicSettings());
    expect(
      [...card().querySelectorAll('button')].some((b) => b.textContent === t('onboard.skipStep')),
    ).toBe(false);
    expect(card().querySelector('.onboarding__skip-hint')?.textContent).toBe(
      t('onboard.note.calibrate', { next: t('onboard.next'), lamp: t('lamp.calibrate') }),
    );
  });

  it('Modern appearance: one calibration-card, without the Check/Clear row', () => {
    toCalibration(modernSettings());
    expect(card().querySelectorAll('.calibration-card')).toHaveLength(1);
    expect(card().querySelector('.calibration-card__row')).toBeNull();
  });
});

describe('onboarding wizard — sensor source choice (#135)', () => {
  describe('regression guard: no Web Bluetooth', () => {
    it('never adds the source-choice step — Sound is followed straight by the vehicle step', () => {
      withoutBluetooth();
      open({ initialSettings: classicSettings() });
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.vehicle.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('5 / 9');
      expect(card().querySelectorAll('input[name="onboarding-source"]')).toHaveLength(0);
      expect(card().textContent).not.toContain(t('onboard.source.h'));
    });

    it('still finishes on the 9th step’s "Done" button', () => {
      withoutBluetooth();
      let finished = false;
      showOnboarding(
        makeOptions({ initialSettings: classicSettings(), onFinished: () => (finished = true) }),
      );
      for (let i = 0; i < 8; i += 1) next();
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('9 / 9');
      next(); // "Done" on the last (9th) step
      expect(finished).toBe(true);
    });
  });

  describe('external sensor option available', () => {
    it('adds "How do you want to measure?" right after Sound, with two radios, phone pre-selected', () => {
      withBluetooth();
      open({ initialSettings: classicSettings() });
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.source.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('5 / 10');
      const radios = [
        ...card().querySelectorAll<HTMLInputElement>('input[name="onboarding-source"]'),
      ];
      expect(radios).toHaveLength(2);
      expect(radios.map((r) => r.value)).toEqual(['phone', 'external']);
      expect(radios[0]!.checked).toBe(true);
      expect(radios[1]!.checked).toBe(false);
      expect(card().textContent).toContain(t('onboard.source.phone'));
      // "External sensor" (screen-cleanup follow-up), not a "Libell
      // Sensor" product name that was never real.
      expect(card().textContent).toContain(t('menu.sensorSource'));
    });

    it('picking "This phone" (the default) and Next leads to the vehicle step, then the phone flow', () => {
      withBluetooth();
      open({ initialSettings: classicSettings() });
      next(); // source step -> vehicle (phone radio already checked)
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.vehicle.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('6 / 10');
      next(); // -> placement
      next(); // -> settings
      next(); // -> ramps
      next(); // -> phone sensor calibration, the last step (#365)
      expect(card().querySelector('.onboarding__title')?.textContent).toContain(
        t('calibration.sensor.h'),
      );
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('10 / 10');
    });

    it('reports which path was walked when it finishes (#365)', () => {
      withBluetooth();
      let path: string | undefined;
      open({ initialSettings: classicSettings(), onFinished: (_done, p) => (path = p) });
      const external = card().querySelector<HTMLInputElement>('input[value="external"]')!;
      external.checked = true;
      external.dispatchEvent(new Event('change'));
      for (let i = 0; i < 7; i += 1) next();
      expect(path).toBe('external');
    });

    it('picking the external sensor branches to vehicle, then connect, then the box’s position, then settings, then ramps', () => {
      withBluetooth();
      let finished = false;
      const connectSensor = () => Promise.resolve<'granted'>('granted');
      open({
        initialSettings: classicSettings(),
        connectSensor,
        onFinished: () => (finished = true),
      });
      const external = card().querySelector<HTMLInputElement>('input[value="external"]')!;
      external.checked = true;
      external.dispatchEvent(new Event('change'));
      next(); // source step -> vehicle
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.vehicle.h'));
      next(); // vehicle -> connect (embeds the real sensorSourceSection's connect half)
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.sensorSource'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('7 / 11');
      // The real connect flow, not a wizard-only duplicate.
      expect(
        [...card().querySelectorAll('button')].some(
          (b) =>
            b.getAttribute('aria-label') ===
            t('sensorSource.connect', { name: EASYLEVEL_DESCRIPTOR.displayName }),
        ),
      ).toBe(true);
      // Split into its own step (design review) — not shown alongside Connect.
      expect(card().textContent).not.toContain(t('onboard.boxPosition.h'));
      // Next is the way on (#365): no Skip, and a note on connecting later.
      expect(
        [...card().querySelectorAll('button')].some((b) => b.textContent === t('onboard.skipStep')),
      ).toBe(false);
      expect(card().querySelector('.onboarding__skip-hint')?.textContent).toBe(
        t('onboard.note.connect', { next: t('onboard.next') }),
      );
      next(); // connect -> the box's position (#317)
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(
        t('onboard.boxPosition.h'),
      );
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('8 / 11');
      // Direction and zero wait for the first parking (#317): said, not asked.
      expect(card().textContent).toContain(t('onboard.boxPosition.later'));
      // No box connected (#365): said once, never an endless "waiting".
      expect(card().textContent).toContain(
        t('onboard.boxPosition.notConnected', { next: t('onboard.next') }),
      );
      expect(card().textContent).not.toContain(t('box.step.position.waiting'));
      expect(
        [...card().querySelectorAll('button')].some((b) => b.textContent === t('onboard.skipStep')),
      ).toBe(false);
      expect(
        [...card().querySelectorAll('button')].some(
          (b) => b.textContent === t('sensorSource.install.now'),
        ),
      ).toBe(false);
      next(); // the box's position -> how to read the screen (#285), not the phone placement
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('help.screen.h'));
      expect(card().textContent).not.toContain(t('onboard.step1.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('9 / 11');
      next(); // -> settings (dimensions), never the phone calibration steps
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('help.settings.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('10 / 11');
      next(); // -> ramps, the last step for this path
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('settings.tab.ramps'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('11 / 11');
      next(); // "Done" — no phone calibration steps for the external path
      expect(finished).toBe(true);
    });

    describe('an external sensor is already the active source (#287)', () => {
      it('picking "This phone" leaves out both phone calibration steps, which could not be used', () => {
        withBluetooth();
        let finished = false;
        open({
          initialSettings: classicSettings(),
          getSensorSource: () => 'easylevel',
          isPhoneActive: () => false,
          onFinished: () => (finished = true),
        });
        expect(card().querySelector('.onboarding__progress')?.textContent).toBe('5 / 9');
        next(); // source (phone) -> vehicle
        next(); // -> placement
        next(); // -> settings
        next(); // -> ramps, now the last step
        expect(card().querySelector('.onboarding__title')?.textContent).toBe(
          t('settings.tab.ramps'),
        );
        expect(card().querySelector('.onboarding__progress')?.textContent).toBe('9 / 9');
        next(); // "Done" — never a disabled calibration step
        expect(finished).toBe(true);
      });

      it('says so on the source step, and how to calibrate the phone instead', () => {
        withBluetooth();
        open({ initialSettings: classicSettings(), getSensorSource: () => 'xparkle' });
        expect(card().textContent).toContain(
          t('onboard.source.externalActive', { disconnect: t('sensorSource.disconnect') }),
        );
      });

      it('never switches the source itself, whichever path is walked or closed', () => {
        withBluetooth();
        let disconnected = false;
        open({
          initialSettings: classicSettings(),
          getSensorSource: () => 'easylevel',
          disconnectSensor: () => (disconnected = true),
        });
        for (let i = 0; i < 4; i += 1) next();
        card().querySelector<HTMLButtonElement>('.onboarding__close')!.click();
        expect(disconnected).toBe(false);
      });

      it('the external path is unchanged', () => {
        withBluetooth();
        open({ initialSettings: classicSettings(), getSensorSource: () => 'easylevel' });
        const external = card().querySelector<HTMLInputElement>('input[value="external"]')!;
        external.checked = true;
        external.dispatchEvent(new Event('change'));
        expect(card().querySelector('.onboarding__progress')?.textContent).toBe('5 / 11');
      });

      it('checks the connected box’s position live on its own step (#317)', () => {
        withBluetooth();
        open({
          initialSettings: classicSettings(),
          getSensorSource: () => 'easylevel',
          getCalibratedTilt: () => ({ pitchDeg: 1, rollDeg: 0 }),
        });
        const external = card().querySelector<HTMLInputElement>('input[value="external"]')!;
        external.checked = true;
        external.dispatchEvent(new Event('change'));
        next(); // -> vehicle
        next(); // -> connect
        next(); // -> the box's position
        expect(card().textContent).toContain(t('box.step.position.flat.ok'));
        expect(card().textContent).not.toContain(
          t('onboard.boxPosition.notConnected', { next: t('onboard.next') }),
        );
      });
    });

    describe('a box that rejects its password on the connect step (#390)', () => {
      // The frames the step asks for, run by hand so the verdict's arrival
      // is the only thing that changes between two looks at the card.
      function stubFrames(): () => void {
        let pending: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
          pending.push(callback);
          return pending.length;
        });
        return () => {
          const due = pending;
          pending = [];
          due.forEach((callback) => callback(0));
        };
      }

      function openConnectStep(rejected: () => boolean, tryPassword: () => void): void {
        withBluetooth();
        open({
          initialSettings: classicSettings(),
          getSensorSource: () => 'easylevel',
          getSensorState: () => 'granted',
          password: {
            isRejected: rejected,
            tryPassword: () => {
              tryPassword();
              return Promise.resolve(true);
            },
          },
        });
        const external = card().querySelector<HTMLInputElement>('input[value="external"]')!;
        external.checked = true;
        external.dispatchEvent(new Event('change'));
        next(); // -> vehicle
        next(); // -> connect
      }

      const passwordField = () => card().querySelector<HTMLElement>('.box-password')!;

      afterEach(() => vi.unstubAllGlobals());

      it('shows "Wrong password" and the field once the verdict arrives, without leaving the step', () => {
        const frame = stubFrames();
        let rejected = false;
        openConnectStep(
          () => rejected,
          () => {},
        );
        expect(card().textContent).toContain(t('box.state.connected'));
        rejected = true; // the verdict lands after the connect resolved
        frame();
        expect(card().textContent).toContain(t('box.state.password'));
        expect(card().textContent).not.toContain(t('box.state.connected'));
        expect(passwordField().hidden).toBe(false);
      });

      it('hides the field and shows "Connected" again once the right code is typed', async () => {
        const frame = stubFrames();
        let rejected = true;
        openConnectStep(
          () => rejected,
          () => (rejected = false),
        );
        expect(passwordField().hidden).toBe(false);
        passwordField().querySelector('input')!.value = '1234';
        [...passwordField().querySelectorAll('button')]
          .find((button) => button.textContent === t('box.password.retry'))!
          .click();
        await Promise.resolve();
        await Promise.resolve();
        frame();
        expect(passwordField().hidden).toBe(true);
        expect(card().textContent).toContain(t('box.state.connected'));
      });
    });

    it('with the phone active, the source step shows no external-sensor note', () => {
      withBluetooth();
      open({ initialSettings: classicSettings() });
      expect(card().textContent).not.toContain(
        t('onboard.source.externalActive', { disconnect: t('sensorSource.disconnect') }),
      );
    });

    it('closing (✕) before a choice is made never leaves an ambiguous state', () => {
      withBluetooth();
      let finished = false;
      showOnboarding(makeOptions({ onFinished: () => (finished = true) }));
      // No radio was ever touched — 'phone' stays the implicit default.
      card().querySelector<HTMLButtonElement>('.onboarding__close')!.click();
      expect(finished).toBe(true);
    });
  });
});

describe('onboarding wizard — Modern appearance (#110)', () => {
  it('shows a bar per step, the current step highlighted, advancing on Next', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    const active = () =>
      [...card().querySelectorAll('.onboarding__bar')].map((b) =>
        b.classList.contains('onboarding__bar--active'),
      );
    expect(active()).toEqual([true, false, false, false, false, false, false, false, false]);
    expect(card().querySelector('.onboarding__progress')).toBeNull();

    next(); // welcome -> language
    expect(active()).toEqual([false, true, false, false, false, false, false, false, false]);
  });

  it('gives the step heading the 24px/700 modern class', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    const heading = card().querySelector('.onboarding__title')!;
    expect(heading.classList.contains('onboarding__title--modern')).toBe(true);
  });

  it('renders four legend rows on the placement step, each a color swatch + glyph + matching text', () => {
    open({ initialSettings: modernSettings() });
    next(); // vehicle -> placement
    const rows = [...card().querySelectorAll('.onboarding__legend-row')];
    expect(rows).toHaveLength(4);

    const expected: [string, string, string][] = [
      ['onboarding__legend-swatch--ok', '✓', t('onboard.legend.ok')],
      ['onboarding__legend-swatch--up', '↑', t('onboard.legend.up')],
      ['onboarding__legend-swatch--no', '✕', t('onboard.legend.no')],
      ['onboarding__legend-swatch--dim', '–', t('onboard.legend.dim')],
    ];
    rows.forEach((row, i) => {
      const [swatchClass, glyph, text] = expected[i]!;
      const swatch = row.querySelector('.onboarding__legend-swatch')!;
      expect(swatch.classList.contains(swatchClass)).toBe(true);
      expect(swatch.textContent).toBe(glyph);
      expect(row.querySelector('.onboarding__legend-text')?.textContent).toBe(text);
    });

    // Replaces the SVG legend illustration, does not duplicate it.
    expect(card().querySelector('.illu__wheel')).toBeNull();
  });

  it('restyles Next/Skip/Back without touching the click handlers or their order', () => {
    let finished = false;
    open({
      initialSettings: modernSettings(),
      onFinished: () => (finished = true),
    });
    // The vehicle step has no skip button.
    expect(card().querySelector('.onboarding__nav--modern')).not.toBeNull();
    expect(card().querySelectorAll('.onboarding__skip--modern')).toHaveLength(0);

    next(); // -> placement, which also has no skip button
    next(); // -> settings, which does have a skip button
    const nav = card().querySelector('.onboarding__nav--modern')!;
    expect(nav.classList.contains('onboarding__nav--modern')).toBe(true);
    const skip = card().querySelector<HTMLButtonElement>('.onboarding__skip--modern')!;
    expect(skip.textContent).toBe(t('onboard.skipStep'));
    const nextButton = card().querySelector<HTMLButtonElement>('.onboarding__next--modern')!;
    expect(nextButton.textContent).toBe(t('onboard.next'));
    // Same DOM order as Classic (Back, Skip, Next) — Next lands at the true
    // bottom edge, closest to the thumb, in both appearances (#110 follow-up).
    const buttons = [...nav.querySelectorAll('button')];
    expect(buttons.indexOf(skip)).toBeLessThan(buttons.indexOf(nextButton));

    skip.click(); // same skip-forward behavior as Classic, advances to the
    // ramps step (index 7 of 9 — settings is index 6).
    const bars = [...card().querySelectorAll('.onboarding__bar')];
    expect(bars.map((b) => b.classList.contains('onboarding__bar--active'))).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
    ]);

    card().querySelector<HTMLButtonElement>('.onboarding__close')!.click();
    expect(finished).toBe(true);
  });
});

describe('onboarding wizard — compact steps (#156)', () => {
  it('Settings step shows only Wheelbase/Track width front/rear, not the full form, and no Save/Undo/Reset row', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    next(); // placement -> settings
    expect(card().querySelector('input[name="wheelbaseMm"]')).not.toBeNull();
    expect(card().querySelector('input[name="trackWidthFrontMm"]')).not.toBeNull();
    expect(card().querySelector('input[name="trackWidthRearMm"]')).not.toBeNull();
    // Nothing else from the full form: no tolerance/stability/appearance/
    // audio fields, no Advanced disclosure, no vehicle-type/axle selects
    // (vehicle type was already asked on its own step).
    expect(card().querySelector('input[name="toleranceMm"]')).toBeNull();
    expect(card().querySelector('.settings__advanced')).toBeNull();
    expect(card().querySelector('select')).toBeNull();
    // The wizard's steps are saved by Next alone (#328 left them that
    // way): no Undo and no "Reset all settings" from the full page.
    const buttonTexts = [...card().querySelectorAll('button')].map((b) => b.textContent);
    expect(buttonTexts).not.toContain(t('settings.undo'));
    expect(buttonTexts).not.toContain(t('settings.resetAll'));
  });

  it('can still be saved via Next, which submits the form directly (no Save button to click)', () => {
    let saved: LevelSettings | null = null;
    open({
      initialSettings: classicSettings(),
      onSettingsSaved: (s) => (saved = s),
    });
    next(); // -> placement
    next(); // -> settings
    const wheelbase = card().querySelector<HTMLInputElement>('input[name="wheelbaseMm"]')!;
    wheelbase.value = '4200';
    wheelbase.dispatchEvent(new Event('input'));
    const form = card().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(saved).not.toBeNull();
    expect(saved!.wheelbaseMm).toBe(4200);
  });

  it('regression guard (#159): saving from the wizard never closes or advances it — only ☰ → Settings does that', () => {
    let finished = false;
    open({ initialSettings: classicSettings(), onFinished: () => (finished = true) });
    next(); // -> placement
    next(); // -> settings (step 7 of 9)
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('7 / 9');
    const form = card().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    // Still open, still on the settings step — submitting directly and
    // advancing via Next stay fully independent here.
    expect(document.querySelector('.onboarding__card')).not.toBeNull();
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('7 / 9');
    expect(finished).toBe(false);
  });

  it('Modern appearance: the same compact reduction applies', () => {
    open({ initialSettings: modernSettings() });
    next(); // -> placement
    next(); // -> settings
    expect(card().querySelector('input[name="wheelbaseMm"]')).not.toBeNull();
    expect(card().querySelector('.settings__tabs')).toBeNull();
    expect(card().querySelector('.settings__advanced')).toBeNull();
    expect(card().querySelector('.settings__actions')).toBeNull();
  });
});

describe('onboarding wizard — Continuous audio guidance defaults off, discovered via the Sound step (#154, #189)', () => {
  // #154 originally put a "Tip: Settings → General has an optional
  // Continuous audio guidance…" note on the placement step, since that
  // step was the only place a first-run user was guaranteed to see the
  // feature mentioned. #189's General step (later split into Language/
  // Appearance/Sound) shows the real toggle itself, earlier in the guide —
  // a stale "go find it in Settings" hint right after that would only
  // have confused the very users #189 was for, so it's gone; the toggle
  // is still off by default here too.
  it('the shipped default is off, and stays off when the sound step is skipped', () => {
    let saved: LevelSettings | null = null;
    open({
      initialSettings: classicSettings(),
      onSettingsSaved: (s) => (saved = s),
    });
    next(); // vehicle -> placement
    next(); // placement -> settings
    const form = card().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(saved).not.toBeNull();
    expect(saved!.soundGuidance).toBe(DEFAULT_SETTINGS.soundGuidance);
    expect(DEFAULT_SETTINGS.soundGuidance).toBe(false);
  });
});

describe('onboarding wizard — usability review fixes (#189)', () => {
  it('shows no Back button on the first step', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().textContent).not.toContain(t('onboard.back'));
  });

  it('Back returns to the previous step, preserving the vehicle choice', () => {
    open({ initialSettings: classicSettings() });
    pickVehicle('caravan');
    next(); // vehicle -> placement
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.step1.h'));
    back(); // -> vehicle
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.vehicle.h'));
    const radios = [
      ...card().querySelectorAll<HTMLInputElement>('input[name="onboarding-vehicle"]'),
    ];
    expect(radios[1]!.checked).toBe(true); // caravan, still selected
  });

  it('tapping Next on the settings step saves the typed-in measurements, without a separate Save', () => {
    let saved: LevelSettings | null = null;
    open({
      initialSettings: classicSettings(),
      onSettingsSaved: (s) => (saved = s),
    });
    next(); // vehicle -> placement
    next(); // placement -> settings
    const wheelbase = card().querySelector<HTMLInputElement>('input[name="wheelbaseMm"]')!;
    wheelbase.value = '4200';
    wheelbase.dispatchEvent(new Event('input'));
    next(); // settings -> ramps; must save first
    expect(saved).not.toBeNull();
    expect(saved!.wheelbaseMm).toBe(4200);
  });

  it('a Back visit after Next auto-saved shows the just-entered value, not the stale initial one', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    next(); // placement -> settings
    const wheelbase = card().querySelector<HTMLInputElement>('input[name="wheelbaseMm"]')!;
    wheelbase.value = '4200';
    wheelbase.dispatchEvent(new Event('input'));
    next(); // settings -> ramps (auto-saves)
    back(); // -> settings
    const wheelbaseAgain = card().querySelector<HTMLInputElement>('input[name="wheelbaseMm"]')!;
    expect(wheelbaseAgain.value).toBe('4200');
  });

  it('directly submitting the settings form still never advances or closes the wizard (#159, unaffected)', () => {
    let finished = false;
    open({ initialSettings: classicSettings(), onFinished: () => (finished = true) });
    next(); // vehicle -> placement
    next(); // placement -> settings
    const form = card().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('help.settings.h'));
    expect(finished).toBe(false);
  });

  it('gives each step its own note, or none (#365) — never one generic note everywhere', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    const note = () => card().querySelector('.onboarding__skip-hint')?.textContent ?? null;
    expect(note()).toBeNull(); // welcome
    next(); // -> language
    expect(note()).toBeNull();
    next(); // -> appearance
    expect(note()).toBeNull();
    next(); // -> sound
    expect(note()).toBeNull();
    next(); // -> vehicle
    expect(note()).toBeNull();
    next(); // -> placement
    expect(note()).toBeNull();
    next(); // -> settings
    expect(note()).toBe(t('onboard.note.measurements', { lamp: t('lamp.setup') }));
    next(); // -> ramps
    expect(note()).toBe(t('onboard.note.ramps'));
    next(); // -> phone sensor calibration
    expect(note()).toBe(
      t('onboard.note.calibrate', { next: t('onboard.next'), lamp: t('lamp.calibrate') }),
    );
  });

  it('offers Skip only where Next would save something: measurements and ramps (#365)', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    const titlesWithSkip: string[] = [];
    for (let i = 0; i < 9; i += 1) {
      const hasSkip = [...card().querySelectorAll('button')].some(
        (b) => b.textContent === t('onboard.skipStep'),
      );
      if (hasSkip) titlesWithSkip.push(card().querySelector('h2')!.childNodes[0]!.textContent!);
      next();
    }
    expect(titlesWithSkip).toEqual([t('help.settings.h'), t('settings.tab.ramps')]);
  });

  it('shows no note on steps with nothing left undone', () => {
    open({ initialSettings: classicSettings() });
    expect(card().querySelector('.onboarding__skip-hint')).toBeNull(); // vehicle step
    next();
    expect(card().querySelector('.onboarding__skip-hint')).toBeNull(); // placement step
  });

  it('Modern shows a visible "n / total" text next to the progress bars', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    expect(card().querySelector('.onboarding__bars-text')?.textContent).toBe('1 / 9');
    next();
    expect(card().querySelector('.onboarding__bars-text')?.textContent).toBe('2 / 9');
  });
});

// #239: the wizard has to fit one phone screen. Its chrome is pinned and
// only the step body scrolls (CSS), and the DOM below is what makes the
// steps short enough that on the phones tested nothing has to scroll at
// all. These assert the structure that carries that; the heights
// themselves are a layout concern, checked against real viewports.
describe('onboarding wizard — one screen, no scrolling (#239)', () => {
  it('Back and Skip share one row, with Next the full-width control at the bottom edge', () => {
    open({ initialSettings: modernSettings() });
    next(); // vehicle -> placement
    next(); // placement -> settings (has Back, Skip and Next)
    const nav = card().querySelector('.onboarding__nav')!;
    const row = nav.querySelector('.onboarding__nav-row')!;
    expect([...row.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      t('onboard.back'),
      t('onboard.skipStep'),
    ]);
    // Next is the nav's own last child, not part of that row — it keeps
    // the full width and the bottom edge closest to the thumb.
    expect(nav.lastElementChild?.textContent).toBe(t('onboard.next'));
    expect(row.contains(nav.lastElementChild)).toBe(false);
  });

  it('welcome renders no empty secondary row — it has neither Back nor Skip', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.welcome.h'));
    expect(card().querySelector('.onboarding__nav-row')).toBeNull();
  });

  it('the skip-consequence note sits in the nav beside the Skip it explains, not in the step body', () => {
    open({ initialSettings: modernSettings() });
    next(); // vehicle -> placement
    next(); // placement -> settings
    const hint = card().querySelector('.onboarding__skip-hint')!;
    expect(hint.textContent).toBe(t('onboard.note.measurements', { lamp: t('lamp.setup') }));
    expect(card().querySelector('.onboarding__nav')!.contains(hint)).toBe(true);
    expect(card().querySelector('.onboarding__body')!.contains(hint)).toBe(false);
  });

  it('preference steps render no note at all', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    for (const title of [t('settings.language'), t('settings.appearance'), t('onboard.sound.h')]) {
      next();
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(title);
      expect(card().querySelector('.onboarding__skip-hint')).toBeNull();
    }
  });

  it('a calibration step folds the embedded card header into the step heading, pill and all', () => {
    open({ initialSettings: modernSettings() });
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> ramps
    next(); // -> phone sensor calibration
    const heading = card().querySelector('.onboarding__title')!;
    expect(heading.textContent).toContain(t('calibration.sensor.h'));
    // The pill moved up next to the heading — the one thing the heading
    // does not itself say — and the card's own header row is gone, along
    // with its duplicate copy of that same heading.
    expect(heading.querySelector('.calibration-card__pill')?.textContent).toBe(
      t('calibration.pill.notDone'),
    );
    expect(card().querySelector('.calibration-card__header')).toBeNull();
    expect(card().querySelector('.calibration-card__title')).toBeNull();
  });

  it('the pill in the heading is still the live one the calibration section keeps up to date', () => {
    let calibration: Calibration | null = null;
    open({
      initialSettings: modernSettings(),
      getCalibration: () => calibration,
      calibrate: () => {
        calibration = { rollDeg: 0, pitchDeg: 0 };
        return null;
      },
    });
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> ramps
    next(); // -> phone sensor calibration
    const heading = card().querySelector('.onboarding__title')!;
    expect(heading.querySelector('.calibration-card__pill')?.textContent).toBe(
      t('calibration.pill.notDone'),
    );
    [...card().querySelectorAll('button')]
      .find((b) => b.textContent === t('calibration.now'))!
      .click();
    expect(heading.querySelector('.calibration-card__pill')?.textContent).toBe(
      t('calibration.pill.done'),
    );
  });

  it('a step with no embedded calibration card leaves the heading a plain heading', () => {
    open({ initialSettings: modernSettings() });
    next(); // vehicle -> placement
    const heading = card().querySelector('.onboarding__title')!;
    expect(heading.childElementCount).toBe(0);
  });
});

// #239 follow-up: the duplicate heading is dropped in Classic too, which
// builds the same calibration UI without Modern's `.calibration-card__header`
// wrapper — so the fold cannot key on that wrapper. Classic in German was
// the worst overflow of the lot precisely because it kept both headings.
describe('onboarding wizard — the embedded heading never repeats the step heading (#239)', () => {
  for (const [name, settings] of [
    ['Classic', classicSettings],
    ['Modern', modernSettings],
  ] as const) {
    it(`${name}: a calibration step shows its heading once, not twice`, () => {
      open({ initialSettings: settings() });
      next(); // vehicle -> placement
      next(); // -> settings
      next(); // -> ramps
      next(); // -> phone sensor calibration
      expect(card().querySelector('.onboarding__title')?.textContent).toContain(
        t('calibration.sensor.h'),
      );
      const body = card().querySelector('.onboarding__body')!;
      const repeated = [...body.querySelectorAll('h3')].filter(
        (h) => h.textContent?.trim() === t('calibration.sensor.h'),
      );
      expect(repeated).toHaveLength(0);
    });
  }

  it('leaves an embedded heading that says something different alone', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> ramps
    next(); // -> phone sensor calibration
    const body = card().querySelector('.onboarding__body')!;
    // The step's own heading is folded away, but nothing else in that
    // card's copy is touched — the calibrate/flip wording included.
    expect(body.textContent).toContain(t('calibration.now'));
    expect(body.textContent).toContain(t('calibration.flip.start'));
  });
});

// Pins the wizard's whole interface before it is split into one module per
// step (#415): the same assertions must pass, unchanged, before and after.
describe('onboarding wizard — regression pins for the module split (#415)', () => {
  function title(): string | null | undefined {
    return card()?.querySelector('.onboarding__title')?.firstChild?.textContent;
  }

  function pickSource(value: 'phone' | 'external'): void {
    const radio = card().querySelector<HTMLInputElement>(
      `input[name="onboarding-source"][value="${value}"]`,
    )!;
    radio.checked = true;
    radio.dispatchEvent(new Event('change'));
  }

  const LEADING = [
    'onboard.welcome.h',
    'settings.language',
    'settings.appearance',
    'onboard.sound.h',
  ] as const;
  const PHONE_TAIL = ['onboard.step1.h', 'help.settings.h', 'settings.tab.ramps'] as const;
  const EXTERNAL_TAIL = [
    'menu.sensorSource',
    'onboard.boxPosition.h',
    'help.screen.h',
    'help.settings.h',
    'settings.tab.ramps',
  ] as const;

  type Path = {
    name: string;
    bluetooth: boolean;
    source: 'phone' | 'easylevel';
    choice?: 'phone' | 'external';
    titles: string[];
  };

  const PATHS: Path[] = [
    {
      name: 'no Web Bluetooth',
      bluetooth: false,
      source: 'phone',
      titles: [...LEADING, 'onboard.vehicle.h', ...PHONE_TAIL, 'calibration.sensor.h'],
    },
    {
      name: 'Web Bluetooth, phone chosen',
      bluetooth: true,
      source: 'phone',
      choice: 'phone',
      titles: [
        ...LEADING,
        'onboard.source.h',
        'onboard.vehicle.h',
        ...PHONE_TAIL,
        'calibration.sensor.h',
      ],
    },
    {
      name: 'Web Bluetooth, external chosen',
      bluetooth: true,
      source: 'phone',
      choice: 'external',
      titles: [...LEADING, 'onboard.source.h', 'onboard.vehicle.h', ...EXTERNAL_TAIL],
    },
    {
      name: 'box active, phone chosen',
      bluetooth: true,
      source: 'easylevel',
      choice: 'phone',
      titles: [...LEADING, 'onboard.source.h', 'onboard.vehicle.h', ...PHONE_TAIL],
    },
    {
      name: 'box active, external chosen',
      bluetooth: true,
      source: 'easylevel',
      choice: 'external',
      titles: [...LEADING, 'onboard.source.h', 'onboard.vehicle.h', ...EXTERNAL_TAIL],
    },
  ];

  function start(path: Path, overrides: Partial<OnboardingOptions> = {}): void {
    if (path.bluetooth) withBluetooth();
    else withoutBluetooth();
    showOnboarding(
      makeOptions({
        initialSettings: classicSettings(),
        getSensorSource: () => path.source,
        ...overrides,
      }),
    );
  }

  /** Steps forward to `stepIndex`, picking the path's source on the way. */
  function walkTo(path: Path, stepIndex: number): void {
    for (let i = 0; i < stepIndex; i += 1) {
      if (title() === t('onboard.source.h') && path.choice) pickSource(path.choice);
      next();
    }
  }

  for (const path of PATHS) {
    for (const appearance of ['classic', 'modern'] as const) {
      it(`${path.name} (${appearance}): shows exactly these steps, in order, then finishes`, () => {
        let finished: [boolean, string] | undefined;
        start(path, {
          initialSettings: { ...DEFAULT_SETTINGS, appearance },
          onFinished: (done, p) => (finished = [done, p]),
        });
        const seen: (string | null | undefined)[] = [];
        for (let i = 0; i < path.titles.length; i += 1) {
          seen.push(title());
          walkTo(path, 1);
        }
        expect(seen).toEqual(path.titles.map((key) => t(key as Parameters<typeof t>[0])));
        expect(finished).toEqual([true, path.choice ?? 'phone']);
        expect(document.querySelector('.onboarding')).toBeNull();
      });
    }

    it(`${path.name}: ✕ on any step closes with onFinished(false) and the path chosen so far`, () => {
      for (let step = 0; step < path.titles.length; step += 1) {
        const calls: [boolean, string][] = [];
        start(path, { onFinished: (done, p) => calls.push([done, p]) });
        walkTo(path, step);
        card().querySelector<HTMLButtonElement>('.onboarding__close')!.click();
        const chosen = step > path.titles.indexOf('onboard.source.h') ? path.choice : undefined;
        expect(calls).toEqual([[false, path.bluetooth ? (chosen ?? 'phone') : 'phone']]);
        expect(document.querySelector('.onboarding')).toBeNull();
        document.body.replaceChildren();
      }
    });

    it(`${path.name}: Next saves only on the steps that embed a settings form`, () => {
      const savedOn: string[] = [];
      start(path, {
        onSettingsSaved: () => savedOn.push(title() ?? ''),
      });
      walkTo(path, path.titles.length);
      expect(savedOn).toEqual(
        [
          'settings.language',
          'settings.appearance',
          'onboard.sound.h',
          'help.settings.h',
          'settings.tab.ramps',
        ].map((key) => t(key as Parameters<typeof t>[0])),
      );
    });

    it(`${path.name}: every step moves focus to its heading, and Back returns step by step`, () => {
      start(path);
      walkTo(path, path.titles.length - 1);
      for (let i = path.titles.length - 1; i >= 0; i -= 1) {
        expect(title()).toBe(t(path.titles[i] as Parameters<typeof t>[0]));
        expect(document.activeElement).toBe(card().querySelector('.onboarding__title'));
        expect(card().querySelector('.onboarding__progress')?.textContent).toBe(
          `${i + 1} / ${path.titles.length}`,
        );
        if (i > 0) back();
      }
    });
  }

  it('Back from the external path keeps the external radio picked and its step total', () => {
    withBluetooth();
    open({ initialSettings: classicSettings() });
    pickSource('external');
    next(); // -> vehicle
    back(); // -> source
    expect(
      card().querySelector<HTMLInputElement>('input[name="onboarding-source"][value="external"]')!
        .checked,
    ).toBe(true);
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('5 / 11');
  });

  it('the box-position step redraws with the live position once a connection lands', async () => {
    withBluetooth();
    let source: 'phone' | 'easylevel' = 'phone';
    open({
      initialSettings: classicSettings(),
      getSensorSource: () => source,
      getCalibratedTilt: () => ({ pitchDeg: 1, rollDeg: 0 }),
    });
    pickSource('external');
    next(); // -> vehicle
    next(); // -> connect
    next(); // -> the box's position, nothing connected yet
    const notConnected = t('onboard.boxPosition.notConnected', { next: t('onboard.next') });
    expect(card().textContent).toContain(notConnected);
    source = 'easylevel';
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(title()).toBe(t('onboard.boxPosition.h'));
    expect(card().textContent).not.toContain(notConnected);
    expect(card().textContent).toContain(t('box.step.position.flat.ok'));
  });
});
