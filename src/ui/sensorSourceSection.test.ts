// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorSourceSection, type SensorSourceOptions } from './sensorSourceSection';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import { XPARKLE_DESCRIPTOR } from '../sensor/xparkleSensor';
import { IDENTITY_AXIS_MAPPING } from '../domain/axisMapping';
import { setLanguage, t } from './i18n';

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
    clearInstallCalibration: () => {},
    getMounting: () => 'standard',
    isMountingPicked: () => false,
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
    // Its own colour, so it doesn't read as just another step (#332).
    expect(disconnectButton.classList.contains('box-disconnect')).toBe(true);
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
    expect(section.connectElement.textContent).toContain('Lost contact');
    expect(section.connectElement.textContent).not.toContain('Connected');
  });

  it('shows the zero step as not done until one is captured, once EasyLevel is active (#314)', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getInstallCalibration: () => null }),
    );
    expect(section.installElement.hidden).toBe(false);
    expect(section.installElement.textContent).toContain('Zero the vehicle');
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

  it('drops the first-time instruction once zeroed, offering Zero again with Forget the zero as a link (#332, #343)', () => {
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getInstallCalibration: () => ({ rollDeg: 1.2, pitchDeg: -0.3 }),
      }),
    );
    const hint = [...section.installElement.querySelectorAll('p')].find(
      (p) => p.textContent === t('box.step.zero.hint'),
    );
    expect(hint?.hidden).toBe(true);
    expect(findButton(section.installElement, 'Zero again').hidden).toBe(false);
    const links = section.installElement.querySelector<HTMLElement>('.box-step__links');
    expect(links?.hidden).toBe(false);
    // No separate check: the live line above already shows the tilt from the zero (#343).
    expect(links?.textContent).toBe('Forget the zero');
    expect(findButton(links!, 'Forget the zero').classList.contains('link-button')).toBe(true);
  });

  it('offers no Forget the zero for a box that zeroes itself — it keeps its own zero (#343)', () => {
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        getInstallCalibration: () => ({ rollDeg: 0, pitchDeg: 0 }),
      }),
    );
    expect(findButton(section.installElement, 'Zero again').hidden).toBe(false);
    expect(section.installElement.querySelector<HTMLElement>('.box-step__links')?.hidden).toBe(
      true,
    );
  });

  it('keeps Forget the zero out of the way before the first zero (#332)', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getInstallCalibration: () => null }),
    );
    expect(section.installElement.querySelector<HTMLElement>('.box-step__links')?.hidden).toBe(
      true,
    );
    expect(section.installElement.textContent).toContain(t('box.step.zero.hint'));
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
    expect(section.element.textContent).toContain('Zeroing');

    answer('Could not calibrate the sensor.');
    await Promise.resolve();
    await Promise.resolve();
    expect(button.disabled).toBe(false);
    expect(section.element.textContent).toContain('Could not calibrate the sensor.');
  });

  it('warns about a tilted box and zeroes it anyway on request (#425)', () => {
    const calibrateInstall = vi.fn((anyway?: boolean) =>
      anyway ? null : { warning: 'Is the vehicle level?' },
    );
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', calibrateInstall }),
    );
    findButton(section.element, 'Zero now').click();
    expect(section.element.textContent).toContain('Is the vehicle level?');
    const anyway = findButton(section.element, 'Zero anyway');
    expect(anyway.hidden).toBe(false);
    anyway.click();
    expect(calibrateInstall).toHaveBeenLastCalledWith(true);
    expect(anyway.hidden).toBe(true);
    expect(section.element.textContent).not.toContain('Is the vehicle level?');
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

  it('the Forget-the-zero link reuses clearInstallCalibration()', () => {
    const clearInstallCalibration = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getInstallCalibration: () => ({ rollDeg: 0.2, pitchDeg: 0.1 }),
        clearInstallCalibration,
      }),
    );
    const clearButton = findButton(section.element, 'Forget the zero');
    clearButton.click();
    expect(clearInstallCalibration).toHaveBeenCalledOnce();
  });

  it('disables Forget the zero while nothing is stored, and enables them once something is', () => {
    let offset: { rollDeg: number; pitchDeg: number } | null = null;
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getInstallCalibration: () => offset }),
    );
    expect(findButton(section.element, 'Forget the zero').disabled).toBe(true);
    offset = { rollDeg: 1, pitchDeg: 1 };
    section.refresh();
    expect(findButton(section.element, 'Forget the zero').disabled).toBe(false);
  });

  // The sensor row's status text doubles as a button opening the deeper
  // status page (`boxStatusPage.ts`) — but only when a caller
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
    expect(section.connectElement.textContent).not.toContain('Zero the vehicle');
    // The position is a status line, not a step (#332).
    expect(section.installElement.textContent).not.toContain('Position');
    expect(section.positionElement.textContent).toContain('Position: waiting for a reading');
    expect(section.installElement.textContent).toContain('Pick the direction');
    expect(section.installElement.textContent).toContain('Zero the vehicle');
  });
});

