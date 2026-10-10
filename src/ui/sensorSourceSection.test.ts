// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorSourceSection, type SensorSourceOptions } from './sensorSourceSection';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import { XPARKLE_DESCRIPTOR } from '../sensor/xparkleSensor';
import { setLanguage } from './i18n';

setLanguage('en');

function makeOptions(overrides: Partial<SensorSourceOptions> = {}): SensorSourceOptions {
  return {
    sensor: EASYLEVEL_DESCRIPTOR,
    getSensorSource: () => 'phone',
    getSensorState: () => 'idle',
    connectSensor: () => Promise.resolve('granted'),
    disconnectSensor: () => {},
    getInstallCalibration: () => null,
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    checkInstallCalibration: () => '',
    clearInstallCalibration: () => {},
    getMounting: () => 'standard',
    setMounting: () => {},
    ...overrides,
  };
}

function findButton(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (b) => b.textContent === text || b.getAttribute('aria-label') === text,
  );
  if (!button) throw new Error(`no button with text "${text}"`);
  return button;
}

describe('createSensorSourceSection (#116)', () => {
  it('shows the box’s name and a Connect link while the phone is the active source (#324)', () => {
    const section = createSensorSourceSection(makeOptions());
    const connect = findButton(section.connectElement, 'Connect EasyLevel sensor');
    expect(connect.hidden).toBe(false);
    expect(connect.textContent).toBe('Connect');
    expect(connect.classList.contains('link-button')).toBe(true);
    expect(section.connectElement.textContent).toContain('EasyLevel');
    expect(section.connectElement.textContent).not.toContain('Disconnect');
  });

  it('shows the connected status and a visible disconnect button once EasyLevel is active', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    const disconnectButton = findButton(section.element, 'Disconnect');
    expect(disconnectButton.hidden).toBe(false);
  });

  it('never offers Connect or Reconnect on the list for the box already in use (#315)', () => {
    for (const state of ['granted', 'disconnected'] as const) {
      const section = createSensorSourceSection(
        makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => state }),
      );
      expect(findButton(section.element, 'Connect EasyLevel sensor').hidden).toBe(true);
      expect(section.connectElement.textContent).not.toContain('Reconnect');
    }
  });

  it('has no intro paragraph on the list, just the row (#315)', () => {
    const section = createSensorSourceSection(makeOptions());
    expect(section.connectElement.textContent).not.toContain('alternative');
  });

  it('clicking connect calls connectSensor() and reflects a successful result', async () => {
    let source: 'phone' | 'easylevel' = 'phone';
    const connectSensor = vi.fn(() => {
      source = 'easylevel';
      return Promise.resolve<'granted'>('granted');
    });
    const section = createSensorSourceSection(
      makeOptions({ connectSensor, getSensorSource: () => source }),
    );
    const button = findButton(section.element, 'Connect EasyLevel sensor');
    button.click();
    expect(connectSensor).toHaveBeenCalledOnce();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent).toContain('Connected');
  });

  it('clicking connect surfaces a denied/failed result as an error, not a silent no-op', async () => {
    const connectSensor = () => Promise.resolve<'denied'>('denied');
    const section = createSensorSourceSection(makeOptions({ connectSensor }));
    const button = findButton(section.element, 'Connect EasyLevel sensor');
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent?.toLowerCase()).toContain('could not connect');
  });

  it('surfaces "unsupported" distinctly rather than a generic failure', async () => {
    const connectSensor = () => Promise.resolve<'unsupported'>('unsupported');
    const section = createSensorSourceSection(makeOptions({ connectSensor }));
    const button = findButton(section.element, 'Connect EasyLevel sensor');
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent).toContain('not supported');
  });

  it('clicking disconnect calls disconnectSensor() and refresh() flips back to the phone', () => {
    const disconnectSensor = vi.fn();
    let source: 'phone' | 'easylevel' = 'easylevel';
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => source,
        disconnectSensor: () => {
          disconnectSensor();
          source = 'phone';
        },
      }),
    );
    // Disconnect lives on the box's own page now (#324), under "More".
    findButton(section.moreElement, 'Disconnect').click();
    expect(disconnectSensor).toHaveBeenCalledOnce();
    expect(section.moreElement.hidden).toBe(true);
    expect(findButton(section.connectElement, 'Connect EasyLevel sensor').hidden).toBe(false);
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
    expect(section.connectElement.textContent).toContain('No contact');
    expect(section.connectElement.textContent).not.toContain('Connected');
  });

  it('shows the zero step as not done until one is captured, once EasyLevel is active (#314)', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getInstallCalibration: () => null }),
    );
    expect(section.installElement.hidden).toBe(false);
    expect(section.installElement.textContent).toContain('Zero on level ground');
    expect(section.installElement.textContent).toContain('Zero now');
  });

  it('shows the zero as done, with its age, once captured (#314)', () => {
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getInstallCalibration: () => ({ rollDeg: 1.2, pitchDeg: -0.3 }),
        getInstallCalibrationCapturedAt: () => Date.now() - 14 * 86_400_000,
      }),
    );
    expect(section.installElement.textContent).toContain('Zeroed');
    expect(section.installElement.textContent).toContain('14 days ago');
  });

  it('clicking "Set vehicle level" calls calibrateInstall() and refreshes the status', () => {
    const calibrateInstall = vi.fn(() => null);
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', calibrateInstall }),
    );
    const button = findButton(section.element, 'Zero now');
    button.click();
    expect(calibrateInstall).toHaveBeenCalledOnce();
  });

  it('waits for a box that zeroes itself, then shows its answer (#290)', async () => {
    let answer: (error: string | null) => void = () => {};
    const calibrateInstall = () =>
      new Promise<string | null>((resolve) => {
        answer = resolve;
      });
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', calibrateInstall }),
    );
    const button = findButton(section.element, 'Zero now');
    button.click();
    expect(button.disabled).toBe(true);
    expect(section.element.textContent).toContain('Calibrating');

    answer('Could not calibrate the sensor.');
    await Promise.resolve();
    await Promise.resolve();
    expect(button.disabled).toBe(false);
    expect(section.element.textContent).toContain('Could not calibrate the sensor.');
  });

  it('surfaces a rejected implausible capture as an error instead of silently storing it', () => {
    const calibrateInstall = () =>
      'That looks like more than placement tilt (>15°) — is the vehicle really level?';
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', calibrateInstall }),
    );
    const button = findButton(section.element, 'Zero now');
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

    const clearButton = findButton(section.element, 'Clear the zero');
    clearButton.click();
    expect(clearInstallCalibration).toHaveBeenCalledOnce();
  });

  it('disables Check/Clear while nothing is stored, and enables them once something is', () => {
    let offset: { rollDeg: number; pitchDeg: number } | null = null;
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getInstallCalibration: () => offset }),
    );
    expect(findButton(section.element, 'Check').disabled).toBe(true);
    expect(findButton(section.element, 'Clear the zero').disabled).toBe(true);
    offset = { rollDeg: 1, pitchDeg: 1 };
    section.refresh();
    expect(findButton(section.element, 'Check').disabled).toBe(false);
    expect(findButton(section.element, 'Clear the zero').disabled).toBe(false);
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
      }),
    );
    // The connect half is the whole of the External sensor list page.
    const listPage = section.connectElement.textContent ?? '';
    expect(listPage).not.toContain('Battery');
    expect(listPage).not.toContain('Signal strength');
    expect(listPage).not.toContain('Temperature');
    // What it must still carry: the box and its state.
    expect(listPage).toContain('EasyLevel');
    expect(listPage).toContain('Connected');
  });

  it('keeps the setup checklist on the install half, not the connect half (#314)', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    expect(section.connectElement.textContent).not.toContain('Zero on level ground');
    expect(section.installElement.textContent).toContain('Position: waiting for a reading');
    expect(section.installElement.textContent).toContain('Direction set');
    expect(section.installElement.textContent).toContain('Zero on level ground');
  });
});

