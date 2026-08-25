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

describe('onboarding wizard — Classic (pixel-identical to pre-#110)', () => {
  it('shows the "n / total" text progress, not bars', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('1 / 3');
    expect(card().querySelector('.onboarding__bars')).toBeNull();
  });

  it('renders the SVG legend illustration and caption on step 1, not legend rows', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().querySelector('.illu')).not.toBeNull();
    expect(card().textContent).toContain(t('help.screen.t'));
    expect(card().querySelector('.onboarding__legend')).toBeNull();
  });

  it('does not add any modern modifier classes', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().querySelector('.onboarding__title--modern')).toBeNull();
    expect(card().querySelector('.onboarding__next--modern')).toBeNull();
    expect(card().querySelector('.onboarding__nav--modern')).toBeNull();
  });

  it('advances through steps and finishes on the last step’s button', () => {
    let finished = false;
    showOnboarding(
      makeOptions({ initialSettings: classicSettings(), onFinished: () => (finished = true) }),
    );
    next(); // step 1 -> 2
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 3');
    next(); // step 2 -> 3
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('3 / 3');
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
    it('never adds the source-choice step — byte-identical to the pre-#135 3-step wizard', () => {
      withoutBluetooth();
      showOnboarding(makeOptions({ initialSettings: classicSettings() }));
      // Same first heading, same 3-step total, no radios anywhere.
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.step1.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('1 / 3');
      expect(card().querySelectorAll('input[type="radio"]')).toHaveLength(0);
      expect(card().textContent).not.toContain(t('onboard.source.h'));

      next(); // step 1 -> 2 (settings)
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.settings'));
      next(); // step 2 -> 3 (calibration)
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.calibration'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('3 / 3');
    });

    it('still finishes on the 3rd step’s "Done" button, same as before #135', () => {
      withoutBluetooth();
      let finished = false;
      showOnboarding(
        makeOptions({ initialSettings: classicSettings(), onFinished: () => (finished = true) }),
      );
      next();
      next();
      next(); // "Done" on the last (3rd) step
      expect(finished).toBe(true);
    });
  });

  describe('external sensor option available', () => {
    it('adds "How do you want to measure?" as step 1 of 4, with two radios, phone pre-selected', () => {
      withBluetooth();
      showOnboarding(makeOptions({ initialSettings: classicSettings() }));
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.source.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('1 / 4');
      const radios = [...card().querySelectorAll<HTMLInputElement>('input[type="radio"]')];
      expect(radios).toHaveLength(2);
      expect(radios.map((r) => r.value)).toEqual(['phone', 'external']);
      expect(radios[0]!.checked).toBe(true);
      expect(radios[1]!.checked).toBe(false);
      expect(card().textContent).toContain(t('onboard.source.phone'));
      // "External sensor" (screen-cleanup follow-up), not a "Libell
      // Sensor" product name that was never real.
      expect(card().textContent).toContain(t('menu.sensorSource'));
    });

    it('picking "This phone" (the default) and Next leads to the unchanged phone flow', () => {
      withBluetooth();
      showOnboarding(makeOptions({ initialSettings: classicSettings() }));
      next(); // source step -> placement (phone radio already checked)
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('onboard.step1.h'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 4');
      next(); // -> settings
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.settings'));
      next(); // -> calibration
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.calibration'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('4 / 4');
    });

    it('picking the external sensor branches to connect, then straight to settings', () => {
      withBluetooth();
      let finished = false;
      const connectEasyLevel = () => Promise.resolve<'granted'>('granted');
      showOnboarding(
        makeOptions({
          initialSettings: classicSettings(),
          connectEasyLevel,
          onFinished: () => (finished = true),
        }),
      );
      const external = card().querySelector<HTMLInputElement>('input[value="external"]')!;
      external.checked = true;
      external.dispatchEvent(new Event('change'));
      next(); // source step -> connect (embeds the real sensorSourceSection)
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.sensorSource'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 3');
      // The real connect flow, not a wizard-only duplicate.
      expect(
        [...card().querySelectorAll('button')].some(
          (b) => b.textContent === t('sensorSource.connect'),
        ),
      ).toBe(true);
      expect(card().textContent).toContain(t('sensorSource.install.h'));
      next(); // connect -> settings (dimensions), never the phone calibration step
      expect(card().querySelector('.onboarding__title')?.textContent).toBe(t('menu.settings'));
      expect(card().querySelector('.onboarding__progress')?.textContent).toBe('3 / 3');
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
    expect(bars).toHaveLength(3);
    expect(bars.map((b) => b.classList.contains('onboarding__bar--active'))).toEqual([
      true,
      false,
      false,
    ]);
    expect(card().querySelector('.onboarding__progress')).toBeNull();

    next();
    bars = [...card().querySelectorAll('.onboarding__bar')];
    expect(bars.map((b) => b.classList.contains('onboarding__bar--active'))).toEqual([
      false,
      true,
      false,
    ]);

    next();
    bars = [...card().querySelectorAll('.onboarding__bar')];
    expect(bars.map((b) => b.classList.contains('onboarding__bar--active'))).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('gives the step heading the 24px/700 modern class', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    const heading = card().querySelector('.onboarding__title')!;
    expect(heading.classList.contains('onboarding__title--modern')).toBe(true);
  });

  it('renders three legend rows on step 1, each a color swatch + glyph + matching text', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    const rows = [...card().querySelectorAll('.onboarding__legend-row')];
    expect(rows).toHaveLength(3);

    const expected: [string, string, string][] = [
      ['onboarding__legend-swatch--ok', '✓', t('onboard.legend.ok')],
      ['onboarding__legend-swatch--up', '↑', t('onboard.legend.up')],
      ['onboarding__legend-swatch--no', '✕', t('onboard.legend.no')],
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
    showOnboarding(
      makeOptions({
        initialSettings: modernSettings(),
        onFinished: () => (finished = true),
      }),
    );
    // Step 1 has no skip button, same as Classic.
    expect(card().querySelector('.onboarding__nav--modern')).not.toBeNull();
    expect(card().querySelectorAll('.onboarding__skip--modern')).toHaveLength(0);

    next(); // -> step 2, which does have a skip button
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
      true,
    ]);

    card().querySelector<HTMLButtonElement>('.onboarding__close')!.click();
    expect(finished).toBe(true);
  });
});

