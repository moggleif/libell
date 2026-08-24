// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createIndicators } from './indicators';

describe('createIndicators', () => {
  it('applies the first update synchronously, with no pending transition (regression: broke the demo-mode smoke test)', () => {
    const indicators = createIndicators(vi.fn());
    document.body.append(indicators.element);
    // Demo mode's settings/calibration are already configured — both
    // lamps must be hidden the instant this first update runs, not
    // after a CSS transition settles.
    indicators.update({ settingsSaved: true, calibrated: true });
    const lamps = indicators.element.querySelectorAll<HTMLButtonElement>('.indicators__lamp');
    for (const lamp of lamps) expect(lamp.hidden).toBe(true);
  });

  it('shows a lamp instantly on first update when its condition is unmet', () => {
    const indicators = createIndicators(vi.fn());
    document.body.append(indicators.element);
    indicators.update({ settingsSaved: false, calibrated: true });
    const [settingsLamp, calibrationLamp] =
      indicators.element.querySelectorAll<HTMLButtonElement>('.indicators__lamp');
    expect(settingsLamp!.hidden).toBe(false);
    expect(calibrationLamp!.hidden).toBe(true);
  });

  it('animates later changes: hidden stays false until the transition settles', () => {
    const indicators = createIndicators(vi.fn());
    document.body.append(indicators.element);
    indicators.update({ settingsSaved: true, calibrated: true }); // first — instant
    const [settingsLamp] =
      indicators.element.querySelectorAll<HTMLButtonElement>('.indicators__lamp');

    // A later change (e.g. the user cleared their saved settings) animates.
    indicators.update({ settingsSaved: false, calibrated: true });
    expect(settingsLamp!.hidden).toBe(false); // shows immediately, correct either way

    indicators.update({ settingsSaved: true, calibrated: true });
    expect(settingsLamp!.hidden).toBe(false); // still mid fade-out
    settingsLamp!.dispatchEvent(new Event('transitionend'));
    expect(settingsLamp!.hidden).toBe(true);
  });
});
