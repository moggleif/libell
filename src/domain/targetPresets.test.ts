import { describe, expect, it } from 'vitest';
import { combineCalibrations } from './calibration';
import {
  MAX_PRESET_COUNT,
  offsetTooSteep,
  parseActiveTargetId,
  parseTargetPreset,
  parseTargetPresets,
  presetOffsetFromReading,
  targetOffsetFor,
  type TargetPreset,
} from './targetPresets';

describe('parseTargetPreset (#122)', () => {
  it('accepts a valid preset and trims/caps its name', () => {
    const result = parseTargetPreset({
      id: 'abc',
      name: '  Shower drain  ',
      offset: { rollDeg: 1.2, pitchDeg: -0.4 },
    });
    expect(result).toEqual({
      id: 'abc',
      name: 'Shower drain',
      offset: { rollDeg: 1.2, pitchDeg: -0.4 },
    });
  });

  it('rejects missing/invalid fields', () => {
    expect(parseTargetPreset(null)).toBeNull();
    expect(parseTargetPreset({})).toBeNull();
    expect(
      parseTargetPreset({ id: '', name: 'x', offset: { rollDeg: 0, pitchDeg: 0 } }),
    ).toBeNull();
    expect(
      parseTargetPreset({ id: 'a', name: '   ', offset: { rollDeg: 0, pitchDeg: 0 } }),
    ).toBeNull();
    expect(
      parseTargetPreset({ id: 'a', name: 'x', offset: { rollDeg: 99, pitchDeg: 0 } }),
    ).toBeNull();
    expect(parseTargetPreset({ id: 'a', name: 'x', offset: null })).toBeNull();
  });

  it('caps an overlong name', () => {
    const longName = 'x'.repeat(100);
    const result = parseTargetPreset({
      id: 'a',
      name: longName,
      offset: { rollDeg: 0, pitchDeg: 0 },
    });
    expect(result!.name.length).toBeLessThanOrEqual(40);
  });
});

