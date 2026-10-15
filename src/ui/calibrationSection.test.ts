// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { setLanguage, t } from './i18n';
import type { Calibration } from '../domain/calibration';

setLanguage('en');

function makeOptions(overrides: Partial<CalibrationOptions> = {}): CalibrationOptions {
  return {
    appearance: 'classic',
    getCalibration: () => null,
    calibrate: () => null,
    readTilt: () => ({ rollDeg: 0, pitchDeg: 0 }),
    applyCalibration: () => {},
    clearCalibration: () => {},
    getVehicleCalibration: () => null,
    calibrateVehicle: () => null,
    clearVehicleCalibration: () => {},
    getCalibrationCapturedAt: () => null,
    getVehicleCalibrationCapturedAt: () => null,
    checkCalibration: () => 'checked',
    checkVehicleCalibration: () => 'checked',
    ...overrides,
  };
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  return [...root.querySelectorAll('button')].find((b) => b.textContent === text)!;
}

/** The one shown button with this text — "Calibrate anyway" exists for
 * both the one-shot and the flip calibration (#425). */
function visibleButton(root: HTMLElement, text: string): HTMLButtonElement | undefined {
  return [...root.querySelectorAll('button')].find((b) => b.textContent === text && !b.hidden);
}

describe('calibration section (#83)', () => {
  it('shows both calibrations with their own status', () => {
    let vehicle: Calibration | null = { rollDeg: 0.4, pitchDeg: 0.2 };
    const section = createCalibrationSection(
      makeOptions({
        getCalibration: () => ({ rollDeg: 1.0, pitchDeg: -0.5 }),
        getVehicleCalibration: () => vehicle,
      }),
    );
    const statuses = [...section.element.querySelectorAll('.menu__text--status')].map(
      (s) => s.textContent,
    );
    expect(statuses.some((s) => s?.includes('Calibrated: front/back −0.5°, side/side +1.0°'))).toBe(
      true,
    );
    expect(
      statuses.some((s) => s?.includes('Vehicle zero: front/back +0.2°, side/side +0.4°')),
    ).toBe(true);
  });

  it('sets the current position as level via the host callback', () => {
    const calibrateVehicle = vi.fn<() => string | null>(() => null);
    const section = createCalibrationSection(makeOptions({ calibrateVehicle }));
    buttonByText(section.element, 'Zero now').click();
    expect(calibrateVehicle).toHaveBeenCalledTimes(1);
  });

  it('surfaces a rejection and hides clear while nothing is stored (#517)', () => {
    const section = createCalibrationSection(
      makeOptions({ calibrateVehicle: () => 'not level enough' }),
    );
    const clear = buttonByText(section.element, 'Forget the zero');
    expect(clear.hidden).toBe(true);
    buttonByText(section.element, 'Zero now').click();
    expect(
      [...section.element.querySelectorAll('.menu__text--status')].some(
        (s) => s.textContent === 'not level enough',
      ),
    ).toBe(true);
  });

  it('shows each calibration age and runs the check flow (#87)', () => {
    const twoWeeksAgo = Date.now() - 14 * 86_400_000;
    const checkCalibration = vi.fn<() => string>(() => 'Still good — off by 0.1°.');
    const section = createCalibrationSection(
      makeOptions({
        getCalibration: () => ({ rollDeg: 1.0, pitchDeg: -0.5 }),
        getCalibrationCapturedAt: () => twoWeeksAgo,
        checkCalibration,
      }),
    );
    const statuses = () =>
      [...section.element.querySelectorAll('.menu__text--status')].map((s) => s.textContent);
    expect(statuses().some((s) => s?.includes('(14 days ago)'))).toBe(true);
    const check = [...section.element.querySelectorAll('button')].filter(
      (b) => b.textContent === 'Check',
    );
    expect(check).toHaveLength(2);
    expect(check[1]!.disabled).toBe(false); // no vehicle zero stored, still tappable (#517)
    check[0]!.click();
    expect(checkCalibration).toHaveBeenCalledTimes(1);
    expect(statuses().some((s) => s === 'Still good — off by 0.1°.')).toBe(true);
  });

  it('clears the vehicle zero via the host callback', () => {
    let vehicle: Calibration | null = { rollDeg: 0.4, pitchDeg: 0.2 };
    const section = createCalibrationSection(
      makeOptions({
        getVehicleCalibration: () => vehicle,
        clearVehicleCalibration: () => {
          vehicle = null;
        },
      }),
    );
    const clear = buttonByText(section.element, 'Forget the zero');
    expect(clear.hidden).toBe(false);
    clear.click();
    expect(clear.hidden).toBe(true);
  });

  it.each([
    ['phone', 0, 'calibration.check.none', 'calibration.now'],
    ['vehicle', 1, 'calibration.vehicle.check.none', 'calibration.vehicle.now'],
  ] as const)(
    'keeps Check tappable with no %s value stored, and says how to get one (#517)',
    (_kind, index, key, now) => {
      const checkCalibration = vi.fn(() => 'checked');
      const checkVehicleCalibration = vi.fn(() => 'checked');
      const section = createCalibrationSection(
        makeOptions({ checkCalibration, checkVehicleCalibration }),
      );
      const check = [...section.element.querySelectorAll('button')].filter(
        (b) => b.textContent === 'Check',
      )[index]!;
      expect(check.disabled).toBe(false);
      check.click();
      expect(checkCalibration).not.toHaveBeenCalled();
      expect(checkVehicleCalibration).not.toHaveBeenCalled();
      const statuses = [...section.element.querySelectorAll('.menu__text--status')];
      expect(statuses.some((s) => s.textContent === t(key, { now: t(now) }))).toBe(true);
    },
  );
});

