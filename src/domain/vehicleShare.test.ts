import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings } from './settings';
import {
  applyVehicleGeometry,
  decodeVehicleGeometry,
  encodeVehicleGeometry,
  pickVehicleGeometry,
  type VehicleGeometry,
} from './vehicleShare';

const geometry: VehicleGeometry = {
  vehicleType: 'caravan',
  rearAxle: 'boggie',
  wheelbaseMm: 4200,
  trackWidthFrontMm: 1750,
  trackWidthRearMm: 1900,
  rampStepHeightsMm: [30, 60, 90],
  rampCount: 3,
  drainPosition: 'rearLeft',
};

describe('pickVehicleGeometry', () => {
  it('extracts exactly the vehicle-geometry fields, nothing else', () => {
    const settings: LevelSettings = { ...DEFAULT_SETTINGS, ...geometry };
    expect(pickVehicleGeometry(settings)).toEqual(geometry);
    expect(Object.keys(pickVehicleGeometry(settings)).sort()).toEqual(
      [
        'vehicleType',
        'rearAxle',
        'wheelbaseMm',
        'trackWidthFrontMm',
        'trackWidthRearMm',
        'rampStepHeightsMm',
        'rampCount',
        'drainPosition',
      ].sort(),
    );
  });
});

describe('applyVehicleGeometry', () => {
  it('overwrites only the geometry fields, leaving everything else untouched', () => {
    const recipient: LevelSettings = {
      ...DEFAULT_SETTINGS,
      // Recipient's own values that must never be touched by a received link.
      toleranceMm: 42,
      theme: 'dark',
      soundOnLevel: false,
      sensorSource: 'easylevel',
    };
    const result = applyVehicleGeometry(recipient, geometry);
    expect(pickVehicleGeometry(result)).toEqual(geometry);
    expect(result.toleranceMm).toBe(42);
    expect(result.theme).toBe('dark');
    expect(result.soundOnLevel).toBe(false);
    expect(result.sensorSource).toBe('easylevel');
  });
});

/** Same base64url shape `encodeVehicleGeometry` produces, built locally so
 * these tests can construct envelopes the real encoder never would
 * (wrong version, corrupt fields) without reaching into the module's
 * internals. */
function encodeEnvelope(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('encodeVehicleGeometry / decodeVehicleGeometry', () => {
  it('round-trips exactly', () => {
    const encoded = encodeVehicleGeometry(geometry);
    expect(decodeVehicleGeometry(encoded)).toEqual(geometry);
  });

  it('produces a URL-fragment-safe string (no +, /, or =)', () => {
    const encoded = encodeVehicleGeometry(geometry);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rejects garbage input', () => {
    expect(decodeVehicleGeometry('not valid base64url!!!')).toBeNull();
    expect(decodeVehicleGeometry('')).toBeNull();
  });

  it('rejects truncated input', () => {
    const encoded = encodeVehicleGeometry(geometry);
    expect(decodeVehicleGeometry(encoded.slice(0, encoded.length - 4))).toBeNull();
  });

  it('rejects valid base64 that is not the expected JSON envelope', () => {
    expect(decodeVehicleGeometry(encodeEnvelope('just a string'))).toBeNull();
  });

  it('rejects an unrecognized schema version', () => {
    expect(decodeVehicleGeometry(encodeEnvelope({ v: 99, g: geometry }))).toBeNull();
  });

  it('falls back to the app default for one corrupt field without rejecting the link', () => {
    const encoded = encodeEnvelope({ v: 1, g: { ...geometry, rampCount: 'not-a-number' } });
    const decoded = decodeVehicleGeometry(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.rampCount).toBe(DEFAULT_SETTINGS.rampCount);
    expect(decoded?.wheelbaseMm).toBe(geometry.wheelbaseMm);
  });

  it('rejects an unknown drain position and an out-of-range ramp count', () => {
    const encoded = encodeEnvelope({
      v: 1,
      g: { ...geometry, drainPosition: 'sideways', rampCount: 99 },
    });
    const decoded = decodeVehicleGeometry(encoded);
    expect(decoded?.drainPosition).toBe(DEFAULT_SETTINGS.drainPosition);
    expect(decoded?.rampCount).toBe(4); // clamped to MAX_RAMP_COUNT
  });
});
