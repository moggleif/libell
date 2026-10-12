// @vitest-environment happy-dom
//
// Pins the Vehicle tab on its own (#417): its fields per vehicle type and
// axle, the captions and hint that follow them, what reaches the stored
// settings, and the share link.
import { describe, expect, it, vi } from 'vitest';
import { createVehicleTab, type VehicleTab } from './settingsVehicleTab';
import type { RawSettings, SettingsFormContext, SettingsFormState } from './settingsFields';
import { setLanguage, t } from './i18n';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';

setLanguage('en');

interface Built {
  tab: VehicleTab;
  state: SettingsFormState;
  changed: ReturnType<typeof vi.fn>;
  relabelAll: ReturnType<typeof vi.fn>;
  onShare: ReturnType<typeof vi.fn>;
  initial: LevelSettings;
}

function build(overrides: Partial<LevelSettings> = {}): Built {
  const initial: LevelSettings = { ...DEFAULT_SETTINGS, ...overrides };
  const state: SettingsFormState = {
    unit: initial.displayUnit,
    vehicle: initial.vehicleType,
    axle: initial.rearAxle,
  };
  const changed = vi.fn();
  const onShare = vi.fn();
  let tab: VehicleTab | undefined;
  // The form relabels every tab; this one is the only tab here.
  const relabelAll = vi.fn(() => {
    tab?.relabel();
    tab?.measurements.forEach((m) => m.relabel());
  });
  const context: SettingsFormContext = {
    state,
    compact: false,
    changed,
    relabelAll,
    currentSettings: () => initial,
  };
  tab = createVehicleTab(initial, context, onShare);
  relabelAll();
  relabelAll.mockClear();
  return { tab, state, changed, relabelAll, onShare, initial };
}

function read(tab: VehicleTab): RawSettings {
  const raw: RawSettings = {};
  tab.read(raw);
  return raw;
}

function shown(tab: VehicleTab): string[] {
  return tab
    .elements()
    .filter((e) => !e.hidden)
    .map((e) =>
      e.classList.contains('settings__field')
        ? (e.firstElementChild?.textContent ?? '')
        : e.className,
    );
}

function select(tab: VehicleTab, index: 0 | 1): HTMLSelectElement {
  return tab.elements()[index]!.querySelector('select')!;
}

function choose(element: HTMLSelectElement, value: string): void {
  element.value = value;
  element.dispatchEvent(new Event('change'));
}

describe('a motorhome', () => {
  it('shows vehicle, rear axle, the three measurements, the hint and the share link', () => {
    const { tab } = build();
    expect(shown(tab)).toEqual([
      t('settings.vehicle'),
      t('settings.rearAxle'),
      `${t('settings.wheelbase')} (mm)`,
      `${t('settings.trackFront')} (mm)`,
      `${t('settings.trackRear')} (mm)`,
      'settings__hint',
      'link-button settings__share-vehicle',
    ]);
    expect(tab.measureHint.textContent).toBe(t('settings.measureHint'));
  });

  it('names the measurements by the keys they store', () => {
    const { tab } = build();
    expect(tab.measurements.map((m) => m.key)).toEqual([
      'wheelbaseMm',
      'trackWidthFrontMm',
      'trackWidthRearMm',
    ]);
    expect(tab.measurements.every((m) => m.inUnit && !m.allowZero)).toBe(true);
  });

  it('translates the vehicle and axle options', () => {
    const { tab } = build();
    expect([...select(tab, 0).options].map((o) => [o.value, o.textContent])).toEqual([
      ['motorhome', t('vehicle.motorhome')],
      ['caravan', t('vehicle.caravan')],
    ]);
    expect([...select(tab, 1).options].map((o) => [o.value, o.textContent])).toEqual([
      ['single', t('axle.single')],
      ['boggie', t('axle.boggie')],
    ]);
  });
});

describe('a caravan', () => {
  it('hides the front track width and relabels axle, wheelbase and track width', () => {
    const { tab } = build({ vehicleType: 'caravan' });
    expect(shown(tab)).toEqual([
      t('settings.vehicle'),
      t('settings.axle'),
      `${t('settings.axleToJockey')} (mm)`,
      `${t('settings.track')} (mm)`,
      'settings__hint',
      'link-button settings__share-vehicle',
    ]);
    expect(tab.measureHint.textContent).toBe(t('settings.measureHint.caravan'));
  });
});

describe('changing the vehicle or axle', () => {
  it('switching to caravan updates the state, relabels every tab and saves', () => {
    const { tab, state, changed, relabelAll } = build();
    choose(select(tab, 0), 'caravan');
    expect(state.vehicle).toBe('caravan');
    expect(relabelAll).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledOnce();
    expect(shown(tab)).not.toContain(`${t('settings.trackFront')} (mm)`);
    expect(read(tab).vehicleType).toBe('caravan');
  });

  it('a boggie adds its measuring advice to the hint', () => {
    const { tab, state, changed, relabelAll } = build();
    choose(select(tab, 1), 'boggie');
    expect(state.axle).toBe('boggie');
    expect(relabelAll).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledOnce();
    expect(tab.measureHint.textContent).toBe(
      `${t('settings.measureHint')} ${t('settings.measureHint.boggie')}`,
    );
    expect(read(tab).rearAxle).toBe('boggie');
  });

  it('a caravan with a boggie gets the caravan hint plus the boggie advice', () => {
    const { tab } = build({ vehicleType: 'caravan', rearAxle: 'boggie' });
    expect(tab.measureHint.textContent).toBe(
      `${t('settings.measureHint.caravan')} ${t('settings.measureHint.boggie')}`,
    );
  });
});

describe('read and populate', () => {
  it('reads the vehicle and axle from the form state', () => {
    const { tab } = build({ vehicleType: 'caravan', rearAxle: 'boggie' });
    expect(read(tab)).toEqual({ vehicleType: 'caravan', rearAxle: 'boggie' });
  });

  it('populate shows the given vehicle and axle', () => {
    const { tab } = build();
    tab.populate({ ...DEFAULT_SETTINGS, vehicleType: 'caravan', rearAxle: 'boggie' });
    expect(select(tab, 0).value).toBe('caravan');
    expect(select(tab, 1).value).toBe('boggie');
  });
});

describe('sharing', () => {
  it('hands the form’s current settings to onShare', () => {
    const { tab, onShare, initial } = build();
    const share = tab.elements().at(-1) as HTMLButtonElement;
    expect(share.tagName).toBe('BUTTON');
    expect(share.textContent).toBe(t('settings.shareVehicle'));
    share.click();
    expect(onShare).toHaveBeenCalledExactlyOnceWith(initial);
  });
});
