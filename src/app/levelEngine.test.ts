// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { WHEEL_IDS, type GravityVector, type WheelId } from '../domain/leveling';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import { formatLength } from '../domain/lengths';
import type { DisplayResult, DisplayWheel } from '../domain/stability';
import { t } from '../ui/i18n';
import {
  createLevelEngine,
  hitchStatusText,
  motorhomeStatusText,
  type EngineOutput,
} from './levelEngine';

const FLAT: GravityVector = { x: 0, y: 0, z: 9.81 };
const deg = (d: number) => (d * Math.PI) / 180;
/** Rolled 2° and pitched 1°: clearly off level for any vehicle. */
const TILTED: GravityVector = { x: 9.81 * Math.tan(deg(2)), y: 9.81 * Math.tan(deg(1)), z: 9.81 };

function result(
  wheels: Partial<Record<WheelId, Partial<DisplayWheel>>>,
  extra: Partial<DisplayResult> = {},
): DisplayResult {
  const all = Object.fromEntries(
    WHEEL_IDS.map((id) => [id, { displayMm: 0, stepMm: 0, severity: 'none', ...wheels[id] }]),
  ) as Record<WheelId, DisplayWheel>;
  return { rollDeg: 0, pitchDeg: 0, isLevel: false, wheels: all, maxDeficitMm: 0, ...extra };
}

const settings: LevelSettings = { ...DEFAULT_SETTINGS, toleranceMm: 20, displayUnit: 'mm' };

describe('motorhomeStatusText', () => {
  it('says nothing when level: the wheel cards already show it', () => {
    expect(motorhomeStatusText(result({}, { isLevel: true }), settings)).toBe('');
  });

  it('says how little is left within ten past the tolerance', () => {
    const text = motorhomeStatusText(result({ frontLeft: { displayMm: 27 } }), settings);
    expect(text).toBe(t('status.almost', { left: formatLength(7, 'mm') }));
  });

  it('says at least 1 mm is left, never 0', () => {
    const text = motorhomeStatusText(result({ frontLeft: { displayMm: 15 } }), settings);
    expect(text).toBe(t('status.almost', { left: formatLength(1, 'mm') }));
  });

  it('says nothing when some wheel has a step to drive up', () => {
    const wheels = { rearLeft: { displayMm: 80, stepMm: 44, severity: 'small' as const } };
    expect(motorhomeStatusText(result(wheels), settings)).toBe('');
  });

  it('says the ramps nearly reach when no step serves and the deficit is close', () => {
    const wheels = { rearLeft: { displayMm: 80, stepMm: 0, severity: 'unserved' as const } };
    expect(motorhomeStatusText(result(wheels, { maxDeficitMm: 40 }), settings)).toBe(
      t('status.cantLevel.close'),
    );
  });

  it('says to move the vehicle when no step serves and the deficit is far', () => {
    const wheels = { rearLeft: { displayMm: 80, stepMm: 44, severity: 'none' as const } };
    expect(motorhomeStatusText(result(wheels, { maxDeficitMm: 41 }), settings)).toBe(
      t('status.cantLevel.far'),
    );
  });
});

function engineFor(overrides: Partial<LevelSettings>, hitching = () => false) {
  const current: LevelSettings = { ...DEFAULT_SETTINGS, ...overrides };
  const statuses: [string, boolean][] = [];
  const tilts: { rollDeg: number; pitchDeg: number }[] = [];
  const output: EngineOutput = {
    showStatus: (text, isLevel) => void statuses.push([text, isLevel]),
    showTilt: (tilt) => void tilts.push(tilt),
  };
  const engine = createLevelEngine(
    () => current,
    () => null,
    output,
    hitching,
  );
  return { engine, statuses, tilts };
}