describe('parseTargetPresets (#122)', () => {
  it('keeps only the valid entries, dropping a corrupt one without losing the rest', () => {
    const result = parseTargetPresets([
      { id: 'a', name: 'Shower drain', offset: { rollDeg: 1, pitchDeg: 0 } },
      { id: 'b', name: 'bad', offset: { rollDeg: 99, pitchDeg: 0 } },
      { id: 'c', name: 'Grey-water drainage', offset: { rollDeg: -0.5, pitchDeg: 0.3 } },
    ]);
    expect(result.map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('deduplicates by id, keeping the first', () => {
    const result = parseTargetPresets([
      { id: 'a', name: 'First', offset: { rollDeg: 1, pitchDeg: 0 } },
      { id: 'a', name: 'Second', offset: { rollDeg: 2, pitchDeg: 0 } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('First');
  });

  it('caps the list at MAX_PRESET_COUNT', () => {
    const many = Array.from({ length: MAX_PRESET_COUNT + 10 }, (_, i) => ({
      id: `p${i}`,
      name: `Preset ${i}`,
      offset: { rollDeg: 0, pitchDeg: 0 },
    }));
    expect(parseTargetPresets(many)).toHaveLength(MAX_PRESET_COUNT);
  });

  it('returns an empty list for non-array input', () => {
    expect(parseTargetPresets(undefined)).toEqual([]);
    expect(parseTargetPresets('garbage')).toEqual([]);
    expect(parseTargetPresets(null)).toEqual([]);
  });
});

describe('parseActiveTargetId (#122)', () => {
  const presets: TargetPreset[] = [
    { id: 'a', name: 'Shower drain', offset: { rollDeg: 1, pitchDeg: 0 } },
  ];

  it('accepts an id present in the preset list', () => {
    expect(parseActiveTargetId('a', presets)).toBe('a');
  });

  it('resolves a dangling id (deleted elsewhere) to Normal, never a crash', () => {
    expect(parseActiveTargetId('deleted', presets)).toBeNull();
  });

  it('resolves corrupt/missing values to Normal', () => {
    expect(parseActiveTargetId(undefined, presets)).toBeNull();
    expect(parseActiveTargetId(42, presets)).toBeNull();
    expect(parseActiveTargetId(null, presets)).toBeNull();
  });
});

describe('targetOffsetFor (#122)', () => {
  const presets: TargetPreset[] = [
    { id: 'a', name: 'Shower drain', offset: { rollDeg: 1.5, pitchDeg: -0.5 } },
  ];

  it('returns null for Normal (no active id)', () => {
    expect(targetOffsetFor(presets, null)).toBeNull();
  });

  it("returns the active preset's offset", () => {
    expect(targetOffsetFor(presets, 'a')).toEqual({ rollDeg: 1.5, pitchDeg: -0.5 });
  });

  it('returns null for a dangling id rather than throwing', () => {
    expect(targetOffsetFor(presets, 'missing')).toBeNull();
  });
});

describe('preset offset combines with the existing calibration sum (#122, ADR 0013)', () => {
  it('leaves the effective calibration unchanged when Normal is active (regression guard)', () => {
    const sensor = { rollDeg: 1.0, pitchDeg: -0.5 };
    const vehicle = { rollDeg: 0.4, pitchDeg: 0.2 };
    const withoutTarget = combineCalibrations(sensor, vehicle);
    const withNormalActive = combineCalibrations(
      combineCalibrations(sensor, vehicle),
      targetOffsetFor([], null),
    );
    expect(withNormalActive).toEqual(withoutTarget);
  });

  it('adds the preset offset on top of the two-layer sum when a target is active', () => {
    const sensor = { rollDeg: 1.0, pitchDeg: -0.5 };
    const vehicle = { rollDeg: 0.4, pitchDeg: 0.2 };
    const presets: TargetPreset[] = [
      { id: 'shower', name: 'Shower drain', offset: { rollDeg: 2.0, pitchDeg: 0 } },
    ];
    const effective = combineCalibrations(
      combineCalibrations(sensor, vehicle),
      targetOffsetFor(presets, 'shower'),
    )!;
    expect(effective.rollDeg).toBeCloseTo(3.4);
    expect(effective.pitchDeg).toBeCloseTo(-0.3);
  });

  it('works with no sensor/vehicle calibration at all, target only', () => {
    const presets: TargetPreset[] = [{ id: 'a', name: 'A', offset: { rollDeg: 1, pitchDeg: 1 } }];
    const effective = combineCalibrations(
      combineCalibrations(null, null),
      targetOffsetFor(presets, 'a'),
    );
    expect(effective).toEqual({ rollDeg: 1, pitchDeg: 1 });
  });
});

describe('presetOffsetFromReading (#122)', () => {
  it('captures the reading purely relative to the current zero point', () => {
    const raw = { rollDeg: 3.4, pitchDeg: -0.3 };
    const zero = { rollDeg: 1.4, pitchDeg: -0.5 };
    const offset = presetOffsetFromReading(raw, zero);
    expect(offset.rollDeg).toBeCloseTo(2.0);
    expect(offset.pitchDeg).toBeCloseTo(0.2);
  });

  it('with no zero calibration, the offset is the raw reading itself', () => {
    const raw = { rollDeg: 2.1, pitchDeg: -1.1 };
    expect(presetOffsetFromReading(raw, null)).toEqual(raw);
  });
});

describe('offsetTooSteep (#122)', () => {
  it('rejects a mis-capture beyond the intentional-target cap', () => {
    expect(offsetTooSteep({ rollDeg: 20, pitchDeg: 0 })).toBe(true);
    expect(offsetTooSteep({ rollDeg: 0, pitchDeg: -16 })).toBe(true);
  });

  it('accepts a plausible intentional target', () => {
    expect(offsetTooSteep({ rollDeg: 3, pitchDeg: -2 })).toBe(false);
  });
});