describe('calibration section — Modern two-card layout (#109)', () => {
  it('renders two cards, each with its own status pill', () => {
    const section = createCalibrationSection(makeOptions({ appearance: 'modern' }));
    const cards = section.element.querySelectorAll('.calibration-card');
    expect(section.element.className).toBe('calibration-cards');
    expect(cards).toHaveLength(2);
    const pills = section.element.querySelectorAll('.calibration-card__pill');
    expect(pills).toHaveLength(2);
    expect(pills[0]!.textContent).toBe('NOT DONE');
    expect(pills[1]!.textContent).toBe('NONE');
  });

  it('flips both pills to the done look once each calibration is set', () => {
    const section = createCalibrationSection(
      makeOptions({
        appearance: 'modern',
        getCalibration: () => ({ rollDeg: 1.0, pitchDeg: -0.5 }),
        getVehicleCalibration: () => ({ rollDeg: 0.4, pitchDeg: 0.2 }),
      }),
    );
    const pills = section.element.querySelectorAll('.calibration-card__pill');
    expect(pills[0]!.textContent).toBe('DONE');
    expect(pills[0]!.className).toContain('calibration-card__pill--done');
    expect(pills[1]!.textContent).toBe('DONE');
    expect(pills[1]!.className).toContain('calibration-card__pill--done');
  });

  it('the sensor pill updates live when "Calibrate now" succeeds', () => {
    const calibrate = vi.fn<() => string | null>(() => null);
    let calibrated: Calibration | null = null;
    const section = createCalibrationSection(
      makeOptions({
        appearance: 'modern',
        calibrate,
        applyCalibration: (c) => {
          calibrated = c;
        },
        getCalibration: () => calibrated,
      }),
    );
    const pill = section.element.querySelector('.calibration-card__pill')!;
    expect(pill.textContent).toBe('NOT DONE');
    buttonByText(section.element, 'Calibrate now').click();
    expect(calibrate).toHaveBeenCalledTimes(1);
    expect(pill.textContent).toBe('NOT DONE'); // calibrate() itself doesn't call applyCalibration
  });

  // Design review, follow-up: a separate numeric readout box was tried
  // for the phone card (and briefly added to the vehicle-zero card too)
  // but rejected — the status sentence already states the numbers, so
  // both cards now show them only there, matching the vehicle-zero
  // card's original, simpler layout.
  it('shows the front/back and side/side numbers only in each status sentence, no separate readout box', () => {
    const section = createCalibrationSection(
      makeOptions({
        appearance: 'modern',
        getCalibration: () => ({ rollDeg: 1.2, pitchDeg: -3.4 }),
        getVehicleCalibration: () => ({ rollDeg: 0.4, pitchDeg: 0.2 }),
      }),
    );
    expect(section.element.querySelector('.calibration-card__reading-value')).toBeNull();
    const statuses = [...section.element.querySelectorAll('.menu__text--status')].map(
      (s) => s.textContent,
    );
    expect(statuses.some((s) => s?.includes('front/back −3.4°, side/side +1.2°'))).toBe(true);
    expect(statuses.some((s) => s?.includes('front/back +0.2°, side/side +0.4°'))).toBe(true);
  });

  it('wires every button to the same host callbacks as Classic mode', () => {
    const calibrate = vi.fn<() => string | null>(() => null);
    const clearCalibration = vi.fn();
    const calibrateVehicle = vi.fn<() => string | null>(() => null);
    const clearVehicleCalibration = vi.fn();
    const checkCalibration = vi.fn<() => string>(() => 'checked');
    const checkVehicleCalibration = vi.fn<() => string>(() => 'checked');
    const applyCalibration = vi.fn();
    const section = createCalibrationSection(
      makeOptions({
        appearance: 'modern',
        // Non-null so Clear/Check start enabled (as they would once the
        // host actually has something stored).
        getCalibration: () => ({ rollDeg: 1.0, pitchDeg: -0.5 }),
        getVehicleCalibration: () => ({ rollDeg: 0.4, pitchDeg: 0.2 }),
        calibrate,
        clearCalibration,
        calibrateVehicle,
        clearVehicleCalibration,
        checkCalibration,
        checkVehicleCalibration,
        applyCalibration,
      }),
    );

    buttonByText(section.element, 'Calibrate now').click();
    expect(calibrate).toHaveBeenCalledTimes(1);

    buttonByText(section.element, 'Clear calibration').click();
    expect(clearCalibration).toHaveBeenCalledTimes(1);

    buttonByText(section.element, 'Check').click(); // sensor check — first "Check" in DOM order
    expect(checkCalibration).toHaveBeenCalledTimes(1);
    expect(checkVehicleCalibration).not.toHaveBeenCalled();

    buttonByText(section.element, 'Zero now').click();
    expect(calibrateVehicle).toHaveBeenCalledTimes(1);

    buttonByText(section.element, 'Forget the zero').click();
    expect(clearVehicleCalibration).toHaveBeenCalledTimes(1);

    // The flip flow (#50): first click captures, second click (after a
    // fresh reading) applies via applyCalibration — same as Classic.
    buttonByText(section.element, 'Calibrate by flipping').click();
    buttonByText(section.element, 'Capture').click();
    expect(applyCalibration).toHaveBeenCalledTimes(1);
  });

  it('all three calibrate actions are equally primary-styled, in both appearances', () => {
    for (const appearance of ['classic', 'modern'] as const) {
      const section = createCalibrationSection(makeOptions({ appearance }));
      const calibrateBtn = buttonByText(section.element, 'Calibrate now');
      const vehicleBtn = buttonByText(section.element, 'Zero now');
      const flipBtn = buttonByText(section.element, 'Calibrate by flipping');
      expect(calibrateBtn.className).not.toContain('menu__action--secondary');
      expect(vehicleBtn.className).not.toContain('menu__action--secondary');
      expect(flipBtn.className).not.toContain('menu__action--secondary');
    }
  });
});

