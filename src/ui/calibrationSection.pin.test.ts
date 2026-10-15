// @vitest-environment happy-dom
// Pins (#416) of everything the calibration section draws, in every layout
// and appearance, through every action it offers — written before the
// builder is split up, so the split cannot change any of it. Each step's
// DOM (tags, classes, text, hidden/disabled) is compared with the stored
// snapshot.
import { describe, expect, it } from 'vitest';
import {
  createCalibrationSection,
  type CalibrationOptions,
  type CalibrationSection,
} from './calibrationSection';
import { setLanguage } from './i18n';
import type { Calibration, CaptureResult } from '../domain/calibration';

setLanguage('en');

/** The element tree as indented lines: tag, classes, state flags and its
 * own text. */
function describeDom(element: Element, depth = 0): string {
  const flags = ['hidden', 'disabled', 'open', 'aria-disabled']
    .filter((name) => element.hasAttribute(name))
    .map((name) => `[${name}]`);
  const ownText = [...element.childNodes]
    .filter((node) => node.nodeType === 3 && node.textContent?.trim())
    .map((node) => JSON.stringify(node.textContent!.trim()));
  const classes = [...element.classList].map((c) => `.${c}`).join('');
  const line = `${'  '.repeat(depth)}${element.tagName.toLowerCase()}${classes} ${[...flags, ...ownText].join(' ')}`;
  return [
    line.trimEnd(),
    ...[...element.children].map((child) => describeDom(child, depth + 1)),
  ].join('\n');
}

interface Host {
  options: CalibrationOptions;
  phone: Calibration | null;
  vehicle: Calibration | null;
  nextCapture: CaptureResult;
  nextVehicle: CaptureResult;
  tilt: Calibration | string;
  phoneActive: boolean;
  box: { name: string; offset: Calibration | null; capturedAt: number | null } | null;
  nextBox: CaptureResult | Promise<CaptureResult>;
}

function makeHost(appearance: 'classic' | 'modern', withBox: boolean): Host {
  const host: Host = {
    phone: null,
    vehicle: null,
    nextCapture: null,
    nextVehicle: null,
    tilt: { rollDeg: 1, pitchDeg: 2 },
    phoneActive: true,
    box: null,
    nextBox: null,
    options: undefined as unknown as CalibrationOptions,
  };
  // A capture is stored unless it errs; a warning carries the undo (#624).
  const capture = (
    result: CaptureResult,
    layer: 'phone' | 'vehicle',
    value: Calibration,
  ): CaptureResult => {
    if (typeof result === 'string') return result;
    const before = host[layer];
    host[layer] = value;
    return result && { warning: result.warning, undo: () => (host[layer] = before) };
  };
  host.options = {
    appearance,
    getCalibration: () => host.phone,
    calibrate: () => capture(host.nextCapture, 'phone', { rollDeg: 0.5, pitchDeg: -0.25 }),
    readTilt: () => host.tilt,
    applyCalibration: (calibration) => {
      const before = host.phone;
      host.phone = calibration;
      return () => (host.phone = before);
    },
    clearCalibration: () => (host.phone = null),
    getVehicleCalibration: () => host.vehicle,
    calibrateVehicle: () => capture(host.nextVehicle, 'vehicle', { rollDeg: 1.5, pitchDeg: 0.75 }),
    getCalibrationCapturedAt: () => null,
    getVehicleCalibrationCapturedAt: () => null,
    checkCalibration: () => 'phone checked',
    checkVehicleCalibration: () => 'vehicle checked',
    clearVehicleCalibration: () => (host.vehicle = null),
    ...(withBox
      ? {
          isPhoneActive: () => host.phoneActive,
          getBox: () => host.box,
          calibrateBox: () => {
            const result = host.nextBox;
            if (result instanceof Promise || typeof result === 'string' || !host.box) return result;
            const box = host.box;
            const before = box.offset;
            box.offset = { rollDeg: 0.1, pitchDeg: 0.2 };
            return result && { warning: result.warning, undo: () => (box.offset = before) };
          },
          openBoxPage: () => {},
        }
      : {}),
  };
  return host;
}

function click(section: CalibrationSection, text: string, nth = 0): void {
  const matches = [...section.element.querySelectorAll('button')].filter(
    (button) => button.textContent === text,
  );
  const button = matches[nth];
  if (!button) throw new Error(`no button "${text}" #${nth}`);
  button.click();
}

/** The one Undo on screen: each warning has its own, the rest hidden. */
function clickUndo(section: CalibrationSection): void {
  const shown = [...section.element.querySelectorAll('button')].filter(
    (button) => button.textContent === 'Undo' && button.closest('[hidden]') === null,
  );
  if (shown.length !== 1) throw new Error(`${shown.length} Undo buttons shown`);
  shown[0]!.click();
}

