import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { createAppSettings } from './appSettings';

describe('createAppSettings', () => {
  it('starts from the given settings', () => {
    expect(createAppSettings(DEFAULT_SETTINGS, () => {}).get()).toBe(DEFAULT_SETTINGS);
  });

  it('stores what it is set to', () => {
    const save = vi.fn();
    const settings = createAppSettings(DEFAULT_SETTINGS, save);
    const next = { ...DEFAULT_SETTINGS, toleranceMm: 7 };
    settings.set(next);
    expect(settings.get()).toBe(next);
    expect(save).toHaveBeenCalledWith(next);
  });

  it('adopts settings already stored, without storing them again', () => {
    const save = vi.fn();
    const settings = createAppSettings(DEFAULT_SETTINGS, save);
    const next = { ...DEFAULT_SETTINGS, toleranceMm: 7 };
    settings.adopt(next);
    expect(settings.get()).toBe(next);
    expect(save).not.toHaveBeenCalled();
  });
});
