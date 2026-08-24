// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { setLanguage } from './i18n';
import type { Calibration } from '../domain/settings';

setLanguage('en');

function makeOptions(overrides: Partial<CalibrationOptions> = {}): CalibrationOptions {
  return {
    getCalibration: () => null,
    calibrate: () => null,
    readTilt: () => ({ rollDeg: 0, pitchDeg: 0 }),
    applyCalibration: () => {},
    clearCalibration: () => {},
    getVehicleCalibration: () => null,
    calibrateVehicle: () => null,
    clearVehicleCalibration: () => {},
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