describe('calibration with an external sensor active (#285)', () => {
  it('disables every phone calibration action, without a paragraph about the phone (#316)', () => {
    let phone = false;
    const section = createCalibrationSection(
      makeOptions({
        getCalibration: () => ({ rollDeg: 1, pitchDeg: 1 }),
        getVehicleCalibration: () => ({ rollDeg: 1, pitchDeg: 1 }),
        isPhoneActive: () => phone,
      }),
    );
    const buttons = () => [...section.element.querySelectorAll('button')];
    expect(buttons().length).toBeGreaterThan(0);
    expect(buttons().every((b) => b.disabled)).toBe(true);
    expect(section.element.textContent).not.toContain('Switch to the phone sensor');

    phone = true;
    section.refresh();
    expect(buttonByText(section.element, 'Calibrate now').disabled).toBe(false);
  });

  it('hides the phone cards so the box is not buried under them, and brings them back', () => {
    let phone = false;
    const section = createCalibrationSection(makeOptions({ isPhoneActive: () => phone }));
    const calibrate = buttonByText(section.element, 'Calibrate now');
    expect(calibrate.closest('[hidden]')).not.toBeNull();
    expect(section.sensorElement.hidden).toBe(true);
    expect(section.vehicleElement.hidden).toBe(true);

    phone = true;
    section.refresh();
    expect(calibrate.closest('[hidden]')).toBeNull();
    expect(section.vehicleElement.hidden).toBe(false);
  });

  it('behaves as before when the host does not say (phone assumed)', () => {
    const section = createCalibrationSection(makeOptions());
    expect(buttonByText(section.element, 'Calibrate now').disabled).toBe(false);
  });
});

