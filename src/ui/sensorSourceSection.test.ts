// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorSourceSection, type SensorSourceOptions } from './sensorSourceSection';
import { setLanguage } from './i18n';

setLanguage('en');

function makeOptions(overrides: Partial<SensorSourceOptions> = {}): SensorSourceOptions {
  return {
    getSensorSource: () => 'phone',
    getSensorState: () => 'idle',
    connectEasyLevel: () => Promise.resolve('granted'),
    disconnectEasyLevel: () => {},
    getEasyLevelStatus: () => null,
    getInstallCalibration: () => null,
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    checkInstallCalibration: () => '',
    clearInstallCalibration: () => {},
    getEasyLevelMounting: () => 'standard',
    setEasyLevelMounting: () => {},
    ...overrides,
  };
}

function findButton(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find((b) => b.textContent === text);
  if (!button) throw new Error(`no button with text "${text}"`);
  return button;
}

describe('createSensorSourceSection (#116)', () => {
  it('shows "Connect" and hides the disconnect button while the phone is the active source', () => {
    const section = createSensorSourceSection(makeOptions());
    expect(section.element.textContent).toContain('Connect');
    const disconnectButton = [...section.element.querySelectorAll('button')].find((b) => b.hidden);
    expect(disconnectButton).toBeDefined();
  });

  it('shows the connected status and a visible disconnect button once EasyLevel is active', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    const disconnectButton = findButton(section.element, 'Disconnect');
    expect(disconnectButton.hidden).toBe(false);
    const connectButton = findButton(section.element, 'Reconnect EasyLevel sensor');
    expect(connectButton.textContent).not.toBe('');
  });

  it('clicking connect calls connectEasyLevel() and reflects a successful result', async () => {
    const connectEasyLevel = vi.fn(() => Promise.resolve<'granted'>('granted'));
    const section = createSensorSourceSection(makeOptions({ connectEasyLevel }));
    const button = findButton(section.element, 'Connect EasyLevel sensor');
    button.click();
    expect(connectEasyLevel).toHaveBeenCalledOnce();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent).toContain('Connected');
  });

  it('clicking connect surfaces a denied/failed result as an error, not a silent no-op', async () => {
    const connectEasyLevel = () => Promise.resolve<'denied'>('denied');
    const section = createSensorSourceSection(makeOptions({ connectEasyLevel }));
    const button = findButton(section.element, 'Connect EasyLevel sensor');
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent?.toLowerCase()).toContain('could not connect');
  });

  it('surfaces "unsupported" distinctly rather than a generic failure', async () => {
    const connectEasyLevel = () => Promise.resolve<'unsupported'>('unsupported');
    const section = createSensorSourceSection(makeOptions({ connectEasyLevel }));
    const button = findButton(section.element, 'Connect EasyLevel sensor');
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent).toContain('not supported');
  });

  it('clicking disconnect calls disconnectEasyLevel() and refresh() flips back to the phone', () => {
    const disconnectEasyLevel = vi.fn();
    let source: 'phone' | 'easylevel' = 'easylevel';
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => source,
        disconnectEasyLevel: () => {
          disconnectEasyLevel();
          source = 'phone';
        },
      }),
    );
    const disconnectButton = findButton(section.element, 'Disconnect');
    disconnectButton.click();
    expect(disconnectEasyLevel).toHaveBeenCalledOnce();
    expect(disconnectButton.hidden).toBe(true);
  });

  it('refresh() re-reads the current source (menu re-opened after a connect elsewhere)', () => {
    let source: 'phone' | 'easylevel' = 'phone';
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => source }));
    source = 'easylevel';
    section.refresh();
    expect(section.element.textContent).toContain('Connected');
  });

  // #129: honest detailed status — connection state distinguishes a live
  // connection from a dropped one, and battery/RSSI/temperature are always
  // spelled out as "not available yet" rather than omitted or fabricated.
  it('shows a distinct disconnected status once the connection is lost, not the plain "connected" text', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'disconnected' }),
    );
    expect(section.element.textContent).toContain('lost');
    expect(section.element.textContent).not.toContain('Connected to the EasyLevel sensor.');
  });

  it('hides the battery/RSSI/temperature detail block while the phone is the active source', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'phone' }));
    const detail = section.element.querySelector<HTMLElement>('.menu__detail');
    expect(detail?.hidden).toBe(true);
  });

  it('shows battery/RSSI/temperature explicitly as "not available yet" before the first faf52c22 notification — never omitted, never fabricated', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'granted' }),
    );
    const detail = section.element.querySelector<HTMLElement>('.menu__detail');
    expect(detail?.hidden).toBe(false);
    expect(detail?.textContent).toContain('Battery');
    expect(detail?.textContent).toContain('Signal strength');
    expect(detail?.textContent).toContain('Temperature');
    // RSSI never becomes available; battery/temperature also read "not
    // available yet" here since no status has arrived (getEasyLevelStatus
    // returns null) — all three show it, distinctly from once real values
    // arrive (below).
    const notAvailableCount = (detail?.textContent?.match(/Not available yet/g) ?? []).length;
    expect(notAvailableCount).toBe(3);
  });

  it('shows real battery %/temperature once a status notification has arrived (#123) — RSSI stays "not available yet"', () => {
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getSensorState: () => 'granted',
        getEasyLevelStatus: () => ({
          firmwareTier: 3,
          batteryPercent: 72,
          temperatureCelsius: 19.5,
          calibration: null,
        }),
      }),
    );
    const detail = section.element.querySelector<HTMLElement>('.menu__detail');
    expect(detail?.textContent).toContain('Battery: 72%');
    expect(detail?.textContent).toContain('Temperature: 19.5°C');
    expect(detail?.textContent).toContain('Signal strength: Not available yet');
    const notAvailableCount = (detail?.textContent?.match(/Not available yet/g) ?? []).length;
    expect(notAvailableCount).toBe(1);
  });

  it('still shows the detail block (as "not available yet") for a dropped connection — not omitted on disconnect', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'disconnected' }),
    );
    const detail = section.element.querySelector<HTMLElement>('.menu__detail');
    expect(detail?.hidden).toBe(false);
  });

  // #123: a settings-page warning, not a leveling-screen interruption,
  // with hysteresis so it doesn't flicker right at the threshold.
  describe('low-battery warning', () => {
    function warningRow(root: HTMLElement): HTMLElement | undefined {
      return [...root.querySelectorAll<HTMLElement>('.menu__text--warning')].find(
        (el) => !el.hidden,
      );
    }

    it('is hidden while battery is comfortably above the threshold', () => {
      const section = createSensorSourceSection(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getEasyLevelStatus: () => ({
            firmwareTier: 3,
            batteryPercent: 80,
            temperatureCelsius: 20,
            calibration: null,
          }),
        }),
      );
      expect(warningRow(section.element)).toBeUndefined();
    });

    it('shows once battery drops below the threshold, and hides again once it recovers past the hysteresis band', () => {
      let battery = 15;
      const section = createSensorSourceSection(
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
      expect(warningRow(section.element)).toBeDefined();
      expect(warningRow(section.element)?.textContent).toContain('Low battery');

      // Back above the bare threshold, but still inside the hysteresis
      // band — must not flicker off yet.
      battery = 21;
      section.refresh();
      expect(warningRow(section.element)).toBeDefined();

      // Clearly above the hysteresis band now.
      battery = 30;
      section.refresh();
      expect(warningRow(section.element)).toBeUndefined();
    });

    it('never shows while the phone sensor is active, even with a stale low reading remembered', () => {
      const section = createSensorSourceSection(
        makeOptions({
          getSensorSource: () => 'phone',
          getEasyLevelStatus: () => ({
            firmwareTier: 3,
            batteryPercent: 5,
            temperatureCelsius: 20,
            calibration: null,
          }),
        }),
      );
      expect(warningRow(section.element)).toBeUndefined();
    });
  });
});

