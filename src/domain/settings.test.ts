import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EASYLEVEL_SETTINGS,
  DEFAULT_SETTINGS,
  easyLevelSettings,
  EASYLEVEL_MOUNTINGS,
  formatLength,
  formatLengthValue,
  formatStepHeightsList,
  MAX_EASYLEVEL_CONNECT_DELAY_MS,
  parseStepHeightsList,
  parseSettings,
  toggleMute,
  withEasyLevelSettings,
} from './settings';

describe('parseSettings', () => {
  it('returns valid stored settings unchanged', () => {
    const stored = {
      vehicleType: 'caravan' as const,
      rearAxle: 'boggie' as const,
      wheelbaseMm: 3500,
      trackWidthFrontMm: 2000,
      trackWidthRearMm: 1700,
      rampStepHeightsMm: [20, 50, 80],
      rampCount: 4,
      drainPosition: 'left' as const,
      toleranceMm: 15,
      stabilityMm: 5,
      dwellRestMs: 500,
      dwellMotionMs: 120,
      displayUnit: 'cm' as const,
      soundOnLevel: true,
      soundGuidance: true,
      theme: 'light' as const,
      appearance: 'modern' as const,
      sensorSource: 'phone' as const,
      sensorDevices: {
        easylevel: { mounting: 'rotated90', connectDelayEnabled: true, connectDelayMs: 800 },
      },
    };
    expect(parseSettings(stored)).toEqual(stored);
  });

  it('migrates legacy cm values (wheelbase, track widths) to mm', () => {
    const result = parseSettings({ wheelbaseCm: 350, trackWidthCm: 200 });
    expect(result.wheelbaseMm).toBe(3500);
    expect(result.trackWidthFrontMm).toBe(2000);
    expect(result.trackWidthRearMm).toBe(2000);
    const perAxle = parseSettings({ trackWidthFrontCm: 190, trackWidthRearCm: 165 });
    expect(perAxle.trackWidthFrontMm).toBe(1900);
    expect(perAxle.trackWidthRearMm).toBe(1650);
  });

  it('migrates legacy cm step heights to mm', () => {
    expect(parseSettings({ blockHeightCm: 5 }).rampStepHeightsMm).toEqual([50]);
    expect(parseSettings({ blockHeightsCm: [2, 4, 6] }).rampStepHeightsMm).toEqual([20, 40, 60]);
  });

  it('sorts, dedupes and cleans the step height list', () => {
    const result = parseSettings({ rampStepHeightsMm: [60, 20, 20, -1, NaN, 40] });
    expect(result.rampStepHeightsMm).toEqual([20, 40, 60]);
  });

  it('falls back to defaults for missing input', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('garbage')).toEqual(DEFAULT_SETTINGS);
  });

  it('replaces corrupt fields individually and keeps the valid ones', () => {
    const result = parseSettings({
      wheelbaseMm: -10,
      trackWidthFrontMm: 'wide',
      trackWidthRearMm: 1700,
      rampStepHeightsMm: [60],
      toleranceMm: NaN,
    });
    expect(result).toEqual({
      vehicleType: DEFAULT_SETTINGS.vehicleType,
      rearAxle: DEFAULT_SETTINGS.rearAxle,
      wheelbaseMm: DEFAULT_SETTINGS.wheelbaseMm,
      trackWidthFrontMm: DEFAULT_SETTINGS.trackWidthFrontMm,
      trackWidthRearMm: 1700,
      rampStepHeightsMm: [60],
      rampCount: DEFAULT_SETTINGS.rampCount,
      drainPosition: DEFAULT_SETTINGS.drainPosition,
      toleranceMm: DEFAULT_SETTINGS.toleranceMm,
      stabilityMm: DEFAULT_SETTINGS.stabilityMm,
      dwellRestMs: DEFAULT_SETTINGS.dwellRestMs,
      dwellMotionMs: DEFAULT_SETTINGS.dwellMotionMs,
      displayUnit: 'mm',
      soundOnLevel: DEFAULT_SETTINGS.soundOnLevel,
      soundGuidance: false,
      theme: 'system',
      appearance: DEFAULT_SETTINGS.appearance,
      sensorSource: DEFAULT_SETTINGS.sensorSource,
      sensorDevices: DEFAULT_SETTINGS.sensorDevices,
    });
  });

  it('clamps a stored motion dwell that exceeds the rest dwell (#183)', () => {
    // A hand-edited or legacy blob could carry a faster-than-rest motion
    // dwell that is no longer faster than a *changed* rest dwell — never
    // let the "quick" figure end up slower than the "calm" one.
    const result = parseSettings({ dwellRestMs: 300, dwellMotionMs: 900 });
    expect(result.dwellRestMs).toBe(300);
    expect(result.dwellMotionMs).toBe(300);
  });

  it('falls back to the default dwell values for invalid input', () => {
    const result = parseSettings({ dwellRestMs: -5, dwellMotionMs: 'fast' });
    expect(result.dwellRestMs).toBe(DEFAULT_SETTINGS.dwellRestMs);
    expect(result.dwellMotionMs).toBe(DEFAULT_SETTINGS.dwellMotionMs);
  });

  it('validates the ramp count: whole, at least 1, at most 4, default 2 (#93)', () => {
    expect(DEFAULT_SETTINGS.rampCount).toBe(2); // ramps are sold in pairs
    expect(parseSettings({ rampCount: 3 }).rampCount).toBe(3);
    expect(parseSettings({ rampCount: 3.6 }).rampCount).toBe(4);
    expect(parseSettings({ rampCount: 99 }).rampCount).toBe(4);
    expect(parseSettings({ rampCount: 0 }).rampCount).toBe(2);
    expect(parseSettings({ rampCount: 'many' }).rampCount).toBe(2);
  });

  it('validates the drain position, defaulting to none (#93)', () => {
    expect(parseSettings({ drainPosition: 'rear' }).drainPosition).toBe('rear');
    expect(parseSettings({ drainPosition: 'under' }).drainPosition).toBe('none');
    expect(parseSettings({}).drainPosition).toBe('none');
  });

  it('drops a legacy degree-based tolerance in favor of the mm default', () => {
    expect(parseSettings({ toleranceDeg: 0.5 }).toleranceMm).toBe(DEFAULT_SETTINGS.toleranceMm);
  });

  it('accepts stability 0 (hysteresis off) but not negative values', () => {
    expect(parseSettings({ stabilityMm: 0 }).stabilityMm).toBe(0);
    expect(parseSettings({ stabilityMm: -2 }).stabilityMm).toBe(DEFAULT_SETTINGS.stabilityMm);
  });

  it('validates display unit and sound preference', () => {
    expect(parseSettings({ displayUnit: 'cm' }).displayUnit).toBe('cm');
    expect(parseSettings({ displayUnit: 'inches' }).displayUnit).toBe('mm');
    expect(parseSettings({ soundOnLevel: true }).soundOnLevel).toBe(true);
    expect(parseSettings({ soundOnLevel: false }).soundOnLevel).toBe(false);
    expect(parseSettings({ soundOnLevel: 'yes' }).soundOnLevel).toBe(DEFAULT_SETTINGS.soundOnLevel);
    expect(parseSettings({ soundGuidance: true }).soundGuidance).toBe(true);
    expect(parseSettings({ soundGuidance: 'yes' }).soundGuidance).toBe(false);
  });

  it('defaults soundOnLevel to on for a never-saved value, without overriding an explicit choice (#153)', () => {
    expect(parseSettings({}).soundOnLevel).toBe(true);
    expect(parseSettings({ vehicleType: 'caravan' }).soundOnLevel).toBe(true);
    expect(parseSettings({ soundOnLevel: false }).soundOnLevel).toBe(false);
    expect(parseSettings({ soundOnLevel: true }).soundOnLevel).toBe(true);
  });

  it('validates the vehicle type, defaulting to motorhome', () => {
    expect(parseSettings({ vehicleType: 'caravan' }).vehicleType).toBe('caravan');
    expect(parseSettings({ vehicleType: 'motorhome' }).vehicleType).toBe('motorhome');
    expect(parseSettings({ vehicleType: 'boat' }).vehicleType).toBe('motorhome');
    expect(parseSettings({}).vehicleType).toBe('motorhome');
  });

  it('validates the axle configuration, defaulting to single', () => {
    expect(parseSettings({ rearAxle: 'boggie' }).rearAxle).toBe('boggie');
    expect(parseSettings({ rearAxle: 'single' }).rearAxle).toBe('single');
    expect(parseSettings({ rearAxle: 'triple' }).rearAxle).toBe('single');
    expect(parseSettings({}).rearAxle).toBe('single');
  });

  it('validates the theme choice, defaulting to following the phone', () => {
    expect(parseSettings({}).theme).toBe('system');
    expect(parseSettings({ theme: 'light' }).theme).toBe('light');
    expect(parseSettings({ theme: 'dark' }).theme).toBe('dark');
    expect(parseSettings({ theme: 'sepia' }).theme).toBe('system');
  });

  it('validates the appearance preset, defaulting to modern (#136)', () => {
    expect(DEFAULT_SETTINGS.appearance).toBe('modern');
    expect(parseSettings({}).appearance).toBe('modern');
    expect(parseSettings({ appearance: 'modern' }).appearance).toBe('modern');
    // An explicit Classic choice — including settings saved from before
    // #136, when Classic was the default — is never overridden.
    expect(parseSettings({ appearance: 'classic' }).appearance).toBe('classic');
    // Glossy (chat-directed third preset): a valid choice like the other two.
    expect(parseSettings({ appearance: 'glossy' }).appearance).toBe('glossy');
    expect(parseSettings({ appearance: 'retro' }).appearance).toBe('modern');
  });

  it('validates the sensor source, defaulting to phone (#128, #116)', () => {
    expect(DEFAULT_SETTINGS.sensorSource).toBe('phone');
    expect(parseSettings({}).sensorSource).toBe('phone');
    expect(parseSettings({ sensorSource: 'phone' }).sensorSource).toBe('phone');
    // #116 adds the EasyLevel BLE box as a second real member of the union.
    expect(parseSettings({ sensorSource: 'easylevel' }).sensorSource).toBe('easylevel');
    // Any other value, including a future one this build doesn't know
    // about yet, falls back rather than silently trusting unknown input.
    expect(parseSettings({ sensorSource: 'bluetooth-widget' }).sensorSource).toBe('phone');
  });

  it('validates the EasyLevel mounting orientation, defaulting to standard (#217)', () => {
    // Read through the per-source accessor since #264; the stored inputs
    // below are #217's own flat fields, which must still be understood.
    const mountingOf = (raw: Record<string, unknown>) =>
      easyLevelSettings(parseSettings(raw)).mounting;
    expect(DEFAULT_EASYLEVEL_SETTINGS.mounting).toBe('standard');
    expect(mountingOf({})).toBe('standard');
    expect(mountingOf({ easyLevelMounting: 'standard' })).toBe('standard');
    expect(mountingOf({ easyLevelMounting: 'rotated90' })).toBe('rotated90');
    // All four physical rotations (#222) — the two added later must parse
    // exactly like the original pair, and the original pair must keep
    // working for anyone who stored one before that change.
    expect(mountingOf({ easyLevelMounting: 'rotated180' })).toBe('rotated180');
    expect(mountingOf({ easyLevelMounting: 'rotated270' })).toBe('rotated270');
    expect(EASYLEVEL_MOUNTINGS).toEqual(['standard', 'rotated90', 'rotated180', 'rotated270']);
    // Any other value, including a future one this build doesn't know about
    // yet, falls back rather than silently trusting unknown input.
    expect(mountingOf({ easyLevelMounting: 'upside-down' })).toBe('standard');
    expect(mountingOf({ sensorDevices: { easylevel: { mounting: 'upside-down' } } })).toBe(
      'standard',
    );
  });

  it('the EasyLevel debug connect delay defaults off, and a present value is never overridden (#212)', () => {
    const enabledOf = (raw: Record<string, unknown>) =>
      easyLevelSettings(parseSettings(raw)).connectDelayEnabled;
    expect(DEFAULT_EASYLEVEL_SETTINGS.connectDelayEnabled).toBe(false);
    expect(enabledOf({})).toBe(false);
    expect(enabledOf({ easyLevelConnectDelayEnabled: true })).toBe(true);
    // Presence check, not truthiness (#212, same discipline as soundOnLevel):
    // an explicit prior `false` is never coerced back to the default.
    expect(enabledOf({ easyLevelConnectDelayEnabled: false })).toBe(false);
    expect(enabledOf({ easyLevelConnectDelayEnabled: 'yes' })).toBe(false);
    expect(enabledOf({ sensorDevices: { easylevel: { connectDelayEnabled: true } } })).toBe(true);
  });

  it('clamps the EasyLevel debug connect delay to MAX_EASYLEVEL_CONNECT_DELAY_MS (#212)', () => {
    const msOf = (raw: Record<string, unknown>) =>
      easyLevelSettings(parseSettings(raw)).connectDelayMs;
    expect(msOf({})).toBe(DEFAULT_EASYLEVEL_SETTINGS.connectDelayMs);
    expect(msOf({ easyLevelConnectDelayMs: 900 })).toBe(900);
    expect(msOf({ easyLevelConnectDelayMs: 999999 })).toBe(MAX_EASYLEVEL_CONNECT_DELAY_MS);
    // Negative/garbage falls back to the default, same as every other
    // numeric field's `nonNegativeNumber` guard.
    expect(msOf({ easyLevelConnectDelayMs: -5 })).toBe(DEFAULT_EASYLEVEL_SETTINGS.connectDelayMs);
    expect(msOf({ easyLevelConnectDelayMs: 'slow' })).toBe(
      DEFAULT_EASYLEVEL_SETTINGS.connectDelayMs,
    );
    expect(msOf({ sensorDevices: { easylevel: { connectDelayMs: 999999 } } })).toBe(
      MAX_EASYLEVEL_CONNECT_DELAY_MS,
    );
  });
});