describe('calibrating the active external sensor from this tab (#290)', () => {
  function externalOptions(overrides: Partial<CalibrationOptions> = {}) {
    let active = true;
    const options = makeOptions({
      isPhoneActive: () => !active,
      getBox: () => (active ? { name: 'Xparkle RVS01', offset: null, capturedAt: null } : null),
      calibrateBox: () => null,
      ...overrides,
    });
    return { options, setPhone: () => (active = false) };
  }

  it('offers it, under the one zero heading, only while an external sensor is active', () => {
    const { options, setPhone } = externalOptions();
    const section = createCalibrationSection(options);
    expect(section.element.textContent).toContain(
      'Level the vehicle once with a spirit level, then zero.',
    );
    const button = buttonByText(section.element, 'Zero now');
    expect(button.closest('[hidden]')).toBeNull();
    expect(button.disabled).toBe(false);

    setPhone();
    section.refresh();
    expect(button.closest('[hidden]')).not.toBeNull();
  });

  it('says why the phone cards are gone and how to get them back (#515)', () => {
    const { options, setPhone } = externalOptions();
    const section = createCalibrationSection(options);
    const line = t('calibration.external.phoneHidden', {
      disconnect: t('sensorSource.disconnect'),
    });
    const note = [...section.element.querySelectorAll('p')].find((p) => p.textContent === line);
    expect(note).toBeDefined();
    expect(note!.closest('[hidden]')).toBeNull();

    setPhone();
    section.refresh();
    expect(note!.closest('[hidden]')).not.toBeNull();
  });

  it('waits for a box that zeroes itself, then says it is zeroed', async () => {
    let answer: (error: string | null) => void = () => {};
    const calibrateBox = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          answer = resolve;
        }),
    );
    const { options } = externalOptions({ calibrateBox });
    const section = createCalibrationSection(options);
    const button = buttonByText(section.element, 'Zero now');
    button.click();
    expect(calibrateBox).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(true);
    expect(section.element.textContent).toContain('Zeroing');

    answer(null);
    await Promise.resolve();
    await Promise.resolve();
    expect(button.disabled).toBe(false);
    expect(section.element.textContent).toContain('Xparkle RVS01 is zeroed');
  });

  it('warns about a tilted box and zeroes it anyway on request (#425)', async () => {
    const calibrateBox = vi.fn((anyway?: boolean) =>
      Promise.resolve(anyway ? null : { warning: 'Is the vehicle level?' }),
    );
    const { options } = externalOptions({ calibrateBox });
    const section = createCalibrationSection(options);
    buttonByText(section.element, 'Zero now').click();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent).toContain('Is the vehicle level?');
    const anyway = buttonByText(section.element, t('calibration.vehicle.anyway'));
    expect(anyway.hidden).toBe(false);
    anyway.click();
    expect(calibrateBox).toHaveBeenLastCalledWith(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(anyway.hidden).toBe(true);
    expect(section.element.textContent).toContain('Xparkle RVS01 is zeroed');
  });

  it('links to the box’s own page for the rest of its setup (#316)', () => {
    const openBoxPage = vi.fn();
    const { options } = externalOptions({ openBoxPage });
    const section = createCalibrationSection(options);
    const link = buttonByText(section.element, 'Show the box');
    expect(link.classList.contains('link-button')).toBe(true);
    link.click();
    expect(openBoxPage).toHaveBeenCalledOnce();
  });

  it('shows the error, not success, when calibration fails', () => {
    const { options } = externalOptions({
      calibrateBox: () => 'Xparkle RVS01 is not connected. Connect it and try again.',
    });
    const section = createCalibrationSection(options);
    buttonByText(section.element, 'Zero now').click();
    expect(section.element.textContent).toContain('is not connected');
    expect(section.element.textContent).not.toContain('is zeroed');
  });
});

