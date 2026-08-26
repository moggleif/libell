// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createEasyLevelStatusPage } from './easyLevelStatusPage';
import type { DiagnosticsOptions } from './diagnosticsSection';
import { setLanguage, t } from './i18n';

setLanguage('en');

function makeOptions(overrides: Partial<DiagnosticsOptions> = {}): DiagnosticsOptions {
  return {
    getSensorSource: () => 'phone',
    getSensorState: () => 'granted',
    getLastSampleAt: () => null,
    getRawTilt: () => null,
    getCalibratedTilt: () => null,
    getActiveTargetName: () => null,
    getEasyLevelStatus: () => null,
    ...overrides,
  };
}

describe('createEasyLevelStatusPage', () => {
  it('shows the phone-sensor status and "not available yet" battery/temperature while the phone is active', () => {
    const page = createEasyLevelStatusPage(makeOptions());
    expect(page.element.textContent).toContain(t('sensorSource.status.phone'));
    expect(page.element.textContent).toContain('Not available yet');
  });

  it('shows real battery/temperature once EasyLevel is active and a status notification has arrived (#123)', () => {
    const page = createEasyLevelStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getEasyLevelStatus: () => ({
          firmwareTier: 3,
          batteryPercent: 72,
          temperatureCelsius: 19.5,
        }),
      }),
    );
    expect(page.element.textContent).toContain('Battery: 72%');
    expect(page.element.textContent).toContain('Temperature: 19.5°C');
  });

  it('shows a distinct disconnected status once the connection is lost (#129), not the plain "connected" text', () => {
    const page = createEasyLevelStatusPage(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'disconnected' }),
    );
    expect(page.element.textContent).toContain(t('sensorSource.status.disconnected'));
  });

  it('shows the live calibrated reading, reusing diagnostics\' own "roll/pitch" wording', () => {
    const page = createEasyLevelStatusPage(
      makeOptions({ getCalibratedTilt: () => ({ rollDeg: 1.2, pitchDeg: -0.3 }) }),
    );
    expect(page.element.textContent).toContain('roll 1.2°');
    expect(page.element.textContent).toContain('pitch -0.3°');
  });

  it('surfaces the low-battery warning below the threshold (#123), reusing the exact inline-detail wording', () => {
    const page = createEasyLevelStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getEasyLevelStatus: () => ({ firmwareTier: 3, batteryPercent: 15, temperatureCelsius: 20 }),
      }),
    );
    expect(page.element.textContent).toContain('Low battery');
  });

  it('never shows the low-battery warning while battery is healthy', () => {
    const page = createEasyLevelStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getEasyLevelStatus: () => ({ firmwareTier: 3, batteryPercent: 90, temperatureCelsius: 20 }),
      }),
    );
    expect(page.element.textContent).not.toContain('Low battery');
  });

  it('re-reads every value on refresh() — a live battery reading updates without reopening the page', () => {
    let battery = 80;
    const page = createEasyLevelStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getEasyLevelStatus: () => ({
          firmwareTier: 3,
          batteryPercent: battery,
          temperatureCelsius: 20,
        }),
      }),
    );
    expect(page.element.textContent).toContain('Battery: 80%');
    battery = 60;
    page.refresh();
    expect(page.element.textContent).toContain('Battery: 60%');
  });

  it('embeds the debug info as a closed-by-default <details> disclosure, reusing createDiagnosticsSection verbatim', () => {
    const page = createEasyLevelStatusPage(
      makeOptions({ getActiveTargetName: () => 'Shower drain' }),
    );
    const details = page.element.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    // The universal Diagnostics section's own rows (source/state/sample
    // rate/target/version/"Copy diagnostics") live inside, not duplicated.
    expect(details?.textContent).toContain('Shower drain');
    expect(details?.textContent).toContain(t('diagnostics.copy'));
  });

  it('open()/close()/isOpen() delegate to the underlying standalone page', () => {
    const page = createEasyLevelStatusPage(makeOptions());
    expect(page.isOpen()).toBe(false);
    page.open();
    expect(page.isOpen()).toBe(true);
    page.close();
    expect(page.isOpen()).toBe(false);
  });
});
