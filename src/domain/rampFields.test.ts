/**
 * Regression pins for #731: stored settings and a shared vehicle link read
 * the kloss fields by the same rules. Written against `main` before the two
 * parsers were merged, and kept unchanged after.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, MAX_RAMP_COUNT, type LevelSettings } from './settings';
import { parseSettings } from './settingsParsing';
import { decodeVehicleGeometry } from './vehicleShare';

type RampFields = Pick<
  LevelSettings,
  'rampStepHeightsMm' | 'rampStepless' | 'rampCount' | 'drainPosition'
>;

function rampFieldsOf(value: RampFields): RampFields {
  const { rampStepHeightsMm, rampStepless, rampCount, drainPosition } = value;
  return { rampStepHeightsMm, rampStepless, rampCount, drainPosition };
}

function fromLink(raw: Record<string, unknown>): RampFields {
  const json = JSON.stringify({ v: 1, g: raw });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const text = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const decoded = decodeVehicleGeometry(text);
  if (!decoded) throw new Error('link rejected');
  return rampFieldsOf(decoded);
}

const defaults = rampFieldsOf(DEFAULT_SETTINGS);

/** Raw values that both parsers must read the same way. */
const SHARED_CASES: [string, Record<string, unknown>, RampFields][] = [
  [
    'valid staircase',
    { rampStepHeightsMm: [90, 30, 60, 30], rampCount: 3, drainPosition: 'rearLeft' },
    {
      rampStepHeightsMm: [30, 60, 90],
      rampStepless: false,
      rampCount: 3,
      drainPosition: 'rearLeft',
    },
  ],
  ['missing everything', {}, defaults],
  ['rampCount 0', { rampCount: 0 }, defaults],
  ['rampCount negative', { rampCount: -2 }, defaults],
  ['rampCount as text', { rampCount: '3' }, defaults],
  ['rampCount null (non-finite after JSON)', { rampCount: null }, defaults],
  ['rampCount rounded', { rampCount: 2.5 }, { ...defaults, rampCount: 3 }],
  ['rampCount 1', { rampCount: 1 }, { ...defaults, rampCount: 1 }],
  ['rampCount above max', { rampCount: 99 }, { ...defaults, rampCount: MAX_RAMP_COUNT }],
  ['unknown drain position', { drainPosition: 'sideways' }, defaults],
  ['drain position not a string', { drainPosition: 7 }, defaults],
  ['valid drain position', { drainPosition: 'rear' }, { ...defaults, drainPosition: 'rear' }],
  [
    'stepless keeps only its maximum',
    { rampStepless: true, rampStepHeightsMm: [60, 110] },
    { ...defaults, rampStepless: true, rampStepHeightsMm: [110] },
  ],
  [
    'stepless with no usable heights keeps the default maximum',
    { rampStepless: true, rampStepHeightsMm: ['x'] },
    {
      ...defaults,
      rampStepless: true,
      rampStepHeightsMm: [Math.max(...DEFAULT_SETTINGS.rampStepHeightsMm)],
    },
  ],
  ['stepless not strictly true', { rampStepless: 'yes' }, defaults],
  ['heights out of range dropped', { rampStepHeightsMm: [0, -5, 1e9] }, defaults],
];

describe('kloss fields from stored settings and a shared link (#731)', () => {
  it.each(SHARED_CASES)('%s: both read the same', (_name, raw, expected) => {
    expect(rampFieldsOf(parseSettings(raw))).toEqual(expected);
    expect(fromLink(raw)).toEqual(expected);
  });

  it('reads non-finite counts in stored settings as the default', () => {
    for (const rampCount of [NaN, Infinity, -Infinity]) {
      expect(parseSettings({ rampCount }).rampCount).toBe(DEFAULT_SETTINGS.rampCount);
    }
  });

  it('migrates legacy cm heights in stored settings, but not in a link', () => {
    const legacy = { blockHeightsCm: [2, 4, 6] };
    expect(parseSettings(legacy).rampStepHeightsMm).toEqual([20, 40, 60]);
    expect(fromLink(legacy).rampStepHeightsMm).toEqual(DEFAULT_SETTINGS.rampStepHeightsMm);
    const single = { blockHeightCm: 5, rampStepless: true };
    expect(rampFieldsOf(parseSettings(single))).toEqual({
      ...defaults,
      rampStepless: true,
      rampStepHeightsMm: [50],
    });
    expect(fromLink(single).rampStepHeightsMm).toEqual([
      Math.max(...DEFAULT_SETTINGS.rampStepHeightsMm),
    ]);
  });
});