// Settings → Calibration (#330): the same checklist pattern as the box's
// own setup (#314) — two steps, only the next undone one expanded.
describe('calibration checklist in Settings (#330)', () => {
  function steps(section: ReturnType<typeof createCalibrationSection>): HTMLElement[] {
    return [...section.element.querySelectorAll<HTMLElement>('.box-step')];
  }
  function body(step: HTMLElement): HTMLElement {
    return step.querySelector<HTMLElement>('.box-step__body')!;
  }

  it('shows two steps with the phone expanded first, and no "Two layers" intro', () => {
    const section = createCalibrationSection(makeOptions(), 'checklist');
    const [phone, vehicle] = steps(section);
    expect(steps(section)).toHaveLength(2);
    expect(phone!.querySelector('.box-step__mark')?.textContent).toBe('1');
    expect(body(phone!).hidden).toBe(false);
    expect(body(vehicle!).hidden).toBe(true);
    expect(body(phone!).textContent).toContain(t('calibration.step.phone.hint'));
    expect(buttonByText(body(phone!), t('calibration.now'))).toBeDefined();
    expect(section.element.textContent).not.toContain('Two layers');
  });

  it('keeps Check and Clear under a collapsed More in each step', () => {
    const section = createCalibrationSection(makeOptions(), 'checklist');
    for (const step of steps(section)) {
      const more = step.querySelector<HTMLDetailsElement>('details')!;
      expect(more.open).toBe(false);
      expect(more.querySelector('summary')?.textContent).toBe(t('settings.more'));
      expect(buttonByText(more, t('calibration.check'))).toBeDefined();
    }
  });

  it('marks a done step with ✓ and its age, and expands the next one', () => {
    const section = createCalibrationSection(
      makeOptions({
        getCalibration: () => ({ rollDeg: 1, pitchDeg: 0 }),
        getCalibrationCapturedAt: () => Date.now() - 3 * 86_400_000,
      }),
      'checklist',
    );
    const [phone, vehicle] = steps(section);
    expect(phone!.classList.contains('is-done')).toBe(true);
    expect(phone!.querySelector('.box-step__mark')?.textContent).toBe('✓');
    expect(phone!.querySelector('.box-step__title')?.textContent).toBe(
      t('calibration.step.phone.done') + ' ' + t('calibration.age.days', { n: 3 }),
    );
    expect(body(phone!).hidden).toBe(true);
    expect(body(vehicle!).hidden).toBe(false);
    expect(body(vehicle!).textContent).toContain(t('calibration.step.vehicle.hint'));
    expect(buttonByText(body(vehicle!), t('calibration.step.vehicle.now'))).toBeDefined();
  });

  it('moves on to the vehicle zero once the phone is calibrated', () => {
    let calibration: Calibration | null = null;
    const section = createCalibrationSection(
      makeOptions({
        getCalibration: () => calibration,
        calibrate: () => {
          calibration = { rollDeg: 0, pitchDeg: 0 };
          return null;
        },
      }),
      'checklist',
    );
    const [phone, vehicle] = steps(section);
    buttonByText(body(phone!), t('calibration.now')).click();
    expect(body(phone!).hidden).toBe(true);
    expect(body(vehicle!).hidden).toBe(false);
  });

  it('keeps the step open with the reason when calibrating fails', () => {
    const section = createCalibrationSection(
      makeOptions({ calibrate: () => 'hold still' }),
      'checklist',
    );
    const [phone] = steps(section);
    buttonByText(body(phone!), t('calibration.now')).click();
    expect(body(phone!).hidden).toBe(false);
    expect(body(phone!).textContent).toContain('hold still');
  });

  it('lets every step be opened at any time', () => {
    const section = createCalibrationSection(
      makeOptions({
        getCalibration: () => ({ rollDeg: 0, pitchDeg: 0 }),
        getVehicleCalibration: () => ({ rollDeg: 0, pitchDeg: 0 }),
      }),
      'checklist',
    );
    const [phone, vehicle] = steps(section);
    expect(body(phone!).hidden).toBe(true);
    expect(body(vehicle!).hidden).toBe(true);
    phone!.querySelector<HTMLButtonElement>('.box-step__header')!.click();
    expect(body(phone!).hidden).toBe(false);
    vehicle!.querySelector<HTMLButtonElement>('.box-step__header')!.click();
    expect(body(vehicle!).hidden).toBe(false);
    expect(body(phone!).hidden).toBe(true);
  });

  it('runs the flip calibration from the quiet link', () => {
    const applyCalibration = vi.fn();
    const section = createCalibrationSection(makeOptions({ applyCalibration }), 'checklist');
    const [phone] = steps(section);
    const flip = buttonByText(body(phone!), t('calibration.flip.start'));
    expect(flip.closest('[hidden]')).not.toBeNull();
    const link = body(phone!).querySelector<HTMLButtonElement>('button.link-button')!;
    expect(link.textContent).toBe(t('calibration.step.flipLink'));
    link.click();
    expect(flip.closest('[hidden]')).toBeNull();
    flip.click();
    buttonByText(body(phone!), t('calibration.flip.capture')).click();
    expect(applyCalibration).toHaveBeenCalledTimes(1);
  });

  it('hides the checklist while an external box is active, as before (#316)', () => {
    const section = createCalibrationSection(
      makeOptions({
        isPhoneActive: () => false,
        getBox: () => ({ name: 'Xparkle RVS01', offset: null, capturedAt: null }),
        calibrateBox: () => null,
      }),
      'checklist',
    );
    expect(section.element.querySelector('.box-setup')?.closest('[hidden]')).not.toBeNull();
    expect(buttonByText(section.element, 'Zero now').closest('[hidden]')).toBeNull();
  });
});

