// @vitest-environment happy-dom
//
// Pins the Level tab on its own (#417): Tolerance and Drain side with
// their hints, the saved targets under their heading, the caravan's
// hidden drain side, and what reaches the stored settings.
import { describe, expect, it, vi } from 'vitest';
import { createLevelTab, type LevelTab } from './settingsLevelTab';
import type { RawSettings, SettingsFormContext, SettingsFormState } from './settingsFields';
import { setLanguage, t, type MessageKey } from './i18n';
import { DEFAULT_SETTINGS, DRAIN_POSITIONS, type LevelSettings } from '../domain/settings';

setLanguage('en');

function build(overrides: Partial<LevelSettings> = {}) {
  const initial: LevelSettings = { ...DEFAULT_SETTINGS, ...overrides };
  const state: SettingsFormState = {
    unit: initial.displayUnit,
    vehicle: initial.vehicleType,
    axle: initial.rearAxle,
  };
  const changed = vi.fn();
  const context: SettingsFormContext = {
    state,
    compact: false,
    changed,
    relabelAll: vi.fn(),
    currentSettings: () => initial,
  };
  const tab = createLevelTab(initial, context);
  tab.relabel();
  tab.tolerance.relabel();
  return { tab, state, changed };
}

function read(tab: LevelTab): RawSettings {
  const raw: RawSettings = {};
  tab.read(raw);
  return raw;
}

function drainSelect(tab: LevelTab): HTMLSelectElement {
  return tab.fieldElements()[2]!.querySelector('select')!;
}

describe('the fields', () => {
  it('are Tolerance, its hint, Drain side and its hint', () => {
    const { tab } = build();
    const [tolerance, toleranceHint, drain, drainHint] = tab.fieldElements();
    expect(tolerance).toBe(tab.tolerance.element);
    expect(tab.tolerance.caption.textContent).toBe(`${t('settings.tolerance')} (mm)`);
    expect(toleranceHint!.textContent).toBe(t('settings.tolerance.hint'));
    expect(drain!.firstElementChild!.textContent).toBe(t('settings.drain'));
    expect(drainHint!.textContent).toBe(t('settings.drainHint'));
  });

  it('Tolerance is a positive length stored as toleranceMm', () => {
    const { tab } = build();
    expect(tab.tolerance.key).toBe('toleranceMm');
    expect(tab.tolerance.inUnit).toBe(true);
    expect(tab.tolerance.allowZero).toBe(false);
    expect(tab.tolerance.control.step).toBe('1');
  });

  it('offers every drain position, translated, the stored one selected', () => {
    const { tab } = build({ drainPosition: 'rearLeft' });
    const select = drainSelect(tab);
    expect([...select.options].map((o) => [o.value, o.textContent])).toEqual(
      DRAIN_POSITIONS.map((p) => [p, t(`drain.${p}` as MessageKey)]),
    );
    expect(select.value).toBe('rearLeft');
  });
});

describe('the whole tab', () => {
  it('puts the saved targets under a Targets heading after the fields', () => {
    const { tab } = build();
    const targets = document.createElement('section');
    const elements = tab.elements(targets);
    expect(elements.slice(0, 4)).toEqual(tab.fieldElements());
    expect(elements[4]!.className).toBe('settings__section');
    expect(elements[4]!.textContent).toBe(t('menu.targets'));
    expect(elements[5]).toBe(targets);
  });
});

describe('a caravan', () => {
  it('hides Drain side and its hint, and shows them again for a motorhome', () => {
    const { tab, state } = build();
    const [, , drain, drainHint] = tab.fieldElements();
    state.vehicle = 'caravan';
    tab.relabel();
    expect(drain!.hidden).toBe(true);
    expect(drainHint!.hidden).toBe(true);
    state.vehicle = 'motorhome';
    tab.relabel();
    expect(drain!.hidden).toBe(false);
    expect(drainHint!.hidden).toBe(false);
  });
});

describe('read, populate and saving', () => {
  it('stores the drain side and saves when it changes', () => {
    const { tab, changed } = build();
    expect(read(tab)).toEqual({ drainPosition: 'none' });
    const select = drainSelect(tab);
    select.value = 'front';
    select.dispatchEvent(new Event('change'));
    expect(changed).toHaveBeenCalledOnce();
    expect(read(tab)).toEqual({ drainPosition: 'front' });
  });

  it('populate shows the given drain side', () => {
    const { tab } = build();
    tab.populate({ ...DEFAULT_SETTINGS, drainPosition: 'rearRight' });
    expect(drainSelect(tab).value).toBe('rearRight');
  });
});
