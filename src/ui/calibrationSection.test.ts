// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { setLanguage } from './i18n';
import type { Calibration } from '../domain/settings';

setLanguage('en');

function makeOptions(overrides: Partial<CalibrationOptions> = {}): CalibrationOptions {
  return {
    appearance: 'classic',
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

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  return [...root.querySelectorAll('button')].find((b) => b.textContent === text)!;
}

describe('calibration section (#83)', () => {
  it('shows both calibrations with their own status', () => {
    let vehicle: Calibration | null = { rollDeg: 0.4, pitchDeg: 0.2 };
    const section = createCalibrationSection(
      makeOptions({
        getCalibration: () => ({ rollDeg: 1.0, pitchDeg: -0.5 }),
        getVehicleCalibration: () => vehicle,
      }),
    );
    const statuses = [...section.element.querySelectorAll('.menu__text--status')].map(
      (s) => s.textContent,
    );
    expect(statuses.some((s) => s?.includes('Calibrated: side/side 1.0'))).toBe(true);
    expect(statuses.some((s) => s?.includes('Vehicle zero: side/side 0.4'))).toBe(true);
  });

  it('sets the current position as level via the host callback', () => {
    const calibrateVehicle = vi.fn<() => string | null>(() => null);
    const section = createCalibrationSection(makeOptions({ calibrateVehicle }));
    buttonByText(section.element, 'Set current position as level').click();
    expect(calibrateVehicle).toHaveBeenCalledTimes(1);
  });

  it('surfaces a rejection and disables clear while nothing is stored', () => {
    const section = createCalibrationSection(
      makeOptions({ calibrateVehicle: () => 'not level enough' }),
    );
    const clear = buttonByText(section.element, 'Clear vehicle zero');
    expect(clear.disabled).toBe(true);
    buttonByText(section.element, 'Set current position as level').click();
    expect(
      [...section.element.querySelectorAll('.menu__text--status')].some(
        (s) => s.textContent === 'not level enough',
      ),
    ).toBe(true);
  });

  it('shows each calibration age and runs the check flow (#87)', () => {
    const twoWeeksAgo = Date.now() - 14 * 86_400_000;
    const checkCalibration = vi.fn<() => string>(() => 'Still good — off by 0.1°.');
    const section = createCalibrationSection(
      makeOptions({
        getCalibration: () => ({ rollDeg: 1.0, pitchDeg: -0.5 }),
        getCalibrationCapturedAt: () => twoWeeksAgo,
        checkCalibration,
      }),
    );
    const statuses = () =>
      [...section.element.querySelectorAll('.menu__text--status')].map((s) => s.textContent);
    expect(statuses().some((s) => s?.includes('(14 days ago)'))).toBe(true);
    const check = [...section.element.querySelectorAll('button')].filter(
      (b) => b.textContent === 'Check',
    );
    expect(check).toHaveLength(2);
    expect(check[1]!.disabled).toBe(true); // no vehicle zero stored
    check[0]!.click();
    expect(checkCalibration).toHaveBeenCalledTimes(1);
    expect(statuses().some((s) => s === 'Still good — off by 0.1°.')).toBe(true);
  });

  it('clears the vehicle zero via the host callback', () => {
    let vehicle: Calibration | null = { rollDeg: 0.4, pitchDeg: 0.2 };
    const section = createCalibrationSection(
      makeOptions({
        getVehicleCalibration: () => vehicle,
        clearVehicleCalibration: () => {
          vehicle = null;
        },
      }),
    );
    const clear = buttonByText(section.element, 'Clear vehicle zero');
    expect(clear.disabled).toBe(false);
    clear.click();
    expect(clear.disabled).toBe(true);
  });
});

describe('calibration section — Modern two-card layout (#109)', () => {
  it('renders two cards, each with its own status pill', () => {
    const section = createCalibrationSection(makeOptions({ appearance: 'modern' }));
    const cards = section.element.querySelectorAll('.calibration-card');
    expect(section.element.className).toBe('calibration-cards');
    expect(cards).toHaveLength(2);
    const pills = section.element.querySelectorAll('.calibration-card__pill');
    expect(pills).toHaveLength(2);
    expect(pills[0]!.textContent).toBe('NOT DONE');
    expect(pills[1]!.textContent).toBe('NONE');
  });

  it('flips both pills to the done look once each calibration is set', () => {
    const section = createCalibrationSection(
      makeOptions({
        appearance: 'modern',
        getCalibration: () => ({ rollDeg: 1.0, pitchDeg: -0.5 }),
        getVehicleCalibration: () => ({ rollDeg: 0.4, pitchDeg: 0.2 }),
      }),
    );
    const pills = section.element.querySelectorAll('.calibration-card__pill');
    expect(pills[0]!.textContent).toBe('DONE');
    expect(pills[0]!.className).toContain('calibration-card__pill--done');
    expect(pills[1]!.textContent).toBe('DONE');
    expect(pills[1]!.className).toContain('calibration-card__pill--done');
  });

  it('the sensor pill updates live when "Calibrate now" succeeds', () => {
    const calibrate = vi.fn<() => string | null>(() => null);
    let calibrated: Calibration | null = null;
    const section = createCalibrationSection(
      makeOptions({
        appearance: 'modern',
        calibrate,
        applyCalibration: (c) => {
          calibrated = c;
        },
        getCalibration: () => calibrated,
      }),
    );
    const pill = section.element.querySelector('.calibration-card__pill')!;
    expect(pill.textContent).toBe('NOT DONE');
    buttonByText(section.element, 'Calibrate now').click();
    expect(calibrate).toHaveBeenCalledTimes(1);
    expect(pill.textContent).toBe('NOT DONE'); // calibrate() itself doesn't call applyCalibration
  });

  // Design review: the vehicle-zero card used to show its roll/pitch only
  // buried inside a status sentence, unlike the phone card's own numeric
  // readout box — both now show numbers the same way.
  it('shows the side/side and front/back readings for both the phone and the vehicle zero once calibrated', () => {
    const section = createCalibrationSection(
      makeOptions({
        appearance: 'modern',
        getCalibration: () => ({ rollDeg: 1.2, pitchDeg: -3.4 }),
        getVehicleCalibration: () => ({ rollDeg: 0.4, pitchDeg: 0.2 }),
      }),
    );
    const values = [...section.element.querySelectorAll('.calibration-card__reading-value')].map(
      (v) => v.textContent,
    );
    expect(values).toEqual(['1.2°', '-3.4°', '0.4°', '0.2°']);
  });

  it('shows a dash placeholder for both readouts before anything is calibrated', () => {
    const section = createCalibrationSection(makeOptions({ appearance: 'modern' }));
    const values = [...section.element.querySelectorAll('.calibration-card__reading-value')].map(
      (v) => v.textContent,
    );
    expect(values).toEqual(['—', '—', '—', '—']);
  });

  it('wires every button to the same host callbacks as Classic mode', () => {
    const calibrate = vi.fn<() => string | null>(() => null);
    const clearCalibration = vi.fn();
    const calibrateVehicle = vi.fn<() => string | null>(() => null);
    const clearVehicleCalibration = vi.fn();
    const checkCalibration = vi.fn<() => string>(() => 'checked');
    const checkVehicleCalibration = vi.fn<() => string>(() => 'checked');
    const applyCalibration = vi.fn();
    const section = createCalibrationSection(
      makeOptions({
        appearance: 'modern',
        // Non-null so Clear/Check start enabled (as they would once the
        // host actually has something stored).
        getCalibration: () => ({ rollDeg: 1.0, pitchDeg: -0.5 }),
        getVehicleCalibration: () => ({ rollDeg: 0.4, pitchDeg: 0.2 }),
        calibrate,
        clearCalibration,
        calibrateVehicle,
        clearVehicleCalibration,
        checkCalibration,
        checkVehicleCalibration,
        applyCalibration,
      }),
    );

    buttonByText(section.element, 'Calibrate now').click();
    expect(calibrate).toHaveBeenCalledTimes(1);

    buttonByText(section.element, 'Clear calibration').click();
    expect(clearCalibration).toHaveBeenCalledTimes(1);

    buttonByText(section.element, 'Check').click(); // sensor check — first "Check" in DOM order
    expect(checkCalibration).toHaveBeenCalledTimes(1);
    expect(checkVehicleCalibration).not.toHaveBeenCalled();

    buttonByText(section.element, 'Set current position as level').click();
    expect(calibrateVehicle).toHaveBeenCalledTimes(1);

    buttonByText(section.element, 'Clear vehicle zero').click();
    expect(clearVehicleCalibration).toHaveBeenCalledTimes(1);

    // The flip flow (#50): first click captures, second click (after a
    // fresh reading) applies via applyCalibration — same as Classic.
    buttonByText(section.element, 'Calibrate by flipping').click();
    buttonByText(section.element, 'Capture').click();
    expect(applyCalibration).toHaveBeenCalledTimes(1);
  });

  it('the vehicle-zero action button is secondary-styled, unlike the filled sensor button', () => {
    const section = createCalibrationSection(makeOptions({ appearance: 'modern' }));
    const calibrateBtn = buttonByText(section.element, 'Calibrate now');
    const vehicleBtn = buttonByText(section.element, 'Set current position as level');
    expect(calibrateBtn.className).not.toContain('menu__action--secondary');
    expect(vehicleBtn.className).toContain('menu__action--secondary');
  });
});
