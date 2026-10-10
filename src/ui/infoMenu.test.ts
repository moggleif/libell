// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createInfoPage, type InfoPageOptions } from './infoMenu';
import { createMenu, type MenuOptions } from './menu';
import { setLanguage, t } from './i18n';
import { DEFAULT_SETTINGS } from '../domain/settings';

setLanguage('en');

function makeMenuOptions(): MenuOptions {
  return {
    initialSettings: DEFAULT_SETTINGS,
    appearance: DEFAULT_SETTINGS.appearance,
    openOnboarding: () => {},
    onSettingsSaved: () => {},
    hasSavedSettings: () => false,
    getCalibration: () => null,
    calibrate: () => null,
    readTilt: () => ({ rollDeg: 0, pitchDeg: 0 }),
    applyCalibration: () => {},
    clearCalibration: () => {},
    getVehicleCalibration: () => null,
    calibrateVehicle: () => null,
    clearVehicleCalibration: () => {},
    getCalibrationCapturedAt: () => null,
    getVehicleCalibrationCapturedAt: () => null,
    checkCalibration: () => 'checked',
    checkVehicleCalibration: () => 'checked',
    getTargetPresets: () => [],
    getActiveTargetId: () => null,
    selectTarget: () => {},
    addTargetPreset: () => null,
    deleteTargetPreset: () => {},
    getSensorSource: () => 'phone',
    getSensorState: () => 'idle',
    connectSensor: () => Promise.resolve('unsupported'),
    disconnectSensor: () => {},
    getInstallCalibration: () => null,
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    checkInstallCalibration: () => 'checked',
    clearInstallCalibration: () => {},
    getCalibratedTilt: () => null,
    getActiveTargetName: () => null,
    getHealth: () => null,
    getEasyLevelDeviceId: () => null,
    getEasyLevelLastSampleAt: () => null,
    getEasyLevelRawAccel: () => null,
    getEasyLevelStatusBytes: () => null,
    getSoundPrefs: () => ({ soundOnLevel: false, soundGuidance: false }),
  };
}

function makeOptions(
  openOnboarding = vi.fn(),
  hasDoneOnboarding = () => true,
  extra: Partial<InfoPageOptions> = {},
): InfoPageOptions {
  return { openOnboarding, hasDoneOnboarding, ...extra };
}