describe('per-source device settings (#264)', () => {
  it('keeps an entry for a source this build has never heard of', () => {
    // Moving between builds must not destroy the other build's device
    // settings, which is why the bag is not validated entry by entry.
    const parsed = parseSettings({
      sensorDevices: { 'some-future-box': { mounting: 'sideways', pollMs: 750 } },
    });
    expect(parsed.sensorDevices['some-future-box']).toEqual({
      mounting: 'sideways',
      pollMs: 750,
    });
  });

  it('drops an entry that is not an object at all, rather than carrying junk', () => {
    const parsed = parseSettings({ sensorDevices: { easylevel: 'not an object', other: 42 } });
    // A known source falls back to its defaults; an unknown one that is
    // not even an object is dropped rather than carried as junk.
    expect(parsed.sensorDevices.easylevel).toEqual(DEFAULT_EASYLEVEL_SETTINGS);
    expect(parsed.sensorDevices.other).toBeUndefined();
  });

  it('survives a corrupt bag without taking the rest of the settings down', () => {
    const parsed = parseSettings({ sensorDevices: 'nonsense', wheelbaseMm: 4200 });
    expect(parsed.wheelbaseMm).toBe(4200);
    expect(easyLevelSettings(parsed)).toEqual(DEFAULT_EASYLEVEL_SETTINGS);
  });

  it('falls back per field, so one corrupt value does not lose the others', () => {
    const parsed = parseSettings({
      sensorDevices: { easylevel: { mounting: 'rotated180', connectDelayMs: 'slow' } },
    });
    expect(easyLevelSettings(parsed)).toEqual({
      mounting: 'rotated180',
      connectDelayEnabled: DEFAULT_EASYLEVEL_SETTINGS.connectDelayEnabled,
      connectDelayMs: DEFAULT_EASYLEVEL_SETTINGS.connectDelayMs,
    });
  });

  it('migrates #212/#217’s flat fields, so a stored mounting choice survives', () => {
    // A wrong mounting silently names the wrong wheel (#222), so losing
    // this one in an upgrade would be worse than a visible failure.
    const parsed = parseSettings({
      easyLevelMounting: 'rotated270',
      easyLevelConnectDelayEnabled: true,
      easyLevelConnectDelayMs: 1200,
    });
    expect(easyLevelSettings(parsed)).toEqual({
      mounting: 'rotated270',
      connectDelayEnabled: true,
      connectDelayMs: 1200,
    });
  });

  it('prefers an existing entry over the legacy flat fields', () => {
    const parsed = parseSettings({
      easyLevelMounting: 'rotated90',
      sensorDevices: { easylevel: { mounting: 'rotated180' } },
    });
    expect(easyLevelSettings(parsed).mounting).toBe('rotated180');
  });

  it('patches one source without touching another’s entry', () => {
    const before = parseSettings({
      sensorDevices: { easylevel: { mounting: 'rotated90' }, 'some-future-box': { pollMs: 500 } },
    });
    const after = withEasyLevelSettings(before, { mounting: 'rotated180' });
    expect(easyLevelSettings(after).mounting).toBe('rotated180');
    expect(after.sensorDevices['some-future-box']).toEqual({ pollMs: 500 });
    // And the patch leaves the fields it did not name alone.
    expect(easyLevelSettings(after).connectDelayMs).toBe(DEFAULT_EASYLEVEL_SETTINGS.connectDelayMs);
  });
});