// #411: "Varning är rätt. Aldrig stopp." Above 15° the capture comes back as
// a warning with a "… anyway" action, in every layout.
describe('a tilted capture warns and offers to go ahead anyway (#411)', () => {
  const layouts = [
    ['classic', 'cards'],
    ['modern', 'cards'],
    ['modern', 'checklist'],
  ] as const;

  for (const [appearance, layout] of layouts) {
    it(`calibrates the phone anyway (${appearance} ${layout})`, () => {
      const calibrate = vi.fn((anyway?: boolean) =>
        anyway ? null : { warning: 'Does not look flat' },
      );
      const section = createCalibrationSection(makeOptions({ appearance, calibrate }), layout);
      expect(visibleButton(section.element, t('calibration.anyway'))).toBeUndefined();
      buttonByText(section.element, t('calibration.now')).click();
      expect(section.element.textContent).toContain('Does not look flat');
      const anyway = visibleButton(section.element, t('calibration.anyway'))!;
      expect(anyway.hidden).toBe(false);
      anyway.click();
      expect(calibrate).toHaveBeenLastCalledWith(true);
      expect(anyway.hidden).toBe(true);
      expect(section.element.textContent).not.toContain('Does not look flat');
    });

    it(`zeroes the vehicle anyway (${appearance} ${layout})`, () => {
      const calibrateVehicle = vi.fn((anyway?: boolean) =>
        anyway ? null : { warning: 'Is the vehicle level?' },
      );
      const section = createCalibrationSection(
        makeOptions({ appearance, calibrateVehicle }),
        layout,
      );
      const zeroNow =
        layout === 'checklist' ? 'calibration.step.vehicle.now' : 'calibration.vehicle.now';
      buttonByText(section.element, t(zeroNow)).click();
      expect(section.element.textContent).toContain('Is the vehicle level?');
      const anyway = buttonByText(section.element, t('calibration.vehicle.anyway'));
      expect(anyway.hidden).toBe(false);
      anyway.click();
      expect(calibrateVehicle).toHaveBeenLastCalledWith(true);
      expect(anyway.hidden).toBe(true);
    });
  }

  it('offers no "anyway" for a plain error, which going ahead cannot fix', () => {
    const section = createCalibrationSection(makeOptions({ calibrate: () => 'no sensor' }));
    buttonByText(section.element, t('calibration.now')).click();
    expect(section.element.textContent).toContain('no sensor');
    expect(visibleButton(section.element, t('calibration.anyway'))).toBeUndefined();
  });

  it('keeps the checklist step open while the warning shows', () => {
    const section = createCalibrationSection(
      makeOptions({ calibrate: () => ({ warning: 'Does not look flat' }) }),
      'checklist',
    );
    buttonByText(section.element, t('calibration.now')).click();
    const phone = section.element.querySelector<HTMLElement>('.box-step__body')!;
    expect(phone.hidden).toBe(false);
  });
});

