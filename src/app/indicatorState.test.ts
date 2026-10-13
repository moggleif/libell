import { describe, expect, it } from 'vitest';
import { indicatorState, type IndicatorInputs } from './indicatorState';

const phone: IndicatorInputs = {
  demo: false,
  measurementsSaved: true,
  phoneActive: true,
  boxPending: false,
  phoneCalibrated: true,
  phoneZeroed: true,
  boxZeroed: false,
};
const box: IndicatorInputs = { ...phone, phoneActive: false, phoneCalibrated: false };

describe('indicatorState', () => {
  it('lights nothing for a calibrated, zeroed phone with measurements', () => {
    expect(indicatorState(phone)).toEqual({
      settingsSaved: true,
      calibrationLamp: null,
      usesBox: false,
    });
  });

  it('follows the measurements for the setup lamp', () => {
    expect(indicatorState({ ...phone, measurementsSaved: false }).settingsSaved).toBe(false);
  });

  it('asks the phone to calibrate first, then to zero', () => {
    expect(indicatorState({ ...phone, phoneCalibrated: false }).calibrationLamp).toBe('calibrate');
    expect(
      indicatorState({ ...phone, phoneCalibrated: false, phoneZeroed: false }).calibrationLamp,
    ).toBe('calibrate');
    expect(indicatorState({ ...phone, phoneZeroed: false }).calibrationLamp).toBe('zero');
  });

  it("asks a box for its zero, whatever the phone's state", () => {
    expect(indicatorState(box)).toEqual({
      settingsSaved: true,
      calibrationLamp: 'zero',
      usesBox: true,
    });
    expect(indicatorState({ ...box, phoneCalibrated: true }).calibrationLamp).toBe('zero');
  });

  it('lights nothing for a zeroed box, however uncalibrated the phone', () => {
    expect(indicatorState({ ...box, boxZeroed: true }).calibrationLamp).toBeNull();
  });

  it('asks for the box while one chosen in the wizard is not connected', () => {
    expect(indicatorState({ ...phone, boxPending: true })).toEqual({
      settingsSaved: true,
      calibrationLamp: 'zero',
      usesBox: true,
    });
  });

  it('ignores a pending box once a box is active', () => {
    expect(indicatorState({ ...box, boxPending: true, boxZeroed: true })).toEqual({
      settingsSaved: true,
      calibrationLamp: null,
      usesBox: true,
    });
  });

  it('presents demo mode as configured', () => {
    const fresh: IndicatorInputs = {
      ...phone,
      demo: true,
      measurementsSaved: false,
      phoneCalibrated: false,
      phoneZeroed: false,
    };
    expect(indicatorState(fresh)).toEqual({
      settingsSaved: true,
      calibrationLamp: null,
      usesBox: false,
    });
    expect(indicatorState({ ...box, demo: true }).calibrationLamp).toBeNull();
  });
});