describe('formatLength', () => {
  it('formats mm and cm with sensible precision', () => {
    expect(formatLength(63, 'mm')).toBe('63 mm');
    expect(formatLength(63, 'cm')).toBe('6.3 cm');
    expect(formatLength(40, 'cm')).toBe('4 cm');
  });
});

describe('formatLengthValue', () => {
  // Same rounding as formatLength, minus the unit suffix — for callers that
  // list several lengths under one shared "(mm)"/"(cm)" label (R14).
  it('formats the number only, no unit suffix', () => {
    expect(formatLengthValue(63, 'mm')).toBe('63');
    expect(formatLengthValue(63, 'cm')).toBe('6.3');
    expect(formatLengthValue(40, 'cm')).toBe('4');
  });
});

describe('parseStepHeightsList', () => {
  it('parses semicolon-separated mm values', () => {
    expect(parseStepHeightsList('20; 40; 60')).toEqual([20, 40, 60]);
  });

  it('accepts decimal commas and drops invalid entries', () => {
    expect(parseStepHeightsList(' 45,5 ; junk; -2; 20 ')).toEqual([20, 45.5]);
    expect(parseStepHeightsList('')).toEqual([]);
  });

  it('round-trips through the display format', () => {
    expect(formatStepHeightsList(parseStepHeightsList('60;20;40'))).toBe('20; 40; 60');
  });
});

