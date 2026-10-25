import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type SensorSource } from '../domain/settings';
import type { InstallOffer } from '../ui/install';
import type { IntroOptions } from '../ui/intro';
import type { OnboardingOptions } from '../ui/onboarding';
import { createBoxPending } from './indicatorWiring';
import type { MenuOptionDeps } from './menuOptionParts';
import { createOnboardingLauncher } from './onboardingLauncher';

function setup(source: SensorSource = 'phone') {
  let shown: OnboardingOptions | null = null;
  let intro: IntroOptions | null = null;
  const install: InstallOffer = { kind: () => null, install: () => null, onChange: () => {} };
  const calls: string[] = [];
  const boxPending = createBoxPending({ load: () => false, save: () => {} });
  const sensorOptionsFor = vi.fn();
  const launcher = createOnboardingLauncher({
    show: (options) => void (shown = options),
    showIntro: (options) => void (intro = options),
    install,
    settings: () => ({ ...DEFAULT_SETTINGS, appearance: 'classic' }),
    onSettingsSaved: () => void calls.push('saved'),
    parts: {
      activeSensor: () => ({ getSource: () => source }),
      boxWiring: { settings: { get: () => DEFAULT_SETTINGS } },
    } as unknown as MenuOptionDeps,
    sensorOptionsFor,
    progress: {
      markSeen: () => void calls.push('seen'),
      markDone: () => void calls.push('done'),
    },
    boxPending,
    activeSource: () => source,
    refreshLamps: () => void calls.push('lamps'),
  });
  return {
    launcher,
    shown: () => shown,
    intro: () => intro!,
    install,
    calls,
    boxPending,
    sensorOptionsFor,
  };
}

describe('createOnboardingLauncher', () => {
  it('shows the wizard with the current settings and the shared options', () => {
    const { launcher, shown, sensorOptionsFor } = setup();
    expect(launcher.isOpen()).toBe(false);
    launcher.open();
    expect(launcher.isOpen()).toBe(true);
    expect(shown()!.initialSettings.appearance).toBe('classic');
    expect(shown()!.sensorOptionsFor).toBe(sensorOptionsFor);
    expect(shown()!).toHaveProperty('calibrate');
    expect(shown()!).toHaveProperty('getSensorSource');
  });

  it('passes its saves through', () => {
    const { launcher, shown, calls } = setup();
    launcher.open();
    shown()!.onSettingsSaved(DEFAULT_SETTINGS);
    expect(calls).toEqual(['saved']);
  });

  it('marks a skipped wizard seen, and refreshes the lamps', () => {
    const { launcher, shown, calls, boxPending } = setup();
    launcher.open();
    shown()!.onFinished(false, 'external');
    expect(launcher.isOpen()).toBe(false);
    expect(calls).toEqual(['seen', 'lamps']);
    expect(boxPending.isPending()).toBe(false);
  });

  it('marks a finished wizard done', () => {
    const { launcher, shown, calls } = setup();
    launcher.open();
    shown()!.onFinished(true, 'phone');
    expect(calls).toEqual(['seen', 'done', 'lamps']);
  });

  it('awaits a box chosen but not connected', () => {
    const { launcher, shown, boxPending } = setup('phone');
    launcher.open();
    shown()!.onFinished(true, 'external');
    expect(boxPending.isPending()).toBe(true);
  });

  it('awaits nothing once the chosen box is connected', () => {
    const { launcher, shown, boxPending } = setup('xparkle');
    boxPending.settle(true);
    launcher.open();
    shown()!.onFinished(true, 'external');
    expect(boxPending.isPending()).toBe(false);
  });
});

describe('createOnboardingLauncher — first visit (#691)', () => {
  it('shows the intro first, with the install offer, and not the wizard', () => {
    const { launcher, shown, intro, install } = setup();
    launcher.openFirstRun();
    expect(launcher.isOpen()).toBe(true);
    expect(intro().install).toBe(install);
    expect(shown()).toBeNull();
  });

  it('"Get started" opens the wizard', () => {
    const { launcher, shown, intro } = setup();
    launcher.openFirstRun();
    intro().onStart();
    expect(launcher.isOpen()).toBe(true);
    expect(shown()?.initialSettings.appearance).toBe('classic');
  });

  it('"Look around first" counts as seen, never as done, and refreshes the lamps', () => {
    const { launcher, shown, intro, calls } = setup();
    launcher.openFirstRun();
    intro().onLookAround();
    expect(launcher.isOpen()).toBe(false);
    expect(shown()).toBeNull();
    expect(calls).toEqual(['seen', 'lamps']);
  });
});