describe('picking the mounting by tapping a side of the vehicle (#217, #222, #314)', () => {
  function pickerButton(root: HTMLElement, facing: string): HTMLButtonElement {
    const button = root.querySelector<HTMLButtonElement>(`.mounting-picker__button--${facing}`);
    if (!button) throw new Error(`no picker button for ${facing}`);
    return button;
  }

  it('shows the checklist greyed out while the phone is the active source (#400)', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'phone' }));
    expect(section.installElement.hidden).toBe(false);
    expect(findButton(section.installElement, 'Zero now').disabled).toBe(true);
  });

  it('stays open after a side is tapped, so the choice is seen (#347)', () => {
    let stored: ReturnType<
      NonNullable<SensorSourceOptions['learnMounting']>['getLearnedMounting']
    > = null;
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        learnMounting: {
          getRawReading: () => null,
          getLearnedMounting: () => stored,
          setLearnedMounting: (mapping) => {
            stored = mapping;
          },
        },
      }),
    );
    pickerButton(section.installElement, 'rear').click();
    expect(stored).not.toBeNull();
    const picker = section.installElement.querySelector<HTMLElement>('.mounting-picker');
    expect(picker?.closest<HTMLElement>('.box-step__body')?.hidden).toBe(false);
    expect(section.installElement.textContent).toContain('Direction set: points to the rear');
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
    expect(section.positionElement.textContent).toContain('Stands upright');
    expect(section.positionElement.classList.contains('is-done')).toBe(true);
    tilt = { pitchDeg: -88, rollDeg: 3 };
    section.refreshLive();
    expect(section.positionElement.textContent).toContain('Lying down: stand it upright');
    expect(section.positionElement.classList.contains('is-warning')).toBe(true);
    // A status line, not something to press.
    expect(section.positionElement.querySelector('button')).toBeNull();
    // Never a gate: zeroing is still right there.
    expect(findButton(section.installElement, 'Zero now').disabled).toBe(false);
  });

  it('greys out every setup action while the box has no contact, and brings them back with it (#343)', () => {
    let state: 'granted' | 'disconnected' = 'disconnected';
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        getSensorState: () => state,
        learnMounting: {
          getRawReading: () => null,
          getLearnedMounting: () => null,
          setLearnedMounting: () => {},
        },
      }),
    );
    const zero = findButton(section.installElement, 'Zero now');
    const picker = section.installElement.querySelector<HTMLButtonElement>(
      '.mounting-picker__button',
    )!;
    expect(zero.disabled).toBe(true);
    expect(picker.disabled).toBe(true);
    // The steps still open, to show what is set.
    for (const header of section.installElement.querySelectorAll<HTMLButtonElement>(
      '.box-step__header',
    )) {
      expect(header.disabled).toBe(false);
    }
    state = 'granted';
    section.refreshLive();
    expect(zero.disabled).toBe(false);
    expect(picker.disabled).toBe(false);
  });

  it('keeps the steps after Disconnect, greyed out but still opening to show what is set (#400)', () => {
    let source: 'phone' | 'xparkle' = 'xparkle';
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => source,
        getSensorState: () => 'granted',
        disconnectSensor: () => {
          source = 'phone';
        },
        learnMounting: {
          getRawReading: () => null,
          getLearnedMounting: () => null,
          setLearnedMounting: () => {},
        },
      }),
    );
    findButton(section.moreElement, 'Disconnect').click();
    expect(section.installElement.hidden).toBe(false);
    expect(findButton(section.installElement, 'Zero now').disabled).toBe(true);
    const headers = [
      ...section.installElement.querySelectorAll<HTMLButtonElement>('.box-step__header'),
    ];
    expect(headers).toHaveLength(2);
    for (const header of headers) expect(header.disabled).toBe(false);
    headers[1]!.click();
    const zeroBody = headers[1]!.parentElement!.querySelector<HTMLElement>('.box-step__body')!;
    expect(zeroBody.hidden).toBe(false);
  });

  it('shows Disconnect as soon as the box connects, without reopening the page (#343)', () => {
    let source: 'phone' | 'xparkle' = 'phone';
    const section = createSensorSourceSection(
      makeOptions({ sensor: XPARKLE_DESCRIPTOR, getSensorSource: () => source }),
    );
    expect(section.moreElement.hidden).toBe(true);
    source = 'xparkle';
    section.refreshLive();
    expect(section.moreElement.hidden).toBe(false);
    expect(findButton(section.moreElement, 'Disconnect').hidden).toBe(false);
  });

  it('says nothing about the position while the box is not delivering — no guess from the phone (#343)', () => {
    for (const overrides of [
      { getSensorSource: () => 'phone' as const },
      { getSensorSource: () => 'xparkle' as const, getSensorState: () => 'disconnected' as const },
    ]) {
      const section = createSensorSourceSection(
        makeOptions({
          sensor: XPARKLE_DESCRIPTOR,
          getCalibratedTilt: () => ({ pitchDeg: 0, rollDeg: 0 }),
          ...overrides,
        }),
      );
      section.refreshLive();
      expect(section.positionElement.hidden).toBe(true);
    }
  });

  it('asks a flat box to lie flat, never to stand', () => {
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getCalibratedTilt: () => ({ pitchDeg: 70, rollDeg: 0 }),
      }),
    );
    expect(section.positionElement.textContent).toContain('lay it flat, top up');
    expect(section.positionElement.textContent).not.toContain('upright');
  });

  it('says so when a flat box is upside down, and how to fix it — never blocks (#362)', () => {
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        // Gravity out of the lid: atan2 against a negative z reads near 180°.
        getCalibratedTilt: () => ({ pitchDeg: 178, rollDeg: -2 }),
      }),
    );
    expect(section.positionElement.textContent).toContain(t('box.step.position.flat.upsideDown'));
    expect(section.positionElement.classList.contains('is-warning')).toBe(true);
    // Every step is still there to use.
    expect(section.installElement.querySelector('.placement-picker')).not.toBeNull();
  });
});