describe('toggleMute (#161)', () => {
  it('muting both on turns both off and remembers the prior values', () => {
    const result = toggleMute({ soundOnLevel: true, soundGuidance: true }, null);
    expect(result.settings).toEqual({ soundOnLevel: false, soundGuidance: false });
    expect(result.preMute).toEqual({ soundOnLevel: true, soundGuidance: true });
  });

  it('unmuting restores exactly the remembered prior values', () => {
    const muted = toggleMute({ soundOnLevel: true, soundGuidance: true }, null);
    const unmuted = toggleMute(muted.settings, muted.preMute);
    expect(unmuted.settings).toEqual({ soundOnLevel: true, soundGuidance: true });
    expect(unmuted.preMute).toBeNull();
  });

  it('never forces a setting back on that was already off before muting', () => {
    const muted = toggleMute({ soundOnLevel: false, soundGuidance: true }, null);
    expect(muted.preMute).toEqual({ soundOnLevel: false, soundGuidance: true });
    const unmuted = toggleMute(muted.settings, muted.preMute);
    expect(unmuted.settings).toEqual({ soundOnLevel: false, soundGuidance: true });
  });

  it('muting when both are already off is a harmless no-op restore', () => {
    const muted = toggleMute({ soundOnLevel: false, soundGuidance: false }, null);
    expect(muted.settings).toEqual({ soundOnLevel: false, soundGuidance: false });
    const unmuted = toggleMute(muted.settings, muted.preMute);
    expect(unmuted.settings).toEqual({ soundOnLevel: false, soundGuidance: false });
  });
});