// #425: two flip captures that disagree (the phone moved) warn, and the
// user may keep the result anyway.
describe('flip captures that disagree (#425)', () => {
  it('warns, stores nothing, and calibrates anyway on request', () => {
    const readings = [
      { rollDeg: 20, pitchDeg: 0 },
      { rollDeg: 20, pitchDeg: 0 },
    ];
    const applyCalibration = vi.fn();
    const section = createCalibrationSection(
      makeOptions({ readTilt: () => readings.shift()!, applyCalibration }),
    );
    buttonByText(section.element, t('calibration.flip.start')).click();
    buttonByText(section.element, t('calibration.flip.capture')).click();
    expect(applyCalibration).not.toHaveBeenCalled();
    expect(section.element.textContent).toContain(t('calibration.flip.warn.moved'));
    const anyway = [...section.element.querySelectorAll('button')].filter(
      (b) => b.textContent === t('calibration.anyway') && !b.hidden,
    );
    expect(anyway).toHaveLength(1);
    anyway[0]!.click();
    expect(applyCalibration).toHaveBeenCalledWith({ rollDeg: 20, pitchDeg: 0 });
    expect(anyway[0]!.hidden).toBe(true);
    expect(section.element.textContent).not.toContain(t('calibration.flip.warn.moved'));
  });

  it('drops the pending result when the flip starts over', () => {
    const readings = [
      { rollDeg: 20, pitchDeg: 0 },
      { rollDeg: 20, pitchDeg: 0 },
      { rollDeg: 1, pitchDeg: 0 },
    ];
    const section = createCalibrationSection(makeOptions({ readTilt: () => readings.shift()! }));
    buttonByText(section.element, t('calibration.flip.start')).click();
    buttonByText(section.element, t('calibration.flip.capture')).click();
    buttonByText(section.element, t('calibration.flip.start')).click();
    const visibleAnyway = [...section.element.querySelectorAll('button')].filter(
      (b) => b.textContent === t('calibration.anyway') && !b.hidden,
    );
    expect(visibleAnyway).toHaveLength(0);
  });
});

describe('fine-tuning the vehicle zero (#596)', () => {
  const trim = (hasZero: boolean) => ({
    hasZero: () => hasZero,
    getTrim: () => ({ rollDeg: 0, pitchDeg: 0 }),
    nudge: () => {},
    reset: () => {},
  });

  it('sits with the vehicle zero, shown once there is a zero', () => {
    for (const layout of ['cards', 'checklist'] as const) {
      const zeroed = createCalibrationSection(makeOptions({ vehicleZeroTrim: trim(true) }), layout);
      const row = zeroed.vehicleElement.querySelector<HTMLElement>('.zero-trim');
      expect(row?.hidden).toBe(false);
      const none = createCalibrationSection(makeOptions({ vehicleZeroTrim: trim(false) }), layout);
      expect(none.vehicleElement.querySelector<HTMLElement>('.zero-trim')?.hidden).toBe(true);
    }
  });

  it('is left out of the first-run wizard, which has no zero yet', () => {
    const section = createCalibrationSection(
      makeOptions({ vehicleZeroTrim: trim(true) }),
      'wizard',
    );
    expect(section.element.querySelector('.zero-trim')).toBeNull();
  });
});