describe('a box that rejects its password (#272, #367)', () => {
  function rejecting(tryPassword = vi.fn(() => Promise.resolve<boolean | null>(true))) {
    let rejected = true;
    tryPassword.mockImplementation(() => {
      rejected = false;
      return Promise.resolve(true);
    });
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        password: { isRejected: () => rejected, tryPassword },
      }),
    );
    return { section, tryPassword };
  }

  it('says so on the card, never "Connected", and guides within Libell', () => {
    const { section } = rejecting();
    const card = section.connectElement;
    expect(card.textContent).toContain(t('box.state.password'));
    expect(card.textContent).not.toContain(t('box.state.connected'));
    expect(card.classList.contains('is-active')).toBe(false);
    expect(card.textContent).toContain(
      t('sensorSource.err.password', { name: EASYLEVEL_DESCRIPTOR.displayName }),
    );
    expect(card.querySelector('input')).not.toBeNull();
  });

  it('tries the typed code with one tap and goes back to Connected once accepted', async () => {
    const { section, tryPassword } = rejecting();
    const card = section.connectElement;
    card.querySelector('input')!.value = '1234';
    [...card.querySelectorAll('button')]
      .find((button) => button.textContent === t('box.password.retry'))!
      .click();
    expect(tryPassword).toHaveBeenCalledWith('1234');
    await Promise.resolve();
    await Promise.resolve();
    section.refreshLive();
    expect(card.textContent).toContain(t('box.state.connected'));
    expect((card.querySelector('.box-password') as HTMLElement).hidden).toBe(true);
  });

  it('says nothing when there is nothing to say, which is nearly always', () => {
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        password: { isRejected: () => false, tryPassword: () => Promise.resolve(true) },
      }),
    );
    expect((section.connectElement.querySelector('.box-password') as HTMLElement).hidden).toBe(
      true,
    );
    expect(section.connectElement.textContent).toContain(t('box.state.connected'));
  });

  it('shows no password block for a source that has no password at all (#526)', () => {
    const section = createSensorSourceSection(makeOptions());
    expect(section.connectElement.querySelector('.box-password')).toBeNull();
    expect(section.connectElement.textContent).not.toContain(t('box.password.label'));
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

describe('the EasyLevel box’s two placements from its manual (#359)', () => {
  function placementButton(root: HTMLElement, placement: string): HTMLButtonElement {
    const button = root.querySelector<HTMLButtonElement>(`.placement-picker__button--${placement}`);
    if (!button) throw new Error(`no placement button for ${placement}`);
    return button;
  }
  const active = { getSensorSource: () => 'easylevel' as const };

  it('offers only wide side forward and short side forward, with the arrow forward in both', () => {
    const section = createSensorSourceSection(makeOptions(active));
    const placements = [
      ...section.installElement.querySelectorAll('.placement-picker__button'),
    ].map((button) => button.className.replace(/.*placement-picker__button--(\w+).*/, '$1'));
    expect(placements).toEqual(['wide', 'short']);
    expect(section.installElement.querySelector('.mounting-picker__button')).toBeNull();
    expect(section.installElement.textContent).toContain(t('mounting.prompt.arrow'));
    expect(placementButton(section.installElement, 'wide').textContent).toBe(
      t('mounting.placement.wide'),
    );
    expect(placementButton(section.installElement, 'short').textContent).toBe(
      t('mounting.placement.short'),
    );
  });

  it('asks until a placement is picked, though readings already use the standard one', () => {
    const section = createSensorSourceSection(makeOptions(active));
    expect(section.installElement.textContent).toContain('Pick the direction');
    expect(placementButton(section.installElement, 'wide').getAttribute('aria-pressed')).toBe(
      'false',
    );
    // The first undone step is the open one.
    const picker = section.installElement.querySelector<HTMLElement>('.placement-picker');
    expect(picker?.closest<HTMLElement>('.box-step__body')?.hidden).toBe(false);
    expect(findButton(section.installElement, 'Forget the direction').hidden).toBe(true);
  });

  it('stores the tapped placement as its rotation and says it in the step title', () => {
    let mounting: 'standard' | 'rotated90' = 'standard';
    let picked = false;
    const section = createSensorSourceSection(
      makeOptions({
        ...active,
        getMounting: () => mounting,
        isMountingPicked: () => picked,
        setMounting: (next) => {
          picked = next !== null;
          mounting = next === 'rotated90' ? 'rotated90' : 'standard';
        },
      }),
    );
    placementButton(section.installElement, 'short').click();
    expect(mounting).toBe('rotated90');
    expect(picked).toBe(true);
    expect(placementButton(section.installElement, 'short').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(section.installElement.textContent).toContain(
      `Direction set: ${t('mounting.placement.short').toLowerCase()}`,
    );
    placementButton(section.installElement, 'wide').click();
    expect(mounting).toBe('standard');
  });

  it('offers Forget the direction once picked, which asks again', () => {
    const setMounting = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({ ...active, isMountingPicked: () => true, setMounting }),
    );
    const forget = findButton(section.installElement, 'Forget the direction');
    expect(forget.hidden).toBe(false);
    forget.click();
    expect(setMounting).toHaveBeenCalledWith(null);
  });

  it('asks again for a rotation from before #359 that the manual does not allow', () => {
    const section = createSensorSourceSection(
      makeOptions({ ...active, getMounting: () => 'rotated180', isMountingPicked: () => true }),
    );
    expect(section.installElement.textContent).toContain('Pick the direction');
    for (const placement of ['wide', 'short']) {
      expect(placementButton(section.installElement, placement).getAttribute('aria-pressed')).toBe(
        'false',
      );
    }
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
    // Nothing learned yet, so nothing to forget (#332).
    expect(findButton(section.installElement, 'Forget the direction').hidden).toBe(true);
  });

  it('offers Forget the direction in the direction step once one is learned (#332)', () => {
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        learnMounting: { ...learnMounting, getLearnedMounting: () => IDENTITY_AXIS_MAPPING },
      }),
    );
    const forget = findButton(section.installElement, 'Forget the direction');
    expect(forget.hidden).toBe(false);
    expect(forget.classList.contains('link-button')).toBe(true);
  });

  it('is offered for the EasyLevel box too (#360)', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', learnMounting }),
    );
    expect(section.installElement.textContent).toContain('Learn it by raising the front');
  });

  it('is not offered for a box that does not', () => {
    const sensor = {
      ...EASYLEVEL_DESCRIPTOR,
      capabilities: { ...EASYLEVEL_DESCRIPTOR.capabilities, learnMounting: false },
    };
    const section = createSensorSourceSection(
      makeOptions({ sensor, getSensorSource: () => 'easylevel', learnMounting }),
    );
    expect(section.installElement.textContent).not.toContain('Learn it by raising the front');
  });
});

