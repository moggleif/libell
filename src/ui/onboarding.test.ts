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