describe('picking the mounting by tapping a side of the vehicle (#217, #222, #314)', () => {
  function pickerButton(root: HTMLElement, facing: string): HTMLButtonElement {
    const button = root.querySelector<HTMLButtonElement>(`.mounting-picker__button--${facing}`);
    if (!button) throw new Error(`no picker button for ${facing}`);
    return button;
  }
  function openDirectionStep(root: HTMLElement): void {
    const header = [...root.querySelectorAll<HTMLButtonElement>('button.box-step__header')].find(
      (button) => button.textContent?.includes('Direction'),
    );
    header?.click();
  }

  it('hides the checklist while the phone is the active source', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'phone' }));
    expect(section.installElement.hidden).toBe(true);
  });

  it('offers all four physical rotations, one per side of the vehicle (#222)', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    const facings = [...section.installElement.querySelectorAll('.mounting-picker__button')].map(
      (button) => button.className.replace(/.*mounting-picker__button--(\w+).*/, '$1'),
    );
    expect(facings).toEqual(['front', 'right', 'rear', 'left']);
  });

  it('reflects the stored rotation as the picked side, and says it in the step title', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getMounting: () => 'rotated180' }),
    );
    expect(pickerButton(section.installElement, 'rear').getAttribute('aria-pressed')).toBe('true');
    expect(pickerButton(section.installElement, 'front').getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(section.installElement.textContent).toContain('Direction set: points to the rear');
  });

  it('applies the tapped side as the matching rotation', () => {
    const setMounting = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', setMounting }),
    );
    openDirectionStep(section.installElement);
    pickerButton(section.installElement, 'left').click();
    expect(setMounting).toHaveBeenCalledWith('rotated270');
    pickerButton(section.installElement, 'right').click();
    expect(setMounting).toHaveBeenCalledWith('rotated90');
  });

  it('refresh() re-reads the stored rotation (changed elsewhere, e.g. another open page)', () => {
    let mounting: 'standard' | 'rotated90' = 'standard';
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getMounting: () => mounting }),
    );
    expect(pickerButton(section.installElement, 'front').getAttribute('aria-pressed')).toBe('true');
    mounting = 'rotated90';
    section.refresh();
    expect(pickerButton(section.installElement, 'right').getAttribute('aria-pressed')).toBe('true');
  });

  it('labels each side in plain words, free of the vendor app’s jargon', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    const labels = [...section.installElement.querySelectorAll('.mounting-picker__button')].map(
      (button) => button.getAttribute('aria-label'),
    );
    expect(labels).toEqual([
      'Points to the front',
      'Points to the right',
      'Points to the rear',
      'Points to the left',
    ]);
    for (const label of labels) {
      expect(label?.toLowerCase()).not.toMatch(/sensor_placing|placement|placing/);
    }
  });

  it('stores a picked side of an Xparkle box as its axis mapping (#314)', () => {
    let learned: unknown = null;
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        learnMounting: {
          getRawReading: () => ({ pitchDeg: 0, rollDeg: 0 }),
          getLearnedMounting: () => learned as null,
          setLearnedMounting: (mapping) => void (learned = mapping),
        },
      }),
    );
    expect(section.installElement.textContent).toContain('Pick the direction');
    pickerButton(section.installElement, 'rear').click();
    expect(learned).toEqual({ swap: false, pitchSign: -1, rollSign: -1 });
    expect(section.installElement.textContent).toContain('Direction set: points to the rear');
  });
});

