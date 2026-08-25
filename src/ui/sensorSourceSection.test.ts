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
    getInstallCalibration: () => null,
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    checkInstallCalibration: () => '',
    clearInstallCalibration: () => {},
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
    // Connect/disconnect are always the first two buttons appended, ahead of
    // the health-detail and installation-offset (#131) blocks below them.
    const [connectButton, disconnectButton] = section.element.querySelectorAll('button');
    expect(disconnectButton!.hidden).toBe(false);
    expect(connectButton!.textContent).not.toBe('');
    expect(findButton(section.element, 'Disconnect')).toBe(disconnectButton);
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

  it('shows battery/RSSI/temperature explicitly as "not available yet" once EasyLevel is (or was) active — never omitted, never fabricated', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'granted' }),
    );
    const detail = section.element.querySelector<HTMLElement>('.menu__detail');
    expect(detail?.hidden).toBe(false);
    expect(detail?.textContent).toContain('Battery');
    expect(detail?.textContent).toContain('Signal strength');
    expect(detail?.textContent).toContain('Temperature');
    const notAvailableCount = (detail?.textContent?.match(/Not available yet/g) ?? []).length;
    expect(notAvailableCount).toBe(3);
  });

  it('still shows the detail block (as "not available yet") for a dropped connection — not omitted on disconnect', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'disconnected' }),
    );
    const detail = section.element.querySelector<HTMLElement>('.menu__detail');
    expect(detail?.hidden).toBe(false);
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
});
