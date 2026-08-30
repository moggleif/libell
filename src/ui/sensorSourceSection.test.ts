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

  function installBlock(root: HTMLElement): HTMLElement {
    const heading = [...root.querySelectorAll('h3')].find(
      (h) => h.textContent === 'Installation offset',
    );
    if (!heading?.parentElement) throw new Error('installation offset heading not found');
    return heading.parentElement;
  }

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
  // actually wants that wired up, and only while the box that page
  // describes is the active source (#244).
  describe('onOpenStatus (status row opens the deeper status page)', () => {
    // By class, not by wording: the row's text changes with the active
    // source, which is the very thing these tests vary.
    function statusRow(root: HTMLElement): HTMLButtonElement {
      return root.querySelector<HTMLButtonElement>('.sensor-row__status-button')!;
    }

    it('clicking the status row opens the status page while EasyLevel is the active source', () => {
      const onOpenStatus = vi.fn();
      const section = createSensorSourceSection(
        makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'granted' }),
        onOpenStatus,
      );
      statusRow(section.element).click();
      expect(onOpenStatus).toHaveBeenCalledOnce();
    });

    it("is plain text while the phone is the active source — the page behind it is the box's (#244)", () => {
      const onOpenStatus = vi.fn();
      const section = createSensorSourceSection(makeOptions(), onOpenStatus);
      const row = statusRow(section.element);
      row.click();
      expect(onOpenStatus).not.toHaveBeenCalled();
      // And it does not offer itself as a way in, either.
      expect(row.querySelector('.sensor-row__chevron')?.hasAttribute('hidden')).toBe(true);
      expect(row.getAttribute('aria-disabled')).toBe('true');
    });

    it('becomes a link again as soon as the box is the active source', () => {
      let source = 'phone';
      const onOpenStatus = vi.fn();
      const section = createSensorSourceSection(
        makeOptions({ getSensorSource: () => source as 'phone' | 'easylevel' }),
        onOpenStatus,
      );
      source = 'easylevel';
      section.refresh();
      const row = statusRow(section.element);
      expect(row.querySelector('.sensor-row__chevron')?.hasAttribute('hidden')).toBe(false);
      expect(row.hasAttribute('aria-disabled')).toBe(false);
      row.click();
      expect(onOpenStatus).toHaveBeenCalledOnce();
    });

    it('never throws when no onOpenStatus is supplied — an inert row, not a broken one', () => {
      const section = createSensorSourceSection(makeOptions());
      expect(() => statusRow(section.element).click()).not.toThrow();
    });

    it('renders the status as a real button either way, so the deeper page stays reachable by keyboard', () => {
      const section = createSensorSourceSection(makeOptions());
      expect(statusRow(section.element).tagName).toBe('BUTTON');
    });
  });
});

describe('createSensorSourceSection halves (#226)', () => {
  it('keeps the per-device health rows off the connect half — they belong on the sensor\u2019s own page now', () => {
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
    // The connect half is the whole of the External sensor list page.
    const listPage = section.connectElement.textContent ?? '';
    expect(listPage).not.toContain('Battery');
    expect(listPage).not.toContain('Signal strength');
    expect(listPage).not.toContain('Temperature');
    // What it must still carry: the connect action and the sensor row.
    expect(listPage).toContain('Reconnect EasyLevel sensor');
    expect(listPage).toContain('Connected to the EasyLevel sensor.');
  });

  it('keeps mounting and installation offset on the install half, not the connect half', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    expect(section.connectElement.textContent).not.toContain('Sensor mounting');
    expect(section.connectElement.textContent).not.toContain('Installation offset');
    expect(section.installElement.textContent).toContain('Sensor mounting');
    expect(section.installElement.textContent).toContain('Installation offset');
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

  it('offers all four physical rotations, not just the official app\u2019s two (#222)', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    const values = [...mountingSelect(section.element).options].map((option) => option.value);
    expect(values).toEqual(['standard', 'rotated90', 'rotated180', 'rotated270']);
  });

  it('reflects a stored half-turn mounting, and applies a selected one (#222)', () => {
    const setEasyLevelMounting = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getEasyLevelMounting: () => 'rotated180',
        setEasyLevelMounting,
      }),
    );
    const select = mountingSelect(section.element);
    expect(select.value).toBe('rotated180');

    select.value = 'rotated270';
    select.dispatchEvent(new Event('change'));
    expect(setEasyLevelMounting).toHaveBeenCalledWith('rotated270');
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

  it('offers exactly the four supported orientations, all official-app-jargon-free', () => {
    // Was two before #222 — the official app's own pair. The count changed
    // by design (a box can be bolted in any of four ways); the "described
    // without that app's sensor_Placing terminology" half of this test is
    // unchanged, and now asserted explicitly rather than only implied by
    // the expected labels.
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    const labels = [...mountingSelect(section.element).options].map((o) => o.textContent);
    expect(labels).toEqual(['Standard', 'Rotated 90°', 'Rotated 180°', 'Rotated 270°']);
    for (const label of labels) {
      expect(label?.toLowerCase()).not.toMatch(/sensor_placing|placement|placing/);
    }
  });
});
