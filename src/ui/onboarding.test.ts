// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { showOnboarding, type OnboardingOptions } from './onboarding';
import { setLanguage, t } from './i18n';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';

setLanguage('en');

afterEach(() => {
  document.body.replaceChildren();
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
    getSensorSource: () => 'phone',
    getSensorState: () => 'idle',
    connectEasyLevel: () => Promise.resolve('unsupported'),
    disconnectEasyLevel: () => {},
    getEasyLevelStatus: () => null,
    getInstallCalibration: () => null,
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    checkInstallCalibration: () => 'checked',
    clearInstallCalibration: () => {},
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

// The general step (#189) is always first now — most tests below are about
// whatever used to be the first step (vehicle, or source with Web
// Bluetooth). `open` shows the wizard and skips past General once, so
// every subsequent next()-call sequence in this file reads exactly as it
// did before that step existed.
function open(overrides: Partial<OnboardingOptions> = {}): void {
  showOnboarding(makeOptions(overrides));
  next(); // general -> whatever was first before #189
}

function pickVehicle(value: 'motorhome' | 'caravan'): void {
  const radio = card().querySelector<HTMLInputElement>(
    `input[name="onboarding-vehicle"][value="${value}"]`,
  )!;
  radio.checked = true;
  radio.dispatchEvent(new Event('change'));
}

describe('onboarding wizard — general step (#189, at the user’s suggestion)', () => {
  it('is the first step, always shown, and reuses the real General section fields', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('settings.general'));
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('1 / 5');
    // Language + Theme selects, but not Appearance — that stays an
    // Advanced/Settings-only concern (R18).
    expect(card().querySelectorAll('select')).toHaveLength(2);
    // Chime + Continuous audio guidance.
    expect(card().querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(card().querySelector('input[name="wheelbaseMm"]')).toBeNull();
  });

  it('is skippable, using defaults', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    const skip = [...card().querySelectorAll('button')].find(
      (b) => b.textContent === t('onboard.skipDefaults'),
    )!;
    expect(skip).not.toBeUndefined();
  });

  it('Next saves a changed toggle before advancing, same as the measurements step', () => {
    let saved: LevelSettings | null = null;
    showOnboarding(
      makeOptions({ initialSettings: classicSettings(), onSettingsSaved: (s) => (saved = s) }),
    );
    const chime = card().querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const flipped = !chime.checked;
    chime.checked = flipped;
    chime.dispatchEvent(new Event('input'));
    next(); // general -> vehicle; must save first
    expect(saved).not.toBeNull();
    expect(saved!.soundOnLevel).toBe(flipped);
  });

  it('has no Back button — it is always the first step', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().textContent).not.toContain(t('onboard.back'));
  });
});

