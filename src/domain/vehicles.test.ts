import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';
import {
  defaultVehicleList,
  parseVehicleList,
  vehicleFieldsOf,
  withVehicleFields,
  type VehicleList,
} from './vehicles';

const TWO: VehicleList = {
  activeId: 'b',
  vehicles: [
    { id: 'a', name: '', fields: {}, stored: {} },
    { id: 'b', name: 'Caravan', fields: { vehicleType: 'caravan' }, stored: { k: '1' } },
  ],
};

describe('vehicleFieldsOf', () => {
  it('takes the shared geometry and the box, not the app-wide preferences', () => {
    const fields = vehicleFieldsOf({ ...DEFAULT_SETTINGS, wheelbaseMm: 3000, theme: 'dark' });
    expect(fields.wheelbaseMm).toBe(3000);
    expect(fields.sensorSource).toBe('phone');
    expect(Object.keys(fields)).toEqual([
      'vehicleType',
      'rearAxle',
      'wheelbaseMm',
      'trackWidthFrontMm',
      'trackWidthRearMm',
      'rampStepHeightsMm',
      'rampStepless',
      'rampCount',
      'drainPosition',
      'sensorSource',
      'sensorDevices',
    ]);
    expect('theme' in fields).toBe(false);
  });
});

describe('withVehicleFields', () => {
  it('replaces only the vehicle fields', () => {
    const merged = withVehicleFields({ ...DEFAULT_SETTINGS, theme: 'dark' }, {
      vehicleType: 'caravan',
      theme: 'light',
    } as never);
    expect(merged.vehicleType).toBe('caravan');
    expect(merged.theme).toBe('dark');
  });

  it('keeps a field the snapshot lacks', () => {
    const merged = withVehicleFields({ ...DEFAULT_SETTINGS, rampCount: 4 }, {});
    expect(merged.rampCount).toBe(4);
  });
});

describe('parseVehicleList', () => {
  it('reads back a stored list', () => {
    expect(parseVehicleList(JSON.parse(JSON.stringify(TWO)))).toEqual(TWO);
  });

  it('rejects a list whose active id names no vehicle', () => {
    expect(parseVehicleList({ ...TWO, activeId: 'c' })).toBeNull();
  });

  it('rejects an empty list, duplicate ids and malformed vehicles', () => {
    expect(parseVehicleList({ activeId: 'a', vehicles: [] })).toBeNull();
    expect(
      parseVehicleList({ activeId: 'a', vehicles: [TWO.vehicles[0], TWO.vehicles[0]] }),
    ).toBeNull();
    expect(
      parseVehicleList({ activeId: 'a', vehicles: [{ id: 'a', name: 1, fields: {}, stored: {} }] }),
    ).toBeNull();
    expect(
      parseVehicleList({
        activeId: 'a',
        vehicles: [{ id: 'a', name: '', fields: {}, stored: { k: 1 } }],
      }),
    ).toBeNull();
    expect(parseVehicleList('nope')).toBeNull();
  });
});

describe('defaultVehicleList', () => {
  it('is one unnamed vehicle, active', () => {
    const list = defaultVehicleList();
    expect(list.vehicles).toHaveLength(1);
    expect(list.activeId).toBe(list.vehicles[0]!.id);
    expect(list.vehicles[0]!.name).toBe('');
  });
});
