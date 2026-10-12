// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createBoxStatusPage, type BoxStatusOptions } from './boxStatusPage';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import { XPARKLE_DESCRIPTOR } from '../sensor/xparkleSensor';
import { setLanguage, t } from './i18n';

setLanguage('en');

function makeOptions(overrides: Partial<BoxStatusOptions> = {}): BoxStatusOptions {
  return {
    sensor: EASYLEVEL_DESCRIPTOR,
    getSensorSource: () => 'phone',
    getSensorState: () => 'granted',
    getHealth: () => null,
    getCalibratedTilt: () => null,
    getDeviceId: () => null,
    getLastSampleAt: () => null,
    getRawAccel: () => null,
    getEasyLevelStatusBytes: () => null,
    getEasyLevelConnectDelay: () => ({ enabled: false, ms: 300 }),
    setEasyLevelConnectDelay: () => {},
    ...overrides,
  };
}

describe('createBoxStatusPage', () => {
  it('shows the phone-sensor status and "not available yet" battery/temperature while the phone is active', () => {
    const page = createBoxStatusPage(makeOptions());
    expect(page.element.textContent).toContain(t('box.state.notConnected'));
    expect(page.element.textContent).toContain('Not available yet');
  });

  it('shows real battery/temperature once EasyLevel is active and a status notification has arrived (#123)', () => {
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getHealth: () => ({
          batteryPercent: 72,
          temperatureCelsius: 19.5,
          firmwareLabel: '3',
        }),
      }),
    );
    // Battery once, in the header (#332); temperature with the debug info.
    expect(page.element.textContent).toContain('Connected · battery 72 %');
    expect(page.element.textContent).not.toContain('Battery: 72%');
    const debug = page.element.querySelector('.sensor-status__debug');
    expect(debug?.textContent).toContain('Temperature: 19.5°C');
  });

  it('no longer repeats the mounting a box reports itself — Libell sets the direction (#290, #332)', () => {
    const health = {
      batteryPercent: 80,
      temperatureCelsius: null,
      firmwareLabel: null,
      reportedOrientation: 'rear' as const,
    };
    const xparkle = createBoxStatusPage(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        getHealth: () => health,
      }),
    );
    expect(xparkle.element.textContent).not.toContain('The box’s own mounting setting');
  });

  it('shows a distinct disconnected status once the connection is lost (#129), not the plain "connected" text', () => {
    const page = createBoxStatusPage(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'disconnected' }),
    );
    expect(page.element.textContent).toContain(t('box.state.lost'));
    expect(page.element.textContent).not.toContain(t('box.state.connected') + ' ·');
    // Never a bare placeholder (#312).
    expect(page.element.textContent).not.toContain('{name}');
  });

  it('shows the live calibrated reading while this box is the source in use', () => {
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getCalibratedTilt: () => ({ rollDeg: 1.2, pitchDeg: -0.3 }),
      }),
    );
    expect(page.element.textContent).toContain('Side/side 1.2°');
    expect(page.element.textContent).toContain('Front/back -0.3°');
  });

  it('shows a dash, never the phone’s or a stale reading, while the box is not delivering (#343)', () => {
    for (const overrides of [
      { getSensorSource: () => 'phone' as const },
      {
        getSensorSource: () => 'easylevel' as const,
        getSensorState: () => 'disconnected' as const,
      },
    ]) {
      const page = createBoxStatusPage(
        makeOptions({ ...overrides, getCalibratedTilt: () => ({ rollDeg: 30.9, pitchDeg: 74.8 }) }),
      );
      expect(page.element.textContent).not.toContain('30.9');
      expect(page.element.textContent).toContain(t('sensorStatus.reading', { value: '—' }));
    }
  });

  it('surfaces the low-battery warning below the threshold (#123), reusing the exact inline-detail wording', () => {
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getHealth: () => ({
          batteryPercent: 15,
          temperatureCelsius: 20,
          firmwareLabel: '3',
        }),
      }),
    );
    expect(page.element.textContent).toContain('Low battery');
  });

  it('never shows the low-battery warning while battery is healthy', () => {
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getHealth: () => ({
          batteryPercent: 90,
          temperatureCelsius: 20,
          firmwareLabel: '3',
        }),
      }),
    );
    expect(page.element.textContent).not.toContain('Low battery');
  });

  // Relocated from `sensorSourceSection.test.ts` by #226, along with the
  // block they cover: these are R32 behaviors that simply live on this
  // page now instead of the External sensor list page.
  it('shows no signal-strength row at all — a field that can never be populated is not displayed (#228)', () => {
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getSensorState: () => 'granted',
        getHealth: () => ({
          batteryPercent: 72,
          temperatureCelsius: 19.5,
          firmwareLabel: '3',
        }),
      }),
    );
    // Battery and temperature are real values; signal strength is gone
    // entirely rather than shown as a permanent "not available yet",
    // which promised a reading Web Bluetooth cannot ever deliver for a
    // connected device.
    expect(page.element.textContent).toContain('Connected · battery 72 %');
    expect(page.element.textContent).toContain('Temperature: 19.5°C');
    expect(page.element.textContent).not.toContain('Signal strength');
  });

  it('still spells out the temperature for a dropped connection — not omitted on disconnect (#226)', () => {
    const page = createBoxStatusPage(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'disconnected' }),
    );
    expect(page.element.textContent).toContain('Temperature: Not available yet');
  });

  it('holds the low-battery warning through the hysteresis band, hiding only once clearly recovered (#123, #226)', () => {
    let battery = 15;
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getHealth: () => ({
          batteryPercent: battery,
          temperatureCelsius: 20,
          firmwareLabel: '3',
        }),
      }),
    );
    // Checked by visibility, not textContent: the row keeps its last text
    // while hidden, so only `hidden` distinguishes "recovered" from
    // "still warning" (the same helper the relocated test used).
    const visibleWarning = () =>
      [...page.element.querySelectorAll<HTMLElement>('.menu__text--warning')].find(
        (el) => !el.hidden,
      );
    expect(visibleWarning()?.textContent).toContain('Low battery');

    // Back above the bare threshold, but still inside the hysteresis band
    // — must not flicker off yet.
    battery = 21;
    page.refresh();
    expect(visibleWarning()).toBeDefined();

    // Clearly above the band now.
    battery = 30;
    page.refresh();
    expect(visibleWarning()).toBeUndefined();
  });

  it('hosts this sensor\u2019s own settings — mounting and installation offset — via settingsSlot (#226)', () => {
    const page = createBoxStatusPage(makeOptions());
    // Empty until `sensorPage.ts` fills it; the slot itself is the
    // contract, and it sits above the debug disclosure.
    expect(page.settingsSlot).toBeInstanceOf(HTMLElement);
    const debugDetails = page.element.querySelector<HTMLDetailsElement>('.sensor-status__debug');
    expect(
      page.settingsSlot.compareDocumentPosition(debugDetails!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('re-reads every value on refresh() — a live battery reading updates without reopening the page', () => {
    let battery = 80;
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getHealth: () => ({
          batteryPercent: battery,
          temperatureCelsius: 20,
          firmwareLabel: '3',
        }),
      }),
    );
    expect(page.element.textContent).toContain('battery 80 %');
    battery = 60;
    page.refresh();
    expect(page.element.textContent).toContain('battery 60 %');
  });

  describe('debug info (EasyLevel only)', () => {
    it('is hidden entirely while the phone sensor is active', () => {
      const page = createBoxStatusPage(makeOptions({ getSensorSource: () => 'phone' }));
      const details = page.element.querySelector<HTMLDetailsElement>('.sensor-status__debug');
      expect(details?.hidden).toBe(true);
    });

    it('shows, closed by default, once EasyLevel is the active source', () => {
      const page = createBoxStatusPage(makeOptions({ getSensorSource: () => 'easylevel' }));
      const details = page.element.querySelector<HTMLDetailsElement>('.sensor-status__debug');
      expect(details?.hidden).toBe(false);
      expect(details?.open).toBe(false);
    });

    it('shows the device id, raw accelerometer vector, firmware tier and raw status bytes as hex', () => {
      const page = createBoxStatusPage(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getDeviceId: () => 'device-42',
          getRawAccel: () => ({ x: 120, y: -45, z: 980 }),
          getHealth: () => ({
            batteryPercent: 80,
            temperatureCelsius: 20,
            firmwareLabel: '3',
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
      const page = createBoxStatusPage(makeOptions({ getSensorSource: () => 'easylevel' }));
      const text = page.element.textContent ?? '';
      const notAvailableCount = (text.match(/Not available yet/g) ?? []).length;
      // Temperature, device ID, raw accelerometer, firmware tier, raw status
      // bytes — the battery lives in the header (#332).
      expect(notAvailableCount).toBeGreaterThanOrEqual(5);
    });

    it('copies a plain-text debug summary to the clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const page = createBoxStatusPage(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getDeviceId: () => 'device-42',
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
      function checkboxAndNumberInput(page: ReturnType<typeof createBoxStatusPage>) {
        const checkbox = page.element.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
        const number = page.element.querySelector<HTMLInputElement>('input[type="number"]')!;
        return { checkbox, number };
      }

      it('reflects the stored enabled/ms values once the page is opened', () => {
        const page = createBoxStatusPage(
          makeOptions({ getEasyLevelConnectDelay: () => ({ enabled: true, ms: 750 }) }),
        );
        page.open();
        const { checkbox, number } = checkboxAndNumberInput(page);
        expect(checkbox.checked).toBe(true);
        expect(number.value).toBe('750');
        expect(number.disabled).toBe(false);
      });

      it('disables the ms field while the toggle is off', () => {
        const page = createBoxStatusPage(
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
        const page = createBoxStatusPage(
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
        const page = createBoxStatusPage(
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
    const page = createBoxStatusPage(makeOptions());
    expect(page.isOpen()).toBe(false);
    page.open();
    expect(page.isOpen()).toBe(true);
    page.close();
    expect(page.isOpen()).toBe(false);
  });

  describe('the header: state in a few words, and the one fix right here (#314)', () => {
    function button(page: { element: HTMLElement }): HTMLButtonElement | null {
      return page.element.querySelector<HTMLButtonElement>('.box-header .menu__action');
    }

    it('says connected with the battery, and offers no button when all is well', () => {
      const page = createBoxStatusPage(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getHealth: () => ({ batteryPercent: 62, temperatureCelsius: null, firmwareLabel: null }),
          connectSensor: () => Promise.resolve('granted'),
        }),
      );
      expect(page.element.textContent).toContain('Connected · battery 62 %');
      expect(button(page)?.hidden).toBe(true);
    });

    it('offers Reconnect on the page itself once the connection is lost', () => {
      const connectSensor = vi.fn(() => Promise.resolve('granted' as const));
      const page = createBoxStatusPage(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getSensorState: () => 'disconnected',
          connectSensor,
        }),
      );
      expect(button(page)?.hidden).toBe(false);
      expect(button(page)?.textContent).toBe(t('sensorFallback.retry'));
      button(page)?.click();
      expect(connectSensor).toHaveBeenCalledOnce();
    });

    it('offers Connect while the box is not the active source', () => {
      const page = createBoxStatusPage(
        makeOptions({ connectSensor: () => Promise.resolve('granted') }),
      );
      expect(button(page)?.hidden).toBe(false);
      expect(button(page)?.textContent).toBe(t('box.connect'));
    });

    it('has no "More" — the footer below the steps hosts Disconnect, debug info stays last (#332)', () => {
      const page = createBoxStatusPage(makeOptions({ getSensorSource: () => 'easylevel' }));
      expect(page.element.querySelector('.box-more')).toBeNull();
      expect(page.element.textContent).not.toContain('More');
      const footer = page.element.querySelector('.box-footer');
      expect(footer).toBe(page.footerSlot);
      const debug = page.element.querySelector('.sensor-status__debug');
      expect(
        footer!.compareDocumentPosition(debug!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('puts the box position at the start of the live tilt line (#332)', () => {
      const page = createBoxStatusPage(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getCalibratedTilt: () => ({ pitchDeg: 0, rollDeg: 0 }),
        }),
      );
      const position = document.createElement('span');
      position.textContent = '✓ Stands upright';
      page.positionSlot.append(position);
      page.refresh();
      const line = page.positionSlot.closest('.box-live');
      expect(line?.textContent?.startsWith('✓ Stands upright · ')).toBe(true);
    });
  });

  describe('silent-reconnect tip (#310)', () => {
    it('sits closed under Advanced when the browser lacks silent reconnect', () => {
      const page = createBoxStatusPage(
        makeOptions({ sensor: XPARKLE_DESCRIPTOR, offersSilentReconnectTip: () => true }),
      );
      const details = page.element.querySelector<HTMLDetailsElement>('.sensor-status__advanced');
      expect(details).not.toBeNull();
      expect(details!.open).toBe(false);
      expect(details!.textContent).toContain(t('sensorStatus.advanced'));
      expect(details!.textContent).toContain('chrome://flags');
    });

    it('copies the chrome://flags address', async () => {
      const writeText = vi.fn(() => Promise.resolve());
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      const page = createBoxStatusPage(makeOptions({ offersSilentReconnectTip: () => true }));
      page.element.querySelector<HTMLButtonElement>('.sensor-status__advanced button')!.click();
      expect(writeText).toHaveBeenCalledWith('chrome://flags');
    });

    it('is not shown when silent reconnect already works', () => {
      const page = createBoxStatusPage(makeOptions({ offersSilentReconnectTip: () => false }));
      expect(page.element.querySelector('.sensor-status__advanced')).toBeNull();
    });
  });
});

describe('a box that rejects its password, on its own page (#367)', () => {
  function rejectingPage(verdict: boolean | null) {
    let rejected = true;
    const tryPassword = vi.fn(() => {
      if (verdict) rejected = false;
      return Promise.resolve(verdict);
    });
    const page = createBoxStatusPage(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        password: { isRejected: () => rejected, tryPassword },
      }),
    );
    page.refresh();
    const block = page.element.querySelector<HTMLElement>('.box-password')!;
    const input = block.querySelector('input')!;
    const retry = [...block.querySelectorAll('button')].find(
      (button) => button.textContent === t('box.password.retry'),
    )!;
    return { page, block, input, retry, tryPassword };
  }

  async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  it('says what to do in Libell, with a code field and one button to try again', () => {
    const { page, block, retry } = rejectingPage(true);
    const header = page.element.querySelector('.box-header__state')!;
    expect(header.textContent).toBe(t('box.state.password'));
    expect(header.classList.contains('is-connected')).toBe(false);
    expect(block.hidden).toBe(false);
    const message = t('sensorSource.err.password', { name: XPARKLE_DESCRIPTOR.displayName });
    expect(block.textContent).toContain(message);
    expect(block.querySelector('input')).not.toBeNull();
    expect(retry).toBeDefined();
  });

  it('tries the typed code and shows Connected once the box accepts it', async () => {
    const { page, block, input, retry, tryPassword } = rejectingPage(true);
    input.value = '1234';
    retry.click();
    expect(tryPassword).toHaveBeenCalledWith('1234');
    await settle();
    page.refresh();
    expect(block.hidden).toBe(true);
    expect(page.element.querySelector('.box-header__state')!.textContent).toContain(
      t('box.state.connected'),
    );
  });

  it('says when the box rejects that code too', async () => {
    const { page, block, input, retry } = rejectingPage(false);
    input.value = '5678';
    retry.click();
    await settle();
    page.refresh();
    expect(block.textContent).toContain(t('box.password.wrong'));
  });

  it('says when the box did not answer, and that the code is kept', async () => {
    const { page, block, input, retry } = rejectingPage(null);
    input.value = '5678';
    retry.click();
    await settle();
    page.refresh();
    expect(block.textContent).toContain(t('box.password.noAnswer'));
  });

  it('explains a code that is not four digits instead of sending it', () => {
    const { block, input, retry, tryPassword } = rejectingPage(true);
    input.value = '12';
    retry.click();
    expect(tryPassword).not.toHaveBeenCalled();
    expect(block.textContent).toContain(t('box.password.invalid'));
  });
});

// Pins (#375) of what the page does for each box, before the page loses
// its EasyLevel name: it serves every registered source, and only the
// descriptor's capabilities decide which rows a box gets.
describe('the same page for every box (#375)', () => {
  const health = { batteryPercent: 15, temperatureCelsius: 21.5, firmwareLabel: '3' };

  for (const sensor of [EASYLEVEL_DESCRIPTOR, XPARKLE_DESCRIPTOR]) {
    describe(sensor.displayName, () => {
      const active = (overrides: Partial<BoxStatusOptions> = {}) =>
        createBoxStatusPage(
          makeOptions({
            sensor,
            getSensorSource: () => sensor.id,
            getHealth: () => health,
            ...overrides,
          }),
        );

      it('is titled after the box', () => {
        expect(active().element.textContent).toContain(
          t('sensorStatus.title', { name: sensor.displayName }),
        );
      });

      it('says connected with the battery while the box is in use', () => {
        expect(active().element.textContent).toContain('Connected · battery 15 %');
      });

      it('warns about a low battery', () => {
        expect(active().element.textContent).toContain('Low battery');
      });

      it('shows the box’s own live tilt', () => {
        const page = active({ getCalibratedTilt: () => ({ rollDeg: 0.7, pitchDeg: -1.4 }) });
        expect(page.element.textContent).toContain('Side/side 0.7°');
        expect(page.element.textContent).toContain('Front/back -1.4°');
      });

      it('says not connected, with a dash for the tilt, while another source is in use', () => {
        const page = active({ getSensorSource: () => 'phone' });
        expect(page.element.textContent).toContain(t('box.state.notConnected'));
        expect(page.element.textContent).toContain(t('sensorStatus.reading', { value: '—' }));
      });

      it('says lost contact once the connection drops', () => {
        expect(active({ getSensorState: () => 'disconnected' }).element.textContent).toContain(
          t('box.state.lost'),
        );
      });
    });
  }

  it('gives the EasyLevel its debug disclosure: temperature, raw values and the connect delay', () => {
    const page = createBoxStatusPage(
      makeOptions({ getSensorSource: () => 'easylevel', getHealth: () => health }),
    );
    const debug = page.element.querySelector('.sensor-status__debug');
    expect(debug).not.toBeNull();
    expect(debug!.textContent).toContain('Temperature: 21.5°C');
    expect(debug!.textContent).toContain('Firmware tier: 3');
    expect(debug!.querySelector('input[type="number"]')).not.toBeNull();
  });

  it('gives the Xparkle no debug disclosure, temperature or connect delay — it has none', () => {
    const page = createBoxStatusPage(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        getHealth: () => health,
      }),
    );
    expect(page.element.querySelector('.sensor-status__debug')).toBeNull();
    expect(page.element.textContent).not.toContain('Temperature');
    expect(page.element.textContent).not.toContain(t('sensorStatus.debug.copy'));
    expect(page.element.querySelector('input[type="number"]')).toBeNull();
  });
});

// Pins (#416) of every state the page draws and every callback it fires,
// written before the builder is split up, so the split cannot change them.
describe('pinned before the #416 split', () => {
  function header(page: { element: HTMLElement }) {
    const state = page.element.querySelector<HTMLElement>('.box-header__state')!;
    const button = page.element.querySelector<HTMLButtonElement>('.box-header .menu__action')!;
    return { state, button };
  }

  it('marks the header connected, lost or neither with its classes', () => {
    const cases = [
      { source: 'phone', state: 'granted', connected: false, lost: false },
      { source: 'easylevel', state: 'granted', connected: true, lost: false },
      { source: 'easylevel', state: 'disconnected', connected: false, lost: true },
    ] as const;
    for (const c of cases) {
      const page = createBoxStatusPage(
        makeOptions({ getSensorSource: () => c.source, getSensorState: () => c.state }),
      );
      expect(header(page).state.classList.contains('is-connected')).toBe(c.connected);
      expect(header(page).state.classList.contains('is-lost')).toBe(c.lost);
    }
  });

  it('marks a rejected password as lost, and Lost wins over the password', () => {
    const rejected = createBoxStatusPage(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        password: { isRejected: () => true, tryPassword: () => Promise.resolve(true) },
      }),
    );
    expect(header(rejected).state.classList.contains('is-lost')).toBe(true);
    const lost = createBoxStatusPage(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        getSensorState: () => 'disconnected',
        password: { isRejected: () => true, tryPassword: () => Promise.resolve(true) },
      }),
    );
    expect(header(lost).state.textContent).toBe(t('box.state.lost'));
  });

  it('says plain Connected while the battery is unknown', () => {
    const page = createBoxStatusPage(makeOptions({ getSensorSource: () => 'easylevel' }));
    expect(header(page).state.textContent).toBe(t('box.state.connected'));
  });

  it('rounds the battery in the header', () => {
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getHealth: () => ({ batteryPercent: 61.6, temperatureCelsius: null, firmwareLabel: null }),
      }),
    );
    expect(header(page).state.textContent).toBe(
      `${t('box.state.connected')} · ${t('box.state.battery', { value: '62 %' })}`,
    );
  });

  it('offers no button at all without connectSensor', () => {
    const page = createBoxStatusPage(makeOptions());
    expect(header(page).button.hidden).toBe(true);
  });

  it('says Connecting and disables the button until the connect settles', async () => {
    let finish: (state: 'granted') => void = () => {};
    const page = createBoxStatusPage(
      makeOptions({
        connectSensor: () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      }),
    );
    const { button } = header(page);
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe(t('sensorSource.status.connecting'));
    finish('granted');
    await Promise.resolve();
    await Promise.resolve();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe(t('box.connect'));
  });

  it('shows only the position, with no dash, when there is a position but no tilt', () => {
    const page = createBoxStatusPage(makeOptions({ getSensorSource: () => 'easylevel' }));
    const position = document.createElement('span');
    position.textContent = '! Lying down';
    page.positionSlot.append(position);
    page.refresh();
    expect(page.element.querySelector('.box-live')?.textContent).toBe('! Lying down');
  });

  it('ignores a hidden position when joining the tilt line', () => {
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getCalibratedTilt: () => ({ rollDeg: 0.5, pitchDeg: 1 }),
      }),
    );
    const position = document.createElement('span');
    position.hidden = true;
    page.positionSlot.append(position);
    page.refresh();
    expect(page.element.querySelector('.box-live')?.textContent).toBe(
      `${t('tilt.sideSide')} 0.5° · ${t('tilt.frontBack')} 1.0°`,
    );
  });

  it('lays the page out as header, password, live line, low battery, settings, footer, debug, advanced', () => {
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        password: { isRejected: () => false, tryPassword: () => Promise.resolve(true) },
        offersSilentReconnectTip: () => true,
      }),
    );
    const classes = [...page.settingsSlot.parentElement!.children].map((child) => child.className);
    const order = [
      'box-header',
      'box-password',
      'box-live',
      'menu__text--warning',
      '',
      'box-footer',
      'sensor-status__debug',
      'sensor-status__advanced',
    ];
    expect(classes).toHaveLength(order.length);
    order.forEach((name, i) => expect(classes[i]).toContain(name));
  });

  it('keeps the debug disclosure in place but hidden while the box is not in use', () => {
    const page = createBoxStatusPage(makeOptions());
    const debug = page.element.querySelector<HTMLElement>('.sensor-status__debug');
    expect(debug).not.toBeNull();
    expect(debug!.hidden).toBe(true);
  });

  it('shows the last-sample age and spaced raw values in the debug rows', () => {
    const now = performance.now();
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getLastSampleAt: () => now - 1500,
        getRawAccel: () => ({ x: 1, y: -2, z: 300 }),
        getEasyLevelStatusBytes: () => new Uint8Array([0, 10, 255]),
      }),
    );
    const debug = page.element.querySelector('.sensor-status__debug')!.textContent ?? '';
    expect(debug).toMatch(/1\.\d s/);
    expect(debug).toContain('1, -2, 300');
    expect(debug).toContain('00 0a ff');
  });

  it('copies the debug summary line by line, with the connection state', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const page = createBoxStatusPage(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getSensorState: () => 'granted',
        getDeviceId: () => 'dev-1',
      }),
    );
    findCopy(page.element).click();
    const text = (writeText.mock.calls[0] as unknown as [string])[0];
    const lines = text.split('\n');
    expect(lines[0]).toBe('Libell EasyLevel debug info');
    expect(lines[1]).toBe('Connection state: granted');
    expect(lines[2]).toBe('Device ID: dev-1');
    expect(lines).toHaveLength(7);
  });

  function findCopy(root: HTMLElement): HTMLButtonElement {
    return [...root.querySelectorAll<HTMLButtonElement>('.sensor-status__debug button')].find(
      (button) => button.textContent === t('sensorStatus.debug.copy'),
    )!;
  }
});
