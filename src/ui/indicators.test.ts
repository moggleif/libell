// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createIndicators, phoneCalibrationLamp } from './indicators';
import { t } from './i18n';

describe('createIndicators', () => {
  it('applies the first update synchronously, with no pending transition (regression: broke the demo-mode smoke test)', () => {
    const indicators = createIndicators(vi.fn());
    document.body.append(indicators.element);
    // Demo mode's settings/calibration are already configured — both
    // lamps must be hidden the instant this first update runs, not
    // after a CSS transition settles.
    indicators.update({ settingsSaved: true, calibrationLamp: null });
    const lamps = indicators.element.querySelectorAll<HTMLButtonElement>('.indicators__lamp');
    for (const lamp of lamps) expect(lamp.hidden).toBe(true);
  });

  it('shows a lamp instantly on first update when its condition is unmet', () => {
    const indicators = createIndicators(vi.fn());
    document.body.append(indicators.element);
    indicators.update({ settingsSaved: false, calibrationLamp: null });
    const [settingsLamp, calibrationLamp] =
      indicators.element.querySelectorAll<HTMLButtonElement>('.indicators__lamp');
    expect(settingsLamp!.hidden).toBe(false);
    expect(calibrationLamp!.hidden).toBe(true);
  });

  it('animates later changes: hidden stays false until the transition settles', () => {
    const indicators = createIndicators(vi.fn());
    document.body.append(indicators.element);
    indicators.update({ settingsSaved: true, calibrationLamp: null }); // first — instant
    const [settingsLamp] =
      indicators.element.querySelectorAll<HTMLButtonElement>('.indicators__lamp');

    // A later change (e.g. the user cleared their saved settings) animates.
    indicators.update({ settingsSaved: false, calibrationLamp: null });
    expect(settingsLamp!.hidden).toBe(false); // shows immediately, correct either way

    indicators.update({ settingsSaved: true, calibrationLamp: null });
    expect(settingsLamp!.hidden).toBe(false); // still mid fade-out
    settingsLamp!.dispatchEvent(new Event('transitionend'));
    expect(settingsLamp!.hidden).toBe(true);
  });

  it('names the sensor, not the phone, while an external sensor is what lacks calibration', () => {
    const indicators = createIndicators(vi.fn());
    indicators.update({ settingsSaved: true, calibrationLamp: 'zero', usesBox: true });
    const [, calibrationLamp] =
      indicators.element.querySelectorAll<HTMLButtonElement>('.indicators__lamp');
    expect(calibrationLamp!.title).toBe(t('lamp.calibrate.title.sensor'));
    expect(calibrationLamp!.getAttribute('aria-label')).toBe(
      `${t('lamp.zero')}. ${t('lamp.calibrate.title.sensor')}`,
    );

    indicators.update({ settingsSaved: true, calibrationLamp: 'calibrate' });
    expect(calibrationLamp!.title).toBe(t('lamp.calibrate.title'));
  });

  // #349: with a box, the missing step is its zero, not a calibration, so
  // the lamp says so in the box page's own word.
  it('reads "Zero" while an external sensor lacks its zero, "Calibrate" for the phone', () => {
    const indicators = createIndicators(vi.fn());
    indicators.update({ settingsSaved: true, calibrationLamp: 'zero', usesBox: true });
    const [, calibrationLamp] =
      indicators.element.querySelectorAll<HTMLButtonElement>('.indicators__lamp');
    expect(calibrationLamp!.textContent).toBe(t('lamp.zero'));

    indicators.update({ settingsSaved: true, calibrationLamp: 'calibrate' });
    expect(calibrationLamp!.textContent).toBe(t('lamp.calibrate'));
  });

  // #364: the phone gets ⚠ Zero too, once it is calibrated but the
  // vehicle is not zeroed — help promised it, the lamp never showed it.
  it('reads "Zero" with its own title for the phone once only the vehicle zero is missing', () => {
    const indicators = createIndicators(vi.fn());
    indicators.update({ settingsSaved: true, calibrationLamp: 'zero' });
    const [, calibrationLamp] =
      indicators.element.querySelectorAll<HTMLButtonElement>('.indicators__lamp');
    expect(calibrationLamp!.hidden).toBe(false);
    expect(calibrationLamp!.textContent).toBe(t('lamp.zero'));
    expect(calibrationLamp!.title).toBe(t('lamp.zero.title'));
  });
});

describe('phoneCalibrationLamp', () => {
  it('asks to calibrate the phone first', () => {
    expect(phoneCalibrationLamp(false, false)).toBe('calibrate');
    expect(phoneCalibrationLamp(false, true)).toBe('calibrate');
  });

  it('asks to zero the vehicle once the phone is calibrated', () => {
    expect(phoneCalibrationLamp(true, false)).toBe('zero');
  });

  it('is out once both are done', () => {
    expect(phoneCalibrationLamp(true, true)).toBeNull();
  });
});