function clickStep(section: CalibrationSection, nth: number): void {
  section.element.querySelectorAll<HTMLButtonElement>('.box-step__header')[nth]!.click();
}

const layouts = ['cards', 'checklist', 'wizard'] as const;
const appearances = ['classic', 'modern'] as const;

describe('calibration section, pinned before the #416 split', () => {
  for (const layout of layouts) {
    for (const appearance of appearances) {
      it(`draws every phone step the same (${appearance} ${layout})`, () => {
        const host = makeHost(appearance, false);
        const section = createCalibrationSection(host.options, layout);
        const frames: string[] = [];
        const frame = (label: string) => frames.push(`# ${label}\n${describeDom(section.element)}`);
        frame('fresh');
        host.nextCapture = { warning: 'tilted', undo: () => {} };
        click(section, 'Calibrate now');
        frame('phone warning');
        clickUndo(section);
        frame('phone calibration undone');
        host.nextCapture = null;
        click(section, 'Calibrate now');
        frame('phone calibrated');
        host.nextVehicle = 'no sensor';
        click(section, layout === 'checklist' ? 'Zero now' : 'Zero now');
        frame('vehicle error');
        host.nextVehicle = { warning: 'not level', undo: () => {} };
        click(section, 'Zero now');
        frame('vehicle warning');
        host.nextVehicle = null;
        click(section, 'Zero now');
        frame('vehicle zeroed');
        if (layout !== 'wizard') {
          click(section, 'Check', 0);
          frame('phone checked');
          click(section, 'Check', 1);
          frame('vehicle checked');
        }
        if (layout === 'checklist') click(section, 'No flat surface? Flip the phone');
        click(section, 'Calibrate by flipping');
        frame('flip started');
        host.tilt = { rollDeg: -0.5, pitchDeg: -1.5 };
        click(section, 'Capture');
        frame('flip done');
        host.tilt = { rollDeg: 20, pitchDeg: 20 };
        click(section, 'Calibrate by flipping');
        host.tilt = { rollDeg: 20, pitchDeg: 20 };
        click(section, 'Capture');
        frame('flip disagrees');
        clickUndo(section);
        frame('flip undone');
        host.tilt = 'no reading';
        click(section, 'Calibrate by flipping');
        frame('flip no reading');
        if (layout === 'checklist') {
          clickStep(section, 1);
          frame('vehicle step opened');
          clickStep(section, 1);
          frame('vehicle step closed');
          clickStep(section, 0);
          frame('phone step opened');
          click(section, 'No flat surface? Flip the phone');
          frame('flip link closed');
        }
        if (layout !== 'wizard') {
          click(section, 'Clear calibration');
          frame('phone cleared');
          click(section, 'Forget the zero');
          frame('vehicle cleared');
        }
        section.refresh('outside error');
        frame('refreshed with an error');
        section.refresh();
        frame('refreshed');
        expect(frames.join('\n\n')).toMatchSnapshot();
      });

      it(`draws the active box's zero the same (${appearance} ${layout})`, async () => {
        const host = makeHost(appearance, true);
        host.phone = { rollDeg: 0.3, pitchDeg: 0.4 };
        const section = createCalibrationSection(host.options, layout);
        const frames: string[] = [];
        const frame = (label: string) => frames.push(`# ${label}\n${describeDom(section.element)}`);
        frame('phone active');
        host.phoneActive = false;
        host.box = { name: 'Xparkle', offset: null, capturedAt: null };
        section.refresh();
        frame('box active');
        host.nextBox = { warning: 'box tilted', undo: () => {} };
        click(section, 'Zero now', 0);
        frame('box warning');
        clickUndo(section);
        frame('box zero undone');
        host.nextBox = null;
        click(section, 'Zero now', 0);
        frame('box zeroed');
        let answer: (result: CaptureResult) => void = () => {};
        host.nextBox = new Promise((resolve) => (answer = resolve));
        click(section, 'Zero now', 0);
        frame('box working');
        section.refresh();
        frame('refreshed while working');
        answer('box said no');
        await Promise.resolve();
        await Promise.resolve();
        frame('box answered');
        host.phoneActive = true;
        host.box = null;
        section.refresh();
        frame('phone again');
        expect(frames.join('\n\n')).toMatchSnapshot();
      });
    }
  }

  it('splits into a sensor half and a vehicle half in every layout', () => {
    for (const layout of layouts) {
      for (const appearance of appearances) {
        const section = createCalibrationSection(makeHost(appearance, true).options, layout);
        expect(section.element.contains(section.sensorElement)).toBe(true);
        expect(section.element.contains(section.vehicleElement)).toBe(true);
        expect(section.sensorElement.contains(section.vehicleElement)).toBe(false);
      }
    }
  });
});