describe('createLevelEngine', () => {
  it('draws the motorhome diagram for a motorhome', () => {
    const { engine } = engineFor({ vehicleType: 'motorhome' });
    expect(engine.element.querySelector('svg')?.getAttribute('aria-label')).toContain('motorhome');
  });

  it('draws the caravan diagram for a caravan', () => {
    const { engine } = engineFor({ vehicleType: 'caravan' });
    expect(engine.element.querySelector('svg')?.getAttribute('aria-label')).toContain('caravan');
  });

  it.each(['motorhome', 'caravan'] as const)('reports a flat %s as level', (vehicleType) => {
    const { engine, statuses, tilts } = engineFor({ vehicleType });
    expect(engine.tick(FLAT, 0)).toEqual({
      isLevel: true,
      maxCorrectionMm: 0,
      spoken: { isLevel: true, parts: [] },
    });
    expect(statuses).toEqual([['', true]]);
    expect(tilts).toHaveLength(1);
  });

  it.each(['motorhome', 'caravan'] as const)(
    'reports the largest correction for a tilted %s',
    (vehicleType) => {
      const { engine, statuses, tilts } = engineFor({ vehicleType });
      const tick = engine.tick(TILTED, 0);
      expect(tick.isLevel).toBe(false);
      expect(tick.maxCorrectionMm).toBeGreaterThan(20);
      expect(statuses[0]?.[1]).toBe(false);
      expect(tilts[0]?.rollDeg).toBeCloseTo(2, 0);
    },
  );

  it.each(['motorhome', 'caravan'] as const)(
    'names no step on a stepless wedge, on the cards or aloud, for a %s (#600)',
    (vehicleType) => {
      const { engine } = engineFor({ vehicleType, rampStepHeightsMm: [150], rampStepless: true });
      const { spoken } = engine.tick(TILTED, 0);
      const wheels = spoken.parts.filter((part) => part.kind === 'wheel');
      expect(wheels.length).toBeGreaterThan(0);
      expect(wheels.every((part) => part.step === null)).toBe(true);
      expect(engine.element.textContent).toContain(t('diagram.driveUp'));
      expect(engine.element.textContent).not.toContain(t('diagram.step', { n: 1 }));
    },
  );

  it('keeps the caravan status row empty: the drawing says it all', () => {
    const { engine, statuses } = engineFor({ vehicleType: 'caravan' });
    engine.tick(TILTED, 0);
    expect(statuses[0]?.[0]).toBe('');
  });

  it('reads the settings when it ticks, not when it was built', () => {
    const current: LevelSettings = { ...DEFAULT_SETTINGS, toleranceMm: 20 };
    const engine = createLevelEngine(
      () => current,
      () => null,
      { showStatus: () => {}, showTilt: () => {} },
    );
    current.toleranceMm = 1000;
    expect(engine.tick(TILTED, 0).isLevel).toBe(true);
  });

  it('subtracts the calibration it reads on each tick', () => {
    const tilt = { rollDeg: 2, pitchDeg: 1 };
    const engine = createLevelEngine(
      () => DEFAULT_SETTINGS,
      () => tilt,
      { showStatus: () => {}, showTilt: () => {} },
    );
    expect(engine.tick(TILTED, 0).isLevel).toBe(true);
  });
});

describe('hitchStatusText', () => {
  it('says which way to crank and how far, to the hitch height', () => {
    expect(hitchStatusText({ direction: 'up', displayMm: 34 }, 'mm')).toBe(
      t('hitch.crank.up', { amount: formatLength(34, 'mm') }),
    );
    expect(hitchStatusText({ direction: 'down', displayMm: 12 }, 'cm')).toBe(
      t('hitch.crank.down', { amount: formatLength(12, 'cm') }),
    );
  });

  it('says the hitch height is reached', () => {
    expect(hitchStatusText({ direction: 'ok', displayMm: 3 }, 'mm')).toBe(t('hitch.reached'));
  });
});

describe('createLevelEngine going back to the hitch height (#598)', () => {
  const ROLLED_ONLY: GravityVector = { x: 9.81 * Math.tan(deg(2)), y: 0, z: 9.81 };

  it('ignores the side tilt: only the jockey wheel guides', () => {
    const { engine, statuses } = engineFor({ vehicleType: 'caravan' }, () => true);
    const tick = engine.tick(ROLLED_ONLY, 0);
    expect(tick.isLevel).toBe(true);
    expect(tick.spoken.parts).toEqual([]);
    expect(statuses[0]).toEqual([t('hitch.reached'), true]);
  });

  it('says the crank in the status row while the jockey is off', () => {
    const { engine, statuses } = engineFor(
      { vehicleType: 'caravan', displayUnit: 'mm' },
      () => true,
    );
    const tick = engine.tick(TILTED, 0);
    expect(tick.isLevel).toBe(false);
    expect(tick.spoken.parts).toEqual([
      expect.objectContaining({ kind: 'crank', direction: 'down' }),
    ]);
    // Nose 1° high: crank the coupling down by axle-to-jockey × tan 1°.
    const mm = Math.round(DEFAULT_SETTINGS.wheelbaseMm * Math.tan(deg(1)));
    expect(statuses[0]?.[0]).toBe(t('hitch.crank.down', { amount: formatLength(mm, 'mm') }));
  });

  it('levels as usual again when the mode ends', () => {
    let hitching = true;
    const { engine } = engineFor({ vehicleType: 'caravan' }, () => hitching);
    expect(engine.tick(ROLLED_ONLY, 0).isLevel).toBe(true);
    hitching = false;
    expect(engine.tick(ROLLED_ONLY, 1).isLevel).toBe(false);
  });

  it('never applies to a motorhome', () => {
    const { engine, statuses } = engineFor({ vehicleType: 'motorhome' }, () => true);
    expect(engine.tick(ROLLED_ONLY, 0).isLevel).toBe(false);
    expect(statuses[0]?.[0]).not.toBe(t('hitch.reached'));
  });
});