// #131, ADR 0014: the installation-offset block generalizes R24's phone
// "vehicle zero" to this external sensor — same capture/check/clear/age
// pattern, its own independent state.
describe('createSensorSourceSection installation calibration (#131)', () => {
  function installBlock(root: HTMLElement): HTMLElement {
    const heading = [...root.querySelectorAll('h3')].find(
      (h) => h.textContent === 'Installation offset',
    );
    if (!heading?.parentElement) throw new Error('installation offset heading not found');
    return heading.parentElement;
  }

  it('hides the installation-offset block while the phone is the active source', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'phone' }));
    const heading = [...section.element.querySelectorAll('h3')].find(
      (h) => h.textContent === 'Installation offset',
    );
    expect(heading?.parentElement?.hidden).toBe(true);
  });

  it('shows "no installation offset" until one is captured, once EasyLevel is active', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getInstallCalibration: () => null }),
    );
    const block = installBlock(section.element);
    expect(block.hidden).toBe(false);
    expect(block.textContent).toContain('No installation offset');
  });

  it('shows the stored offset and its age once captured', () => {
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getInstallCalibration: () => ({ rollDeg: 1.2, pitchDeg: -0.3 }),
        getInstallCalibrationCapturedAt: () => Date.now() - 14 * 86_400_000,
      }),
    );
    const block = installBlock(section.element);
    expect(block.textContent).toContain('1.2');
    expect(block.textContent).toContain('-0.3');
    expect(block.textContent).toContain('14 days ago');
  });

  it('clicking "Set vehicle level" calls calibrateInstall() and refreshes the status', () => {
    const calibrateInstall = vi.fn(() => null);
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', calibrateInstall }),
    );
    const button = findButton(section.element, 'Set vehicle level');
    button.click();
    expect(calibrateInstall).toHaveBeenCalledOnce();
  });

  it('surfaces a rejected implausible capture as an error instead of silently storing it', () => {
    const calibrateInstall = () =>
      'That looks like more than placement tilt (>15°) — is the vehicle really level?';
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', calibrateInstall }),
    );
    const button = findButton(section.element, 'Set vehicle level');
    button.click();
    expect(section.element.textContent).toContain('more than placement tilt');
  });

  it('the Check button reuses the shared verdict text and the Clear button reuses clearInstallCalibration()', () => {
    const checkInstallCalibration = vi.fn(() => 'Still good — off by 0.1°.');
    const clearInstallCalibration = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getInstallCalibration: () => ({ rollDeg: 0.2, pitchDeg: 0.1 }),
        checkInstallCalibration,
        clearInstallCalibration,
      }),
    );
    const checkButton = findButton(section.element, 'Check');
    checkButton.click();
    expect(checkInstallCalibration).toHaveBeenCalledOnce();
    expect(section.element.textContent).toContain('Still good');

    const clearButton = findButton(section.element, 'Clear installation offset');
    clearButton.click();
    expect(clearInstallCalibration).toHaveBeenCalledOnce();
  });

  it('disables Check/Clear while nothing is stored, and enables them once something is', () => {
    let offset: { rollDeg: number; pitchDeg: number } | null = null;
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getInstallCalibration: () => offset }),
    );
    expect(findButton(section.element, 'Check').disabled).toBe(true);
    expect(findButton(section.element, 'Clear installation offset').disabled).toBe(true);
    offset = { rollDeg: 1, pitchDeg: 1 };
    section.refresh();
    expect(findButton(section.element, 'Check').disabled).toBe(false);
    expect(findButton(section.element, 'Clear installation offset').disabled).toBe(false);
  });

  // The sensor row's status text doubles as a button opening the deeper
  // status page (`easyLevelStatusPage.ts`) — but only when a caller
  // actually wants that wired up.
  describe('onOpenStatus (status row opens the deeper status page)', () => {
    function statusButton(root: HTMLElement): HTMLButtonElement {
      return [...root.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Using the phone'),
      )!;
    }

    it('clicking the status row calls onOpenStatus when one is supplied', () => {
      const onOpenStatus = vi.fn();
      const section = createSensorSourceSection(makeOptions(), onOpenStatus);
      statusButton(section.element).click();
      expect(onOpenStatus).toHaveBeenCalledOnce();
    });

    it('never throws when no onOpenStatus is supplied — an inert row, not a broken one', () => {
      const section = createSensorSourceSection(makeOptions());
      expect(() => statusButton(section.element).click()).not.toThrow();
    });

    it('renders the status as a real button either way, so the deeper page stays reachable by keyboard', () => {
      const section = createSensorSourceSection(makeOptions());
      expect(statusButton(section.element).tagName).toBe('BUTTON');
    });
  });
});

