// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createEasyLevelStatusPage, type EasyLevelStatusOptions } from './easyLevelStatusPage';
import { setLanguage, t } from './i18n';

setLanguage('en');

function makeOptions(overrides: Partial<EasyLevelStatusOptions> = {}): EasyLevelStatusOptions {
  return {
    getSensorSource: () => 'phone',
    getSensorState: () => 'granted',
    getEasyLevelStatus: () => null,
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
          calibration: null,
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

  it('shows the live calibrated reading for either sensor source', () => {
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
        getEasyLevelStatus: () => ({
          firmwareTier: 3,
          batteryPercent: 15,
          temperatureCelsius: 20,
          calibration: null,
        }),
      }),
    );
    expect(page.element.textContent).toContain('Low battery');
  });

  it('never shows the low-battery warning while battery is healthy', () => {
    const page = createEasyLevelStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getEasyLevelStatus: () => ({
          firmwareTier: 3,
          batteryPercent: 90,
          temperatureCelsius: 20,
          calibration: null,
        }),
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
          calibration: null,
        }),
      }),
    );
    expect(page.element.textContent).toContain('Battery: 80%');
    battery = 60;
    page.refresh();
    expect(page.element.textContent).toContain('Battery: 60%');
  });

  describe('debug info (EasyLevel only)', () => {
    it('is hidden entirely while the phone sensor is active', () => {
      const page = createEasyLevelStatusPage(makeOptions({ getSensorSource: () => 'phone' }));
      const details = page.element.querySelector('details');
      expect(details?.hidden).toBe(true);
    });

    it('shows, closed by default, once EasyLevel is the active source', () => {
      const page = createEasyLevelStatusPage(makeOptions({ getSensorSource: () => 'easylevel' }));
      const details = page.element.querySelector('details');
      expect(details?.hidden).toBe(false);
      expect(details?.open).toBe(false);
    });

    it('shows the device id, raw accelerometer vector, firmware tier and raw status bytes as hex', () => {
      const page = createEasyLevelStatusPage(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getEasyLevelDeviceId: () => 'device-42',
          getEasyLevelRawAccel: () => ({ x: 120, y: -45, z: 980 }),
          getEasyLevelStatus: () => ({
            firmwareTier: 3,
            batteryPercent: 80,
            temperatureCelsius: 20,
            calibration: null,
          }),
          getEasyLevelStatusBytes: () => new Uint8Array([0, 10, 0x32, 0xff]),
        }),
      );
      const text = page.element.textContent ?? '';
      expect(text).toContain('device-42');
      expect(text).toContain('120, -45, 980');
      expect(text).toContain('Firmware tier: 3');
      expect(text).toContain('00 0a 32 ff');
    });

    it('shows "not available yet" for every raw field before anything has arrived', () => {
      const page = createEasyLevelStatusPage(makeOptions({ getSensorSource: () => 'easylevel' }));
      const text = page.element.textContent ?? '';
      const notAvailableCount = (text.match(/Not available yet/g) ?? []).length;
      // Device ID, raw accelerometer, firmware tier, raw status bytes — plus
      // the battery/temperature rows above the disclosure.
      expect(notAvailableCount).toBeGreaterThanOrEqual(6);
    });

    it('copies a plain-text debug summary to the clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const page = createEasyLevelStatusPage(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getEasyLevelDeviceId: () => 'device-42',
          getEasyLevelStatusBytes: () => new Uint8Array([1, 2]),
        }),
      );
      const copyButton = [...page.element.querySelectorAll('button')].find(
        (b) => b.textContent === t('sensorStatus.debug.copy'),
      )!;
      copyButton.click();
      await Promise.resolve();
      expect(writeText).toHaveBeenCalledOnce();
      expect(writeText.mock.calls[0]![0]).toContain('device-42');
      expect(writeText.mock.calls[0]![0]).toContain('01 02');
    });

    describe('connect-delay workaround (#212)', () => {
      function checkboxAndNumberInput(page: ReturnType<typeof createEasyLevelStatusPage>) {
        const checkbox = page.element.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
        const number = page.element.querySelector<HTMLInputElement>('input[type="number"]')!;
        return { checkbox, number };
      }

      it('reflects the stored enabled/ms values once the page is opened', () => {
        const page = createEasyLevelStatusPage(
          makeOptions({ getEasyLevelConnectDelay: () => ({ enabled: true, ms: 750 }) }),
        );
        page.open();
        const { checkbox, number } = checkboxAndNumberInput(page);
        expect(checkbox.checked).toBe(true);
        expect(number.value).toBe('750');
        expect(number.disabled).toBe(false);
      });

      it('disables the ms field while the toggle is off', () => {
        const page = createEasyLevelStatusPage(
          makeOptions({ getEasyLevelConnectDelay: () => ({ enabled: false, ms: 300 }) }),
        );
        page.open();
        expect(checkboxAndNumberInput(page).number.disabled).toBe(true);
      });

      it('does not reset the ms field on every refresh() — only on open()', () => {
        // Regression guard: refresh() runs every animation frame while the
        // page is open (`sensorPage.ts`'s refreshLive()); if it also reset
        // this field from the stored value, mid-edit keystrokes would be
        // fought on the very next frame.
        const page = createEasyLevelStatusPage(
          makeOptions({ getEasyLevelConnectDelay: () => ({ enabled: true, ms: 300 }) }),
        );
        page.open();
        const { number } = checkboxAndNumberInput(page);
        number.value = '1234';
        page.refresh();
        expect(number.value).toBe('1234');
      });

      it('commits enabled + ms together, clamped/parsed by the caller, on either control changing', () => {
        const setEasyLevelConnectDelay = vi.fn();
        const page = createEasyLevelStatusPage(
          makeOptions({
            getEasyLevelConnectDelay: () => ({ enabled: false, ms: 300 }),
            setEasyLevelConnectDelay,
          }),
        );
        page.open();
        const { checkbox, number } = checkboxAndNumberInput(page);

        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        expect(setEasyLevelConnectDelay).toHaveBeenLastCalledWith(true, 300);

        number.value = '900';
        number.dispatchEvent(new Event('change'));
        expect(setEasyLevelConnectDelay).toHaveBeenLastCalledWith(true, 900);
      });
    });
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