describe('the position step alone, for the first-run wizard (#317)', () => {
  it('is the live position step, without the direction or the zero', () => {
    let tilt = { pitchDeg: -88, rollDeg: 3 };
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        getCalibratedTilt: () => tilt,
      }),
    );
    const wizardStep = document.createElement('div');
    wizardStep.append(section.positionElement);
    expect(wizardStep.textContent).toContain('Lying down: stand it upright');
    expect(wizardStep.textContent).not.toContain('Zero now');
    tilt = { pitchDeg: 1, rollDeg: -2 };
    section.refreshLive();
    expect(wizardStep.textContent).toContain('Stands upright');
  });
});

describe('the position step, live (#304, #314)', () => {
  it('says an upright box stands, and guides a lying one without blocking anything', () => {
    let tilt = { pitchDeg: 1, rollDeg: -2 };
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        getCalibratedTilt: () => tilt,
      }),
    );
    expect(section.installElement.textContent).toContain('Stands upright');
    tilt = { pitchDeg: -88, rollDeg: 3 };
    section.refreshLive();
    expect(section.installElement.textContent).toContain('Lying down: stand it upright');
    // Never a gate: zeroing is still right there.
    expect(findButton(section.installElement, 'Zero now').disabled).toBe(false);
  });

  it('asks a flat box to lie flat, never to stand', () => {
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getCalibratedTilt: () => ({ pitchDeg: 70, rollDeg: 0 }),
      }),
    );
    expect(section.installElement.textContent).toContain('lay it flat, top up');
    expect(section.installElement.textContent).not.toContain('upright');
  });
});

describe('a source with something to say about why it is not working (#272)', () => {
  it('shows the note under the row, so the user knows what to fix', () => {
    const section = createSensorSourceSection(
      makeOptions({
        getSensorState: () => 'denied',
        getSensorNote: () => 'The box did not accept its password.',
      }),
    );
    expect(section.connectElement.textContent).toContain('did not accept its password');
  });

  it('says nothing when there is nothing to say, which is nearly always', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorNote: () => null }));
    const warnings = [...section.connectElement.querySelectorAll('.menu__text--warning')];
    expect(warnings.every((row) => (row as HTMLElement).hidden)).toBe(true);
  });

  it('works for a source that offers no note at all', () => {
    expect(() => createSensorSourceSection(makeOptions())).not.toThrow();
  });
});

describe('one row per source, each answering for itself (#272)', () => {
  it('is active only for its OWN source, not for any external source', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'xparkle', getSensorState: () => 'granted' }),
    );
    // The bag's descriptor is EasyLevel's, and a different box is active.
    expect(section.connectElement.classList.contains('is-active')).toBe(false);
    expect(findButton(section.connectElement, 'Connect EasyLevel sensor').hidden).toBe(false);
  });

  it('never says per card which sensor is in use; the list says it once (#324)', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'phone' }));
    expect(section.connectElement.textContent).not.toContain('phone');
  });

  it('tells the caller when connecting here makes the other rows stale', async () => {
    const onSourceChanged = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({ connectSensor: () => Promise.resolve('granted') }),
      undefined,
      onSourceChanged,
    );
    findButton(section.connectElement, 'Connect EasyLevel sensor').click();
    await Promise.resolve();
    await Promise.resolve();
    expect(onSourceChanged).toHaveBeenCalled();
  });
});

describe('the learn-the-mounting guide on the device page (#293)', () => {
  const learnMounting = {
    getRawReading: () => ({ pitchDeg: 0, rollDeg: 0 }),
    getLearnedMounting: () => null,
    setLearnedMounting: () => {},
  };

  it('is offered for a box that declares it', () => {
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        learnMounting,
      }),
    );
    expect(section.installElement.textContent).toContain('Learn it by raising the front');
  });

  it('is not offered for a box that does not', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', learnMounting }),
    );
    expect(section.installElement.textContent).not.toContain('Learn it by raising the front');
  });
});