describe('createSensorSourceSection mounting orientation (#217)', () => {
  function mountingSelect(root: HTMLElement): HTMLSelectElement {
    const select = root.querySelector('select');
    if (!select) throw new Error('mounting select not found');
    return select;
  }

  it('hides the mounting picker (folded into the installation block) while the phone is the active source', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'phone' }));
    const heading = [...section.element.querySelectorAll('h3')].find(
      (h) => h.textContent === 'Sensor mounting',
    );
    expect(heading?.closest('[hidden]')).not.toBeNull();
  });

  it('reflects the stored mounting orientation once EasyLevel is active', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getEasyLevelMounting: () => 'rotated90' }),
    );
    expect(mountingSelect(section.element).value).toBe('rotated90');
  });

  it('calls setEasyLevelMounting() when the selection changes', () => {
    const setEasyLevelMounting = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', setEasyLevelMounting }),
    );
    const select = mountingSelect(section.element);
    select.value = 'rotated90';
    select.dispatchEvent(new Event('change'));
    expect(setEasyLevelMounting).toHaveBeenCalledWith('rotated90');
  });

  it('refresh() re-reads the stored orientation (changed elsewhere, e.g. another open page)', () => {
    let mounting: 'standard' | 'rotated90' = 'standard';
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getEasyLevelMounting: () => mounting }),
    );
    expect(mountingSelect(section.element).value).toBe('standard');
    mounting = 'rotated90';
    section.refresh();
    expect(mountingSelect(section.element).value).toBe('rotated90');
  });

  it('offers exactly the two supported orientations, both official-app-jargon-free', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    const labels = [...mountingSelect(section.element).options].map((o) => o.textContent);
    expect(labels).toEqual(['Standard', 'Rotated 90°']);
  });
});