describe('onboarding wizard — compact steps (#156)', () => {
  it('Settings step shows only Wheelbase/Track width front/rear, not the full form', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    next(); // step 1 -> 2 (settings)
    expect(card().querySelector('input[name="wheelbaseMm"]')).not.toBeNull();
    expect(card().querySelector('input[name="trackWidthFrontMm"]')).not.toBeNull();
    expect(card().querySelector('input[name="trackWidthRearMm"]')).not.toBeNull();
    // Nothing else from the full form: no tolerance/stability/appearance/
    // audio fields, no Advanced disclosure, no vehicle-type/axle/theme selects.
    expect(card().querySelector('input[name="toleranceMm"]')).toBeNull();
    expect(card().querySelector('.settings__advanced')).toBeNull();
    expect(card().querySelector('select')).toBeNull();
    expect(card().textContent).toContain(t('onboard.moreInMenu'));
  });

  it('Settings step can still be saved (Save button present, fields wired)', () => {
    let saved: LevelSettings | null = null;
    showOnboarding(
      makeOptions({
        initialSettings: classicSettings(),
        onSettingsSaved: (s) => (saved = s),
      }),
    );
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
    showOnboarding(
      makeOptions({ initialSettings: classicSettings(), onFinished: () => (finished = true) }),
    );
    next(); // -> settings (step 2 of 3)
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 3');
    const form = card().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    // Still open, still on step 2 — Save/Next stay fully independent here.
    expect(document.querySelector('.onboarding__card')).not.toBeNull();
    expect(card().querySelector('.onboarding__progress')?.textContent).toBe('2 / 3');
    expect(finished).toBe(false);
  });

  it('Calibration step shows only "Calibrate now", not flip calibration or vehicle zero', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    next(); // -> settings
    next(); // -> calibration
    const buttonTexts = [...card().querySelectorAll('button')].map((b) => b.textContent);
    expect(buttonTexts).toContain(t('calibration.now'));
    expect(buttonTexts).not.toContain(t('calibration.flip.start'));
    expect(buttonTexts).not.toContain(t('calibration.vehicle.now'));
    expect(buttonTexts).not.toContain(t('calibration.clear'));
    expect(card().textContent).not.toContain(t('calibration.vehicle.h'));
    expect(card().textContent).toContain(t('onboard.moreInMenu'));
  });

  it('Modern appearance: the same compact reduction applies', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    next(); // -> settings
    expect(card().querySelector('input[name="wheelbaseMm"]')).not.toBeNull();
    expect(card().querySelector('.settings__tabs')).toBeNull();
    expect(card().querySelector('.settings__advanced')).toBeNull();
    next(); // -> calibration
    const buttonTexts = [...card().querySelectorAll('button')].map((b) => b.textContent);
    expect(buttonTexts).toContain(t('calibration.now'));
    expect(buttonTexts).not.toContain(t('calibration.vehicle.now'));
  });
});

describe('onboarding wizard — audio guidance discoverability (#154)', () => {
  it('step 1 mentions Continuous audio guidance alongside the legend, in Classic', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    expect(card().textContent).toContain(t('onboard.audioGuidance.hint'));
  });

  it('step 1 mentions Continuous audio guidance alongside the legend, in Modern', () => {
    showOnboarding(makeOptions({ initialSettings: modernSettings() }));
    expect(card().textContent).toContain(t('onboard.audioGuidance.hint'));
  });

  it('never turns Continuous audio guidance on — it stays a deliberate opt-in', () => {
    let saved: LevelSettings | null = null;
    showOnboarding(
      makeOptions({
        initialSettings: classicSettings(),
        onSettingsSaved: (s) => (saved = s),
      }),
    );
    next(); // step 1 -> 2 (settings) — the hint on step 1 doesn't touch settings
    const form = card().querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(saved).not.toBeNull();
    expect(saved!.soundGuidance).toBe(DEFAULT_SETTINGS.soundGuidance);
    expect(DEFAULT_SETTINGS.soundGuidance).toBe(false);
  });

  it('is not shown on any other step', () => {
    showOnboarding(makeOptions({ initialSettings: classicSettings() }));
    next(); // -> settings
    expect(card().textContent).not.toContain(t('onboard.audioGuidance.hint'));
    next(); // -> calibration
    expect(card().textContent).not.toContain(t('onboard.audioGuidance.hint'));
  });
});
