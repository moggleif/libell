// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorPage } from './sensorPage';
import type { SensorSourceOptions } from './sensorSourceSection';
import type { EasyLevelStatusOptions } from './easyLevelStatusPage';
import { setLanguage, t } from './i18n';

setLanguage('en');

type Options = SensorSourceOptions & EasyLevelStatusOptions;

function makeOptions(overrides: Partial<Options> = {}): Options {
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
    getCalibratedTilt: () => null,
    getEasyLevelDeviceId: () => null,
    getEasyLevelLastSampleAt: () => null,
    getEasyLevelRawAccel: () => null,
    getEasyLevelStatusBytes: () => null,
    getEasyLevelConnectDelay: () => ({ enabled: false, ms: 300 }),
    setEasyLevelConnectDelay: () => {},
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

  // Sensor status page (screen-cleanup follow-up to #133/#129): tapping the
  // sensor row opens a deeper, separately-attached page.
  describe('the nested status page', () => {
    it('starts closed, and clicking the sensor row opens it', () => {
      const page = createSensorPage(makeOptions());
      expect(page.statusElement.hasAttribute('hidden')).toBe(true);
      const statusButton = [...page.element.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Using the phone'),
      )!;
      statusButton.click();
      expect(page.statusElement.hasAttribute('hidden')).toBe(false);
      expect(page.statusElement.textContent).toContain('Sensor status');
    });

    it('refreshLive() is a no-op while the status page is closed', () => {
      const getEasyLevelStatus = vi.fn(() => null);
      const page = createSensorPage(makeOptions({ getEasyLevelStatus }));
      getEasyLevelStatus.mockClear();
      page.refreshLive();
      expect(getEasyLevelStatus).not.toHaveBeenCalled();
    });

    it('refreshLive() re-reads live values once the status page is open', () => {
      let battery = 80;
      const page = createSensorPage(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getEasyLevelStatus: () => ({
            firmwareTier: 7,
            batteryPercent: battery,
            temperatureCelsius: 20,
          }),
        }),
      );
      const statusButton = [...page.element.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Connected to the EasyLevel sensor'),
      )!;
      statusButton.click();
      expect(page.statusElement.textContent).toContain('Battery: 80%');
      battery = 55;
      page.refreshLive();
      expect(page.statusElement.textContent).toContain('Battery: 55%');
    });
  });
});