describe('onboarding wizard — Classic (no Web Bluetooth): vehicle, placement, settings, calibration', () => {
  it('shows the "n / total" text progress, not bars, and lands on the vehicle step right after General', () => {
    open({ initialSettings: classicSettings() });
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.vehicle.h'));
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 5');
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

  it('advances through all five steps and finishes on the last step’s button', () => {
    let finished = false;
    showOnboarding(
      makeOptions({ initialSettings: classicSettings(), onFinished: () => (finished = true) }),
    );
    next(); // general -> vehicle
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 5');
    next(); // vehicle -> placement
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('3 / 5');
    next(); // placement -> settings
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('4 / 5');
    next(); // settings -> calibration
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('5 / 5');
    next(); // "Done" on the last step
    expect(finished).toBe(true);
  });

  it('the ✕ close button finishes immediately from any step', () => {
    let finished = false;
    showOnboarding(makeOptions({ onFinished: () => (finished = true) }));
    card().querySelector<HTMLButtonElement>('.onboarding__close')!.click();
    expect(finished).toBe(true);
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
});

describe('onboarding wizard — calibration step reuses the real calibration section as-is (#184)', () => {
  it('shows the full calibration UI, not a reduced one — flip calibration and vehicle zero included', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    next(); // placement -> settings
    next(); // settings -> calibration
    const buttonTexts = [...card().querySelectorAll('button')].map((b) => b.textContent);
    expect(buttonTexts).toContain(t('calibration.now'));
    expect(buttonTexts).toContain(t('calibration.flip.start'));
    expect(buttonTexts).toContain(t('calibration.vehicle.now'));
    expect(buttonTexts).toContain(t('calibration.clear'));
    expect(card().textContent).toContain(t('calibration.vehicle.h'));
  });

  it('Modern appearance: the calibration step renders the two-card layout, same as Settings', () => {
    open({ initialSettings: modernSettings() });
    next(); // vehicle -> placement
    next(); // placement -> settings
    next(); // settings -> calibration
    expect(card().querySelectorAll('.calibration-card')).toHaveLength(2);
  });

  it('is still skippable, same terms as before', () => {
    open({ initialSettings: classicSettings() });
    next();
    next();
    next(); // -> calibration
    const skip = [...card().querySelectorAll('button')].find(
      (b) => b.textContent === t('onboard.skipStep'),
    )!;
    expect(skip).not.toBeUndefined();
  });
});

describe('onboarding wizard — sensor source choice (#135)', () => {
  const originalNavigator = globalThis.navigator;
  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  function withoutBluetooth(): void {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
  }

  function withBluetooth(): void {
    Object.defineProperty(globalThis, 'navigator', {
      value: { bluetooth: {} },
      configurable: true,
    });
  }

  describe('regression guard: no Web Bluetooth', () => {
    it('never adds the source-choice step — General is followed straight by the vehicle step', () => {
      withoutBluetooth();
      open({ initialSettings: classicSettings() });
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.vehicle.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 5');
      expect(card().querySelectorAll('input[name="onboarding-source"]')).toHaveLength(0);
      expect(card().textContent).not.toContain(t('onboard.source.h'));

      next(); // vehicle -> placement
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.step1.h'));
      next(); // placement -> settings
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.settings'));
      next(); // settings -> calibration
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.calibration'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('5 / 5');
    });

    it('still finishes on the 5th step’s "Done" button', () => {
      withoutBluetooth();
      let finished = false;
      showOnboarding(
        makeOptions({ initialSettings: classicSettings(), onFinished: () => (finished = true) }),
      );
      next(); // general -> vehicle
      next();
      next();
      next();
      next(); // "Done" on the last (5th) step
      expect(finished).toBe(true);
    });
  });

  describe('external sensor option available', () => {
    it('adds "How do you want to measure?" as step 2 of 6, right after General, with two radios, phone pre-selected', () => {
      withBluetooth();
      open({ initialSettings: classicSettings() });
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.source.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 6');
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

    it('picking "This phone" (the default) and Next leads to the vehicle step, then the unchanged phone flow', () => {
      withBluetooth();
      open({ initialSettings: classicSettings() });
      next(); // source step -> vehicle (phone radio already checked)
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.vehicle.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('3 / 6');
      next(); // -> placement
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.step1.h'));
      next(); // -> settings
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.settings'));
      next(); // -> calibration
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.calibration'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('6 / 6');
    });

    it('picking the external sensor branches to vehicle, then connect, then straight to settings', () => {
      withBluetooth();
      let finished = false;
      const connectEasyLevel = () => Promise.resolve<'granted'>('granted');
      open({
        initialSettings: classicSettings(),
        connectEasyLevel,
        onFinished: () => (finished = true),
      });
      const external = card().querySelector<HTMLInputElement>('input[value="external"]')!;
      external.checked = true;
      external.dispatchEvent(new Event('change'));
      next(); // source step -> vehicle
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.vehicle.h'));
      next(); // vehicle -> connect (embeds the real sensorSourceSection)
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.sensorSource'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('4 / 5');
      // The real connect flow, not a wizard-only duplicate.
      expect(
        [...card().querySelectorAll('button')].some(
          (b) => b.textContent === t('sensorSource.connect'),
        ),
      ).toBe(true);
      expect(card().textContent).toContain(t('sensorSource.install.h'));
      next(); // connect -> settings (dimensions), never the phone calibration step
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.settings'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('5 / 5');
      next(); // "Done" — no phone calibration step for the external path
      expect(finished).toBe(true);
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
    let bars = [...card().querySelectorAll('.onboarding__bar')];
    expect(bars).toHaveLength(5);
    expect(bars.map((b) => b.classList.contains('onboarding__bar--active'))).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(card().querySelector('.onboarding__progress')).toBeNull();

    next(); // general -> vehicle
    bars = [...card().querySelectorAll('.onboarding__bar')];
    expect(bars.map((b) => b.classList.contains('onboarding__bar--active'))).toEqual([
      false,
      true,
      false,
      false,
      false,
    ]);
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

  it('reorders Next above Skip visually without touching the click handlers', () => {
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
    expect(skip.textContent).toBe(t('onboard.skipDefaults'));
    const nextButton = card().querySelector<HTMLButtonElement>('.onboarding__next--modern')!;
    expect(nextButton.textContent).toBe(t('onboard.next'));

    skip.click(); // same skip-forward behavior as Classic
    const bars = [...card().querySelectorAll('.onboarding__bar')];
    expect(bars.map((b) => b.classList.contains('onboarding__bar--active'))).toEqual([
      false,
      false,
      false,
      false,
      true,
    ]);

    card().querySelector<HTMLButtonElement>('.onboarding__close')!.click();
    expect(finished).toBe(true);
  });
});

describe('onboarding wizard — compact steps (#156)', () => {
  it('Settings step shows only Wheelbase/Track width front/rear, not the full form', () => {
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
    expect(card().textContent).toContain(t('onboard.moreInMenu'));
  });

  it('Settings step can still be saved (Save button present, fields wired)', () => {
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
    next(); // -> settings (step 4 of 5)
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('4 / 5');
    const form = card().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    // Still open, still on the settings step — Save/Next stay fully independent here.
    expect(document.querySelector('.onboarding__card')).not.toBeNull();
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('4 / 5');
    expect(finished).toBe(false);
  });

  it('Modern appearance: the same compact reduction applies', () => {
    open({ initialSettings: modernSettings() });
    next(); // -> placement
    next(); // -> settings
    expect(card().querySelector('input[name="wheelbaseMm"]')).not.toBeNull();
    expect(card().querySelector('.settings__tabs')).toBeNull();
    expect(card().querySelector('.settings__advanced')).toBeNull();
  });
});

describe('onboarding wizard — audio guidance discoverability (#154)', () => {
  it('the placement step mentions Continuous audio guidance alongside the legend, in Classic', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    expect(card().textContent).toContain(t('onboard.audioGuidance.hint'));
  });

  it('the placement step mentions Continuous audio guidance alongside the legend, in Modern', () => {
    open({ initialSettings: modernSettings() });
    next(); // vehicle -> placement
    expect(card().textContent).toContain(t('onboard.audioGuidance.hint'));
  });

  it('never turns Continuous audio guidance on — it stays a deliberate opt-in', () => {
    let saved: LevelSettings | null = null;
    open({
      initialSettings: classicSettings(),
      onSettingsSaved: (s) => (saved = s),
    });
    next(); // vehicle -> placement
    next(); // placement -> settings — the hint on the placement step doesn't touch settings
    const form = card().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(saved).not.toBeNull();
    expect(saved!.soundGuidance).toBe(DEFAULT_SETTINGS.soundGuidance);
    expect(DEFAULT_SETTINGS.soundGuidance).toBe(false);
  });

  it('is not shown on any other step', () => {
    open({ initialSettings: classicSettings() });
    expect(card().textContent).not.toContain(t('onboard.audioGuidance.hint')); // vehicle step
    next(); // -> placement
    next(); // -> settings
    expect(card().textContent).not.toContain(t('onboard.audioGuidance.hint'));
    next(); // -> calibration
    expect(card().textContent).not.toContain(t('onboard.audioGuidance.hint'));
  });
});

describe('onboarding wizard — usability review fixes (#189)', () => {
  function back(): void {
    const buttons = [...card().querySelectorAll('button')];
    const backButton = buttons.find((b) => b.textContent === t('onboard.back'))!;
    backButton.click();
  }

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
    next(); // settings -> calibration; must save first
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
    next(); // settings -> calibration (auto-saves)
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
    expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.settings'));
    expect(finished).toBe(false);
  });

  it('pairs each skippable step’s Skip control with the warning-lamp consequence hint — except General, which lights no lamp', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    // General: skippable, but skipping it never lights a warning lamp.
    expect(card().textContent).not.toContain(t('onboard.skip.consequence'));
    next(); // general -> vehicle
    next(); // -> placement
    next(); // -> settings
    expect(card().textContent).toContain(t('onboard.skip.consequence'));
    next(); // -> calibration
    expect(card().textContent).toContain(t('onboard.skip.consequence'));
  });

  it('does not show the skip consequence hint on non-skippable steps', () => {
    open({ initialSettings: classicSettings() });
    expect(card().textContent).not.toContain(t('onboard.skip.consequence')); // vehicle step
    next();
    expect(card().textContent).not.toContain(t('onboard.skip.consequence')); // placement step
  });

  it('the calibration step steers which part to do first', () => {
    open({ initialSettings: classicSettings() });
    next(); // vehicle -> placement
    next(); // -> settings
    next(); // -> calibration
    expect(card().textContent).toContain(t('onboard.calibration.hint'));
  });

  it('Modern shows a visible "n / total" text next to the progress bars', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    expect(card().querySelector('.onboarding__bars-text')?.textContent).toBe('1 / 5');
    next();
    expect(card().querySelector('.onboarding__bars-text')?.textContent).toBe('2 / 5');
  });
});
