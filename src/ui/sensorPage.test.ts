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
    getEasyLevelMounting: () => 'standard',
    setEasyLevelMounting: () => {},
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
    it('starts closed, and clicking the sensor row opens it once the box is the source', () => {
      // The row only leads anywhere while EasyLevel is actually the active
      // source — the page behind it is that box's own (#244).
      const page = createSensorPage(
        makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'granted' }),
      );
      expect(page.statusElement.hasAttribute('hidden')).toBe(true);
      const statusButton = page.element.querySelector<HTMLButtonElement>(
        '.sensor-row__status-button',
      )!;
      statusButton.click();
      expect(page.statusElement.hasAttribute('hidden')).toBe(false);
      expect(page.statusElement.textContent).toContain('EasyLevel sensor');
    });

    it('stays closed while the phone is the source — that row is plain text (#244)', () => {
      const page = createSensorPage(makeOptions());
      const row = page.element.querySelector<HTMLButtonElement>('.sensor-row__status-button')!;
      row.click();
      expect(page.statusElement.hasAttribute('hidden')).toBe(true);
    });

    it('puts the connect half on the list page and the settings half on the sensor page (#226)', () => {
      const page = createSensorPage(
        makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'granted' }),
      );
      // The list page is only about picking/connecting a source.
      expect(page.element.textContent).toContain('Connect');
      expect(page.element.textContent).not.toContain('Sensor mounting');
      expect(page.element.textContent).not.toContain('Installation offset');
      expect(page.element.textContent).not.toContain('Battery');
      // Per-device settings and health live on the sensor's own page.
      expect(page.statusElement.textContent).toContain('Sensor mounting');
      expect(page.statusElement.textContent).toContain('Installation offset');
      expect(page.statusElement.textContent).toContain('Battery');
    });

    it('shows the settings blocks straight after connecting, with no close-and-reopen (#226)', async () => {
      // The blocks are revealed by `sensorSourceSection.refresh()`, which
      // the connect handler itself deliberately does not call (it only
      // relabels its buttons). Opening the sensor page refreshes on the
      // way in, so connecting and going straight there must already show
      // them populated — pinned here because that ordering is easy to
      // lose in a later refactor and fails only in the running app.
      let source: 'phone' | 'easylevel' = 'phone';
      const page = createSensorPage(
        makeOptions({
          getSensorSource: () => source,
          getSensorState: () => 'granted',
          connectEasyLevel: () => {
            source = 'easylevel';
            return Promise.resolve('granted');
          },
          getEasyLevelMounting: () => 'rotated180',
        }),
      );
      const connect = [...page.element.querySelectorAll('button')].find(
        (b) => b.textContent === 'Connect EasyLevel sensor',
      )!;
      connect.click();
      await Promise.resolve();
      await Promise.resolve();

      // Straight in via the sensor row — no closing the list page first.
      const statusButton = [...page.element.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Connected to the EasyLevel sensor'),
      )!;
      statusButton.click();

      const mountingHeading = [...page.statusElement.querySelectorAll('h3')].find(
        (h) => h.textContent === 'Sensor mounting',
      );
      expect(mountingHeading?.closest('[hidden]')).toBeNull();
      // Populated from the current setting, not left at its initial value.
      expect(page.statusElement.querySelector('select')?.value).toBe('rotated180');
      expect(page.statusElement.textContent).toContain('No installation offset');
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
            calibration: null,
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
