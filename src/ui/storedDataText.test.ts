// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { StoredEntry } from '../data/storedData';
import type { StoredKind } from '../data/storedKeys';
import type { SensorSource } from '../domain/settings';
import { setLanguage, t } from './i18n';
import { storedRows } from './storedDataText';

setLanguage('en');

function entry(key: string, kind: StoredKind, value: unknown, source?: SensorSource): StoredEntry {
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  return { key, kind, value: raw, session: false, ...(source ? { source } : {}) };
}

const settings = entry('libell.settings', 'settings', {
  wheelbaseMm: 3800,
  sensorDevices: { xparkle: { axisMapping: null, password: '1234' } },
});

describe('storedRows (#678)', () => {
  it('shows nothing when nothing is stored', () => {
    expect(storedRows([])).toEqual([]);
  });

  it('names each vehicle with its wheelbase, the active one from the settings', () => {
    const vehicles = entry('libell.vehicles', 'vehicles', {
      activeId: 'a',
      vehicles: [
        { id: 'a', name: 'Hymer', fields: { wheelbaseMm: 1000 }, stored: {} },
        { id: 'b', name: '', fields: { wheelbaseMm: 3450 }, stored: {} },
      ],
    });
    const rows = storedRows([settings, vehicles]).filter((r) => r.label === t('stored.vehicle'));
    expect(rows.map((r) => r.detail)).toEqual([
      t('stored.vehicle.detail', { name: 'Hymer', wheelbase: '3800 mm' }),
      t('stored.vehicle.detail', { name: t('vehicles.defaultName'), wheelbase: '3450 mm' }),
    ]);
  });

  it('shows the one vehicle in the settings when no list is stored', () => {
    const rows = storedRows([settings]);
    expect(rows[0]).toEqual({
      label: t('stored.vehicle'),
      detail: t('stored.vehicle.detail', { name: t('vehicles.defaultName'), wheelbase: '3800 mm' }),
    });
  });

  it('says the box password is stored but never shows it', () => {
    const rows = storedRows([settings]);
    expect(rows).toContainEqual({ label: t('stored.password'), detail: 'Xparkle RVS01: ••••' });
    expect(JSON.stringify(rows)).not.toContain('1234');
  });

  it('says when each calibration layer was saved, and whose it is', () => {
    const at = Date.UTC(2026, 9, 12, 12);
    const date = new Date(at).toLocaleDateString('en', { dateStyle: 'medium' });
    const rows = storedRows([
      entry(
        'libell.installCalibration.xparkle',
        'boxZero',
        { rollDeg: 1, pitchDeg: 0, capturedAt: at },
        'xparkle',
      ),
      entry('libell.calibration', 'phoneCalibration', { rollDeg: 0, pitchDeg: 0 }),
      entry('libell.vehicleCalibration', 'vehicleZero', {
        rollDeg: 0,
        pitchDeg: 0,
        capturedAt: at,
      }),
    ]);
    expect(rows).toEqual([
      { label: t('stored.phoneCalibration'), detail: t('stored.saved') },
      { label: t('stored.zero'), detail: `${t('stored.phone')}, ${t('stored.savedOn', { date })}` },
      { label: t('stored.zero'), detail: `Xparkle RVS01, ${t('stored.savedOn', { date })}` },
    ]);
  });

  it('lists the targets with the selected one marked, and the language by its name', () => {
    const rows = storedRows([
      entry('libell.targetPresets', 'targets', [
        { id: 'a', name: 'Bed', offset: { rollDeg: 0, pitchDeg: 1 } },
        { id: 'b', name: 'Ferry', offset: { rollDeg: 0, pitchDeg: 0 } },
      ]),
      entry('libell.activeTarget', 'activeTarget', '"b"'),
      entry('libell.language', 'language', 'sv'),
    ]);
    expect(rows).toEqual([
      { label: t('stored.language'), detail: 'Svenska' },
      {
        label: t('stored.targets'),
        detail: `Bed, ${t('stored.targets.active', { name: 'Ferry' })}`,
      },
    ]);
  });

  it('names the box behind a remembered device, a fine adjustment and the hitch height', () => {
    const rows = storedRows([
      entry('libell.sensorDevice.easylevel', 'rememberedBox', 'opaque-id', 'easylevel'),
      entry('libell.zeroTrim.phone', 'zeroTrim', { rollDeg: 0, pitchDeg: 0 }, 'phone'),
      entry('libell.hitchPitch', 'hitch', 1.5),
    ]);
    expect(rows).toEqual([
      { label: t('stored.zeroTrim'), detail: t('stored.phone') },
      { label: t('stored.hitch'), detail: t('stored.saved') },
      { label: t('stored.rememberedBox'), detail: 'EasyLevel' },
    ]);
    expect(JSON.stringify(rows)).not.toContain('opaque-id');
  });

  it('counts marks, rollback copies and unknown keys in one row, so nothing is hidden', () => {
    const rows = storedRows([
      entry('libell.onboarded', 'note', '1'),
      entry('libell.easyLevelDeviceId', 'legacy', 'x', 'easylevel'),
      entry('libell.fromAnOldVersion', 'other', 'x'),
    ]);
    expect(rows).toEqual([
      { label: t('stored.notes'), detail: t('stored.notes.detail', { n: 3 }) },
    ]);
  });
});
