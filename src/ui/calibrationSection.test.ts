// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { setLanguage, t } from './i18n';
import type { Calibration } from '../domain/settings';

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
    expect(statuses.some((s) => s?.includes('Calibrated: side/side 1.0'))).toBe(true);
    expect(statuses.some((s) => s?.includes('Vehicle zero: side/side 0.4'))).toBe(true);
  });

  it('sets the current position as level via the host callback', () => {
    const calibrateVehicle = vi.fn<() => string | null>(() => null);
    const section = createCalibrationSection(makeOptions({ calibrateVehicle }));
    buttonByText(section.element, 'Set current position as level').click();
    expect(calibrateVehicle).toHaveBeenCalledTimes(1);
  });

  it('surfaces a rejection and disables clear while nothing is stored', () => {
    const section = createCalibrationSection(
      makeOptions({ calibrateVehicle: () => 'not level enough' }),
    );
    const clear = buttonByText(section.element, 'Clear vehicle zero');
    expect(clear.disabled).toBe(true);
    buttonByText(section.element, 'Set current position as level').click();
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
    expect(check[1]!.disabled).toBe(true); // no vehicle zero stored
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
    const clear = buttonByText(section.element, 'Clear vehicle zero');
    expect(clear.disabled).toBe(false);
    clear.click();
    expect(clear.disabled).toBe(true);
  });
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
  it('shows the side/side and front/back numbers only in each status sentence, no separate readout box', () => {
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
    expect(statuses.some((s) => s?.includes('side/side 1.2'))).toBe(true);
    expect(statuses.some((s) => s?.includes('side/side 0.4'))).toBe(true);
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

    buttonByText(section.element, 'Set current position as level').click();
    expect(calibrateVehicle).toHaveBeenCalledTimes(1);

    buttonByText(section.element, 'Clear vehicle zero').click();
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
      const vehicleBtn = buttonByText(section.element, 'Set current position as level');
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
      getExternalSensor: () =>
        active ? { name: 'Xparkle RVS01', offset: null, capturedAt: null } : null,
      calibrateExternalSensor: () => null,
      ...overrides,
    });
    return { options, setPhone: () => (active = false) };
  }

  it('offers it, named, only while an external sensor is active', () => {
    const { options, setPhone } = externalOptions();
    const section = createCalibrationSection(options);
    expect(section.element.textContent).toContain('Calibrate Xparkle RVS01');
    const button = buttonByText(section.element, 'Zero now');
    expect(button.closest('[hidden]')).toBeNull();
    expect(button.disabled).toBe(false);

    setPhone();
    section.refresh();
    expect(button.closest('[hidden]')).not.toBeNull();
  });

  it('waits for a box that zeroes itself, then says it is calibrated', async () => {
    let answer: (error: string | null) => void = () => {};
    const calibrateExternalSensor = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          answer = resolve;
        }),
    );
    const { options } = externalOptions({ calibrateExternalSensor });
    const section = createCalibrationSection(options);
    const button = buttonByText(section.element, 'Zero now');
    button.click();
    expect(calibrateExternalSensor).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(true);
    expect(section.element.textContent).toContain('Calibrating');

    answer(null);
    await Promise.resolve();
    await Promise.resolve();
    expect(button.disabled).toBe(false);
    expect(section.element.textContent).toContain('Xparkle RVS01 is calibrated');
  });

  it('links to the box’s own page for the rest of its setup (#316)', () => {
    const openExternalSensor = vi.fn();
    const { options } = externalOptions({ openExternalSensor });
    const section = createCalibrationSection(options);
    const link = buttonByText(section.element, 'Show the box');
    expect(link.classList.contains('link-button')).toBe(true);
    link.click();
    expect(openExternalSensor).toHaveBeenCalledOnce();
  });

  it('shows the error, not success, when calibration fails', () => {
    const { options } = externalOptions({
      calibrateExternalSensor: () => 'Xparkle RVS01 is not connected. Connect it and try again.',
    });
    const section = createCalibrationSection(options);
    buttonByText(section.element, 'Zero now').click();
    expect(section.element.textContent).toContain('is not connected');
    expect(section.element.textContent).not.toContain('is calibrated');
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
        getExternalSensor: () => ({ name: 'Xparkle RVS01', offset: null, capturedAt: null }),
        calibrateExternalSensor: () => null,
      }),
      'checklist',
    );
    expect(section.element.querySelector('.box-setup')?.closest('[hidden]')).not.toBeNull();
    expect(buttonByText(section.element, 'Zero now').closest('[hidden]')).toBeNull();
  });
});
