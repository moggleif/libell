// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorPage } from './sensorPage';
import type { SensorSourceOptions } from './sensorSourceSection';
import { setLanguage, t } from './i18n';

setLanguage('en');

function makeOptions(overrides: Partial<SensorSourceOptions> = {}): SensorSourceOptions {
  return {
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

// External sensor page (screen-cleanup follow-up): its own standalone
// page, reached only from the top-right sensor-status icon now that the
// ☰ menu no longer carries an "External sensor" entry.
describe('createSensorPage', () => {
  it('starts closed; attach() opens straight to the connect flow with a ✕ close', () => {
    const page = createSensorPage(makeOptions());
    const button = document.createElement('button');
    page.attach(button);
    expect(page.isOpen()).toBe(false);

    button.click();
    expect(page.isOpen()).toBe(true);
    expect(page.element.querySelector('.menu-page__back')?.textContent).toBe('✕');
    expect(page.element.textContent).toContain('EasyLevel');

    button.click();
    expect(page.isOpen()).toBe(false);
  });

  it("open() opens it programmatically — the sensor-status icon's own trigger", () => {
    const page = createSensorPage(makeOptions());
    page.open();
    expect(page.isOpen()).toBe(true);
  });

  it('wires the Connect button to connectEasyLevel()', () => {
    const connectEasyLevel = vi.fn(() => Promise.resolve<'granted'>('granted'));
    const page = createSensorPage(makeOptions({ connectEasyLevel }));
    page.open();
    const button = [...page.element.querySelectorAll('button')].find(
      (b) => b.textContent === t('sensorSource.connect'),
    )!;
    button.click();
    expect(connectEasyLevel).toHaveBeenCalledOnce();
  });
});
