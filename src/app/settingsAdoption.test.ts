import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type LevelSettings } from '../domain/settings';
import { createSettingsAdoption } from './settingsAdoption';

function setup() {
  const calls: string[] = [];
  const adoption = createSettingsAdoption({
    adopt: (next) => void calls.push(`adopt:${next.toleranceMm}`),
    applyLook: (next) => void calls.push(`look:${next.theme}`),
    unlockAudio: () => void calls.push('unlock'),
    refresh: () => void calls.push('refresh'),
  });
  return { adoption, calls };
}

const quiet: LevelSettings = {
  ...DEFAULT_SETTINGS,
  toleranceMm: 9,
  theme: 'dark',
  soundOnLevel: false,
  soundGuidance: false,
};

describe('createSettingsAdoption', () => {
  it('takes a Settings save, restyles and refreshes, in that order', () => {
    const { adoption, calls } = setup();
    adoption.fromSettings(quiet);
    expect(calls).toEqual(['adopt:9', 'look:dark', 'refresh']);
  });

  it.each([
    { soundOnLevel: true, soundGuidance: false },
    { soundOnLevel: false, soundGuidance: true },
  ])('unlocks audio from Settings when a sound is on (%o)', (sound) => {
    const { adoption, calls } = setup();
    adoption.fromSettings({ ...quiet, ...sound });
    expect(calls).toEqual(['adopt:9', 'look:dark', 'unlock', 'refresh']);
  });

  it('never unlocks audio from the wizard', () => {
    const { adoption, calls } = setup();
    adoption.fromWizard({ ...quiet, soundOnLevel: true, soundGuidance: true });
    expect(calls).toEqual(['adopt:9', 'look:dark', 'refresh']);
  });
});