// Pins (#416) of every state the section draws and every callback it
// fires, written before the builder is split up, so the split cannot
// change them.
describe('pinned before the #416 split', () => {
  const learnedXparkle = (
    learned: ReturnType<NonNullable<SensorSourceOptions['learnMounting']>['getLearnedMounting']>,
  ) => ({
    getRawReading: () => ({ pitchDeg: 0, rollDeg: 0 }),
    getLearnedMounting: () => learned,
    setLearnedMounting: () => {},
  });

  function card(root: HTMLElement) {
    return {
      element: root.querySelector<HTMLElement>('.sensor-card')!,
      mark: root.querySelector<HTMLElement>('.sensor-card__mark')!,
      state: root.querySelector<HTMLElement>('.sensor-card__state')!,
    };
  }

  function steps(root: HTMLElement) {
    return [...root.querySelectorAll<HTMLElement>('.box-step')].map((step) => ({
      element: step,
      header: step.querySelector<HTMLButtonElement>('.box-step__header')!,
      mark: step.querySelector<HTMLElement>('.box-step__mark')!.textContent,
      title: step.querySelector<HTMLElement>('.box-step__title')!.textContent,
      open: !step.querySelector<HTMLElement>('.box-step__body')!.hidden,
      done: step.classList.contains('is-done'),
    }));
  }

  it('marks the card + while not in use, ✓ in use, ! when lost or rejected', () => {
    const cases = [
      { source: 'phone', state: 'idle', rejected: false, mark: '+', cls: '' },
      { source: 'easylevel', state: 'granted', rejected: false, mark: '✓', cls: 'is-active' },
      { source: 'easylevel', state: 'disconnected', rejected: false, mark: '!', cls: 'is-lost' },
      { source: 'easylevel', state: 'granted', rejected: true, mark: '!', cls: 'is-lost' },
    ] as const;
    for (const c of cases) {
      const section = createSensorSourceSection(
        makeOptions({
          getSensorSource: () => c.source,
          getSensorState: () => c.state,
          password: { isRejected: () => c.rejected, tryPassword: () => Promise.resolve(true) },
        }),
      );
      const { element, mark, state } = card(section.element);
      expect(mark.textContent).toBe(c.mark);
      expect(element.classList.contains('is-active')).toBe(c.cls === 'is-active');
      expect(element.classList.contains('is-lost')).toBe(c.cls === 'is-lost');
      expect(state.hidden).toBe(c.source === 'phone');
    }
  });

  it('says Connecting under the name while the connect is on its way', () => {
    const section = createSensorSourceSection(
      makeOptions({ connectSensor: () => new Promise(() => {}) }),
    );
    const connect = findButton(section.element, 'Connect EasyLevel sensor');
    connect.click();
    expect(connect.hidden).toBe(true);
    expect(card(section.element).state.hidden).toBe(false);
    expect(card(section.element).state.textContent).toBe(t('sensorSource.status.connecting'));
  });

  it('tells the caller after a failed connect too', async () => {
    const onSourceChanged = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({ connectSensor: () => Promise.resolve('denied') }),
      undefined,
      onSourceChanged,
    );
    findButton(section.element, 'Connect EasyLevel sensor').click();
    await Promise.resolve();
    await Promise.resolve();
    expect(onSourceChanged).toHaveBeenCalledOnce();
    expect(card(section.element).state.textContent).toBe(
      t('sensorSource.err.failed', { name: 'EasyLevel' }),
    );
  });

  it('disconnects, redraws and tells the caller', () => {
    let source: 'easylevel' | 'phone' = 'easylevel';
    const disconnectSensor = vi.fn(() => {
      source = 'phone';
    });
    const onSourceChanged = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => source, disconnectSensor }),
      undefined,
      onSourceChanged,
    );
    findButton(section.element, 'Disconnect').click();
    expect(disconnectSensor).toHaveBeenCalledOnce();
    expect(onSourceChanged).toHaveBeenCalledOnce();
    expect(section.installElement.hidden).toBe(false);
    expect(section.moreElement.hidden).toBe(true);
  });

  it('numbers the steps 1 and 2 and ticks each one when done', () => {
    const todo = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    expect(steps(todo.installElement).map((s) => [s.mark, s.done])).toEqual([
      ['1', false],
      ['2', false],
    ]);
    const done = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        isMountingPicked: () => true,
        getInstallCalibration: () => ({ rollDeg: 0, pitchDeg: 0 }),
      }),
    );
    expect(steps(done.installElement).map((s) => [s.mark, s.done])).toEqual([
      ['✓', true],
      ['✓', true],
    ]);
  });

  it('opens the next undone step, and none once both are done', () => {
    const open = (picked: boolean, zeroed: boolean) =>
      steps(
        createSensorSourceSection(
          makeOptions({
            getSensorSource: () => 'easylevel',
            isMountingPicked: () => picked,
            getInstallCalibration: () => (zeroed ? { rollDeg: 0, pitchDeg: 0 } : null),
          }),
        ).installElement,
      ).map((s) => s.open);
    expect(open(false, false)).toEqual([true, false]);
    expect(open(true, false)).toEqual([false, true]);
    expect(open(false, true)).toEqual([true, false]);
    expect(open(true, true)).toEqual([false, false]);
  });

  it('opens a step by hand, and keeps one closed by hand closed on refresh', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    const [direction, zero] = steps(section.installElement);
    zero!.header.click();
    expect(steps(section.installElement).map((s) => s.open)).toEqual([false, true]);
    expect(zero!.element.classList.contains('is-open')).toBe(true);
    expect(direction!.element.classList.contains('is-open')).toBe(false);
    zero!.header.click();
    expect(steps(section.installElement).map((s) => s.open)).toEqual([false, false]);
    section.refresh();
    expect(steps(section.installElement).map((s) => s.open)).toEqual([false, false]);
  });

  it('keeps the zero step open after a zero, and names its age', () => {
    let offset: { rollDeg: number; pitchDeg: number } | null = null;
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        isMountingPicked: () => true,
        getInstallCalibration: () => offset,
        getInstallCalibrationCapturedAt: () => null,
        calibrateInstall: () => {
          offset = { rollDeg: 0, pitchDeg: 0 };
          return null;
        },
      }),
    );
    findButton(section.installElement, 'Zero now').click();
    const [, zero] = steps(section.installElement);
    expect(zero!.open).toBe(true);
    expect(zero!.title).toBe(t('box.step.zero.done'));
    expect(findButton(section.installElement, t('box.step.zero.again'))).toBeDefined();
  });

  it('forgets an EasyLevel placement by passing null', () => {
    const setMounting = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        isMountingPicked: () => true,
        setMounting,
      }),
    );
    findButton(section.installElement, 'Forget the direction').click();
    expect(setMounting).toHaveBeenCalledWith(null);
  });

  it('forgets a learned Xparkle direction by passing null', () => {
    const setLearnedMounting = vi.fn();
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        learnMounting: { ...learnedXparkle(IDENTITY_AXIS_MAPPING), setLearnedMounting },
      }),
    );
    findButton(section.installElement, 'Forget the direction').click();
    expect(setLearnedMounting).toHaveBeenCalledWith(null);
  });

  it('shows and hides the lift guide from its link', () => {
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        learnMounting: learnedXparkle(null),
      }),
    );
    const link = findButton(section.installElement, t('box.step.direction.learn'));
    const guide = link.nextElementSibling as HTMLElement;
    expect(guide.hidden).toBe(true);
    link.click();
    expect(guide.hidden).toBe(false);
    link.click();
    expect(guide.hidden).toBe(true);
  });

  it('has no direction step for a box with neither a mounting nor a lift guide', () => {
    const section = createSensorSourceSection(
      makeOptions({ sensor: XPARKLE_DESCRIPTOR, getSensorSource: () => 'xparkle' }),
    );
    expect(steps(section.installElement).map((s) => s.mark)).toEqual(['2']);
  });

  it('says it is waiting for a reading before the first sample', () => {
    const section = createSensorSourceSection(
      makeOptions({
        sensor: XPARKLE_DESCRIPTOR,
        getSensorSource: () => 'xparkle',
        getCalibratedTilt: () => null,
      }),
    );
    expect(section.positionElement.hidden).toBe(false);
    expect(section.positionElement.textContent).toBe(t('box.step.position.waiting'));
    expect(section.positionElement.classList.contains('is-done')).toBe(false);
    expect(section.positionElement.classList.contains('is-warning')).toBe(false);
  });

  it('redraws the whole card from refreshLive() once the password verdict changes', () => {
    let rejected = false;
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getSensorState: () => 'granted',
        password: { isRejected: () => rejected, tryPassword: () => Promise.resolve(true) },
      }),
    );
    expect(card(section.element).mark.textContent).toBe('✓');
    rejected = true;
    section.refreshLive();
    expect(card(section.element).mark.textContent).toBe('!');
  });

  it('stacks the card, the checklist and the footer in element', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    expect([...section.element.children]).toEqual([
      section.connectElement,
      section.installElement,
      section.moreElement,
    ]);
  });
});
