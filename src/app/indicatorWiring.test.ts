// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { SensorSource } from '../domain/settings';
import type { Calibration } from '../domain/calibration';
import type { OrientationSensor, SensorState } from '../sensor/orientation';
import {
  createBoxPending,
  mountLamps,
  mountSensorStatus,
  mountTargetBadge,
  type LampDeps,
} from './indicatorWiring';

describe('createBoxPending', () => {
  it('starts from the stored value', () => {
    expect(createBoxPending({ load: () => true, save: () => {} }).isPending()).toBe(true);
    expect(createBoxPending({ load: () => false, save: () => {} }).isPending()).toBe(false);
  });

  it('stores only a real change', () => {
    const save = vi.fn();
    const pending = createBoxPending({ load: () => false, save });
    pending.settle(false);
    pending.settle(true);
    pending.settle(true);
    pending.settle(false);
    expect(save.mock.calls).toEqual([[true], [false]]);
    expect(pending.isPending()).toBe(false);
  });
});

const ZERO: Calibration = { rollDeg: 0, pitchDeg: 0 };

function lampSetup(overrides: Partial<LampDeps> = {}, pendingAtStart = false) {
  const slot = document.createElement('div');
  const save = vi.fn();
  const boxPending = createBoxPending({ load: () => pendingAtStart, save });
  const deps: LampDeps = {
    demo: false,
    activeSource: () => 'phone',
    boxPending,
    phoneCalibration: { bias: () => ZERO, vehicleZero: () => ZERO },
    activeInstallOffset: () => null,
    measurementsSaved: () => true,
    open: vi.fn(),
    ...overrides,
  };
  const lamps = mountLamps(slot, deps);
  const visible = () =>
    [...slot.querySelectorAll<HTMLElement>('.indicators__lamp')]
      .filter((el) => !el.hidden && el.classList.contains('is-visible'))
      .map((el) => el.textContent);
  return { slot, lamps, deps, save, boxPending, visible };
}

describe('mountLamps', () => {
  it('appends the lamps to the slot and draws them at once', () => {
    const { slot, visible } = lampSetup({
      phoneCalibration: { bias: () => null, vehicleZero: () => null },
    });
    expect(slot.querySelector('.indicators')).not.toBeNull();
    expect(visible()).toEqual(['⚠ Calibrate']);
  });

  it('redraws on refresh from the live state', () => {
    let bias: Calibration | null = null;
    const { lamps, visible } = lampSetup({
      phoneCalibration: { bias: () => bias, vehicleZero: () => ZERO },
    });
    bias = ZERO;
    lamps.refresh();
    expect(visible()).toEqual([]);
  });

  it('settles a pending box once a box is the source', () => {
    let source: SensorSource = 'phone';
    const { lamps, boxPending, save } = lampSetup({ activeSource: () => source }, true);
    lamps.refresh();
    expect(boxPending.isPending()).toBe(true);
    source = 'xparkle';
    lamps.refresh();
    expect(boxPending.isPending()).toBe(false);
    expect(save).toHaveBeenCalledWith(false);
  });

  it('hands a tapped lamp its section', () => {
    const open = vi.fn();
    const { slot } = lampSetup({ open, measurementsSaved: () => false });
    slot.querySelector<HTMLElement>('.indicators__lamp')!.click();
    expect(open).toHaveBeenCalledWith('vehicle');
  });
});

describe('mountTargetBadge', () => {
  it('shows the active target, hides Normal, and opens on tap', () => {
    const slot = document.createElement('div');
    let name: string | null = 'Ferry';
    const open = vi.fn();
    const badge = mountTargetBadge(slot, { activeName: () => name, open });
    const element = slot.querySelector<HTMLElement>('.target-badge')!;
    expect(element.hidden).toBe(false);
    expect(element.textContent).toContain('Ferry');
    name = null;
    badge.refresh();
    expect(element.hidden).toBe(true);
    element.click();
    expect(open).toHaveBeenCalledTimes(1);
  });
});

describe('mountSensorStatus', () => {
  it('draws the active source and state, and opens on tap', () => {
    const slot = document.createElement('div');
    let source: SensorSource = 'phone';
    const state: SensorState = 'granted';
    const sensor = {
      getSource: () => source,
      getState: () => state,
      getLastSampleAt: () => 0,
    } as OrientationSensor;
    const open = vi.fn();
    const status = mountSensorStatus(slot, {
      supported: true,
      showIosGuide: false,
      sensor: () => sensor,
      open,
      now: () => 0,
    });
    const element = slot.firstElementChild as HTMLElement;
    expect(element).not.toBeNull();
    const before = element.outerHTML;
    source = 'xparkle';
    status.refresh();
    expect(element.outerHTML).not.toBe(before);
    element.click();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('shows the warning look while the active box is stale, and recovers (#401)', () => {
    const slot = document.createElement('div');
    let lastSampleAt = 0;
    let nowMs = 0;
    const sensor = {
      getSource: () => 'xparkle',
      getState: () => 'granted',
      getLastSampleAt: () => lastSampleAt,
    } as OrientationSensor;
    const status = mountSensorStatus(slot, {
      supported: true,
      showIosGuide: false,
      sensor: () => sensor,
      open: vi.fn(),
      now: () => nowMs,
    });
    const element = slot.firstElementChild as HTMLElement;
    expect(element.classList.contains('sensor-status--connected')).toBe(true);
    nowMs = 60_000;
    status.refresh();
    expect(element.classList.contains('sensor-status--disconnected')).toBe(true);
    lastSampleAt = 60_000;
    status.refresh();
    expect(element.classList.contains('sensor-status--connected')).toBe(true);
  });
});