describe('createInfoPage — "?" (screen-cleanup follow-up)', () => {
  it('starts closed, with the Help tab active', () => {
    const info = createInfoPage(makeOptions());
    expect(info.isOpen()).toBe(false);
    expect(info.element.hasAttribute('hidden')).toBe(true);
    const helpTab = info.element.querySelector<HTMLElement>('[data-tab="help"]');
    expect(helpTab?.getAttribute('aria-selected')).toBe('true');
  });

  it('opens on the first click of an attached button, closes on the second', () => {
    const info = createInfoPage(makeOptions());
    const button = document.createElement('button');
    info.attach(button);

    button.click();
    expect(info.isOpen()).toBe(true);
    expect(info.element.hasAttribute('hidden')).toBe(false);

    button.click();
    expect(info.isOpen()).toBe(false);
  });

  it('the ✕ button closes the page', () => {
    const info = createInfoPage(makeOptions());
    const button = document.createElement('button');
    info.attach(button);
    button.click();
    expect(info.isOpen()).toBe(true);

    info.element.querySelector<HTMLButtonElement>('.menu-page__back')!.click();
    expect(info.isOpen()).toBe(false);
  });

  it('shows three tabs — Help, About, Feedback, in that order (screen-cleanup follow-up)', () => {
    const info = createInfoPage(makeOptions());
    const tabs = [...info.element.querySelectorAll<HTMLElement>('.settings__tab')];
    expect(tabs.map((tab) => tab.dataset.tab)).toEqual(['help', 'about', 'feedback']);
  });

  it('switching tabs shows the matching content and updates the header title', () => {
    const info = createInfoPage(makeOptions());
    const button = document.createElement('button');
    info.attach(button);
    button.click();

    const aboutTab = info.element.querySelector<HTMLButtonElement>('[data-tab="about"]')!;
    aboutTab.click();
    expect(aboutTab.getAttribute('aria-selected')).toBe('true');
    expect(info.element.querySelector('[data-tab="help"]')?.getAttribute('aria-selected')).toBe(
      'false',
    );
    expect(info.element.querySelector('.menu-page__title')?.textContent).toBe(t('menu.about'));
    expect(info.element.textContent).toContain(t('about.text'));

    const feedbackTab = info.element.querySelector<HTMLButtonElement>('[data-tab="feedback"]')!;
    feedbackTab.click();
    expect(info.element.querySelector('.menu-page__title')?.textContent).toBe(t('menu.feedback'));
    expect(info.element.querySelector('form')).not.toBeNull();
  });

  it('reopening always lands back on the Help tab, even after leaving on a different one', () => {
    const info = createInfoPage(makeOptions());
    const button = document.createElement('button');
    info.attach(button);
    button.click();
    info.element.querySelector<HTMLButtonElement>('[data-tab="about"]')!.click();
    button.click(); // close
    button.click(); // reopen
    expect(info.element.querySelector('[data-tab="help"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  // The introduction relaunch (screen-cleanup follow-up): used to be its
  // own row in the ☰ menu's "OTHER" list; now a button in the Help tab,
  // closing this page first so the wizard isn't shown behind it. Moved
  // from the top to the bottom of the topic list (#326).
  it('shows a "Show introduction" button at the bottom of the Help tab that closes this page and relaunches onboarding', () => {
    const openOnboarding = vi.fn();
    const info = createInfoPage(makeOptions(openOnboarding));
    const button = document.createElement('button');
    info.attach(button);
    button.click();

    // Help is always the first tab panel added.
    const helpPanel = info.element.querySelectorAll<HTMLElement>('.settings__tabpanel')[0]!;
    const introButton = [...info.element.querySelectorAll('button')].find(
      (b) => b.textContent === t('menu.intro'),
    )!;
    expect(introButton).toBeDefined();
    // It's the last thing inside the Help panel, below the topics.
    expect(helpPanel.lastElementChild).toBe(introButton);

    introButton.click();
    expect(info.isOpen()).toBe(false);
    expect(openOnboarding).toHaveBeenCalledOnce();
  });

  // Design review, follow-up: the button used to be permanently
  // secondary-styled, as if re-launching the wizard were never more than
  // an optional extra — now it reads as an unfinished first-run task
  // (green, primary) until the wizard has actually been completed once.
  function introButton(info: ReturnType<typeof createInfoPage>): HTMLButtonElement {
    return [...info.element.querySelectorAll('button')].find(
      (b) => b.textContent === t('menu.intro'),
    )!;
  }

  it('"Show introduction" is green (primary) while onboarding has never been completed', () => {
    const info = createInfoPage(makeOptions(vi.fn(), () => false));
    const button = introButton(info);
    expect(button.className).toBe('menu__action');
  });

  it('"Show introduction" is secondary once onboarding has been completed', () => {
    const info = createInfoPage(makeOptions(vi.fn(), () => true));
    const button = introButton(info);
    expect(button.className).toContain('menu__action--secondary');
  });

  it('re-checks completion every time the page reopens', () => {
    let completed = false;
    const info = createInfoPage(makeOptions(vi.fn(), () => completed));
    const attachButton = document.createElement('button');
    info.attach(attachButton);
    attachButton.click(); // open
    expect(introButton(info).className).toBe('menu__action');

    attachButton.click(); // close
    completed = true; // the wizard finished while this page was closed
    attachButton.click(); // reopen
    expect(introButton(info).className).toContain('menu__action--secondary');
  });

  // The bug this component fixes (screen-cleanup follow-up): a prior
  // version reached Help/About/Feedback through the ☰ Settings menu's own
  // shared history depth, so its back button could pop through and reveal
  // the Settings drawer underneath. This component owns no history state
  // and holds no reference to `createMenu` at all — opening and closing it
  // must never affect an unrelated menu instance's own open/close state.
  it('never opens or affects an unrelated ☰ Settings menu instance', () => {
    const menu = createMenu(makeMenuOptions());
    const info = createInfoPage(makeOptions());
    const helpButton = document.createElement('button');
    info.attach(helpButton);

    expect(menu.isOpen()).toBe(false);
    helpButton.click();
    expect(info.isOpen()).toBe(true);
    expect(menu.isOpen()).toBe(false);

    info.element.querySelector<HTMLButtonElement>('.menu-page__back')!.click();
    expect(info.isOpen()).toBe(false);
    expect(menu.isOpen()).toBe(false);
  });

  // #326: the Help tab is a list of fold-out topics, each ending in a
  // button to the place it talks about, instead of one long page.
  describe('Help topics (#326)', () => {
    function helpPanel(info: ReturnType<typeof createInfoPage>): HTMLElement {
      return info.element.querySelectorAll<HTMLElement>('.settings__tabpanel')[0]!;
    }
    function topics(info: ReturnType<typeof createInfoPage>): HTMLElement[] {
      return [...helpPanel(info).querySelectorAll<HTMLElement>('.help-topic')];
    }
    function toggle(topic: HTMLElement): HTMLButtonElement {
      return topic.querySelector<HTMLButtonElement>('.help-topic__toggle')!;
    }
    function body(topic: HTMLElement): HTMLElement {
      return topic.querySelector<HTMLElement>('.help-topic__body')!;
    }
    function topic(info: ReturnType<typeof createInfoPage>, id: string): HTMLElement {
      return topics(info).find((el) => el.dataset.topic === id)!;
    }

    it('lists the topics in order, each titled', () => {
      const info = createInfoPage(makeOptions());
      expect(topics(info).map((el) => el.dataset.topic)).toEqual([
        'screen',
        'place',
        'measures',
        'ramps',
        'calibration',
        'sensor',
        'targets',
        'trouble',
      ]);
      expect(toggle(topic(info, 'screen')).textContent).toBe(t('help.screen.h'));
      expect(toggle(topic(info, 'sensor')).textContent).toBe(t('help.sensor.h'));
      expect(toggle(topic(info, 'trouble')).textContent).toBe(t('help.trouble.h'));
    });

    it('opens on "Reading the screen", every other topic folded', () => {
      const info = createInfoPage(makeOptions());
      for (const el of topics(info)) {
        const isScreen = el.dataset.topic === 'screen';
        expect(toggle(el).getAttribute('aria-expanded'), el.dataset.topic).toBe(String(isScreen));
        expect(body(el).hidden, el.dataset.topic).toBe(!isScreen);
      }
    });

    it('keeps one topic open at a time, and a second tap folds it again', () => {
      const info = createInfoPage(makeOptions());
      toggle(topic(info, 'calibration')).click();
      expect(body(topic(info, 'calibration')).hidden).toBe(false);
      expect(body(topic(info, 'screen')).hidden).toBe(true);

      toggle(topic(info, 'calibration')).click();
      expect(body(topic(info, 'calibration')).hidden).toBe(true);
      expect(topics(info).every((el) => body(el).hidden)).toBe(true);
    });

    it('reopening the page folds back to "Reading the screen"', () => {
      const info = createInfoPage(makeOptions());
      const button = document.createElement('button');
      info.attach(button);
      button.click();
      toggle(topic(info, 'ramps')).click();
      button.click(); // close
      button.click(); // reopen
      expect(body(topic(info, 'screen')).hidden).toBe(false);
      expect(body(topic(info, 'ramps')).hidden).toBe(true);
    });

    it('does not repeat what the About tab already says', () => {
      const info = createInfoPage(makeOptions());
      expect(helpPanel(info).textContent).not.toContain(t('about.text'));
      expect(helpPanel(info).textContent).not.toContain(t('about.offline'));
    });

    it.each([
      ['measures', 'vehicle', t('help.open', { name: t('settings.tab.vehicle') })],
      ['ramps', 'ramps', t('help.open', { name: t('settings.tab.ramps') })],
      ['calibration', 'calibration', t('help.open', { name: t('menu.calibration') })],
      ['sensor', 'sensor', t('help.open.sensor')],
      ['targets', 'targets', t('help.open', { name: t('menu.targets') })],
    ])("the %s topic's button closes Help, then opens %s", async (id, target, label) => {
      const openTarget = vi.fn();
      const info = createInfoPage(
        makeOptions(vi.fn(), () => true, { openTarget, hasSensorPage: true }),
      );
      const button = document.createElement('button');
      info.attach(button);
      button.click();
      toggle(topic(info, id)).click();

      const go = body(topic(info, id)).querySelector<HTMLButtonElement>('.help-topic__go')!;
      expect(go.textContent).toBe(label);
      go.click();
      expect(info.isOpen()).toBe(false);
      await vi.waitFor(() => expect(openTarget).toHaveBeenCalledWith(target));
    });

    it('has no sensor button where no sensor page exists, but still explains the box', () => {
      const info = createInfoPage(
        makeOptions(vi.fn(), () => true, { openTarget: vi.fn(), hasSensorPage: false }),
      );
      const sensor = topic(info, 'sensor');
      expect(sensor.querySelector('.help-topic__go')).toBeNull();
      expect(body(sensor).textContent).toContain(t('help.sensor.t'));
    });

    it('"If something is wrong" ends in a button to the Feedback tab', () => {
      const info = createInfoPage(makeOptions());
      const button = document.createElement('button');
      info.attach(button);
      button.click();
      const trouble = topic(info, 'trouble');
      toggle(trouble).click();
      const go = trouble.querySelector<HTMLButtonElement>('.help-topic__go')!;
      expect(go.textContent).toBe(t('help.open.feedback'));
      go.click();
      expect(info.isOpen()).toBe(true);
      expect(
        info.element.querySelector('[data-tab="feedback"]')?.getAttribute('aria-selected'),
      ).toBe('true');
    });
  });
});
