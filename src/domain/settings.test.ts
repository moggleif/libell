import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  formatLength,
  formatLengthValue,
  formatStepHeightsList,
  parseStepHeightsList,
  parseSettings,
  toggleMute,
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
