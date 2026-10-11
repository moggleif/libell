import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import { encodeVehicleGeometry, pickVehicleGeometry } from '../domain/vehicleShare';
import { t } from '../ui/i18n';
import type { IncomingVehicleSetupOptions } from '../ui/incomingVehicleSetup';
import { offerIncomingSetup, type IncomingSetupDeps } from './incomingSetup';

function setup() {
  let settings: LevelSettings = { ...DEFAULT_SETTINGS, displayUnit: 'cm' };
  let shown: IncomingVehicleSetupOptions | null = null;
  const calls: string[] = [];
  const deps: IncomingSetupDeps = {
    settings: {
      get: () => settings,
      set: (next) => {
        settings = next;
        calls.push('saved');
      },
    },
    markMeasurementsSaved: () => void calls.push('marked'),
    onApplied: () => void calls.push('applied'),
    show: (options) => void (shown = options),
    toast: vi.fn(),
  };
  return { deps, shown: () => shown, calls, settings: () => settings };
}

const shared = encodeVehicleGeometry(
  pickVehicleGeometry({ ...DEFAULT_SETTINGS, wheelbaseMm: 4321 }),
);

describe('offerIncomingSetup', () => {
  it('does nothing without a link', () => {
    const { deps, shown } = setup();
    expect(offerIncomingSetup(null, deps)).toBe(false);
    expect(shown()).toBeNull();
    expect(deps.toast).not.toHaveBeenCalled();
  });

  it('says so, and offers nothing, for a broken link', () => {
    const { deps, shown } = setup();
    expect(offerIncomingSetup('not-a-setup', deps)).toBe(false);
    expect(deps.toast).toHaveBeenCalledWith(t('setup.incoming.invalid'));
    expect(shown()).toBeNull();
  });

  it('shows the shared setup in the current unit', () => {
    const { deps, shown } = setup();
    expect(offerIncomingSetup(shared, deps)).toBe(true);
    expect(shown()?.geometry.wheelbaseMm).toBe(4321);
    expect(shown()?.displayUnit).toBe('cm');
  });

  it('applies, stores and marks the measurements, then redraws', () => {
    const { deps, shown, calls, settings } = setup();
    offerIncomingSetup(shared, deps);
    shown()!.onApply();
    expect(settings().wheelbaseMm).toBe(4321);
    expect(settings().displayUnit).toBe('cm');
    expect(calls).toEqual(['saved', 'marked', 'applied']);
  });

  it('changes nothing when dismissed', () => {
    const { deps, shown, calls } = setup();
    offerIncomingSetup(shared, deps);
    shown()!.onDismiss();
    expect(calls).toEqual([]);
  });
});
