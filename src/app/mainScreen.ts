/** The main screen: the bottom bar's mute, the indicators, and the level screen. */
import { hasStoredMeasurements } from '../data/settingsStore';
import { attachMuteButton } from '../ui/muteButton';
import { t } from '../ui/i18n';
import { vehicleName } from '../ui/vehiclePicker';
import type { Core, Screen } from './core';
import { mountChoiceBadges, mountLamps, mountSensorStatus } from './indicatorWiring';
import { buildLevelScreen, createLevelScreenHost } from './levelScreen';
import type { Pages } from './pages';
import { createMuteToggle, unlockOnFirstGesture } from './sound';
import type { TopBar } from './topBar';

export function mountMainScreen(
  root: HTMLElement,
  core: Core,
  pages: Pages,
  screen: Screen,
  topBar: TopBar,
): void {
  const { navigation } = pages;
  attachMuteButton(
    {
      button: document.querySelector<HTMLButtonElement>('#sound-button'),
      waves: document.querySelector<SVGPathElement>('#sound-icon-waves'),
      mute: document.querySelector<SVGPathElement>('#sound-icon-mute'),
    },
    createMuteToggle(core.settings, core.sound.unlock).toggle,
  );
  unlockOnFirstGesture(document, core.sound.unlock);
  screen.lamps = mountLamps(document.querySelector('#indicators'), {
    demo: core.demo,
    activeSource: () => core.sensor().getSource(),
    boxPending: core.boxPending,
    phoneCalibration: core.optionDeps.phoneCalibration,
    activeInstallOffset: core.activeInstallOffset,
    measurementsSaved: hasStoredMeasurements,
    open: navigation.openLamp,
  });
  screen.choiceBadges = mountChoiceBadges(document.querySelector<HTMLElement>('#choices'), {
    ...choiceNames(core),
    openVehicle: () => navigation.openSettingsSection('vehicle'),
    openTargets: navigation.openTargets,
    hitchActive: core.optionDeps.hitch.isActive,
    stopHitch: core.optionDeps.hitch.stop,
  });
  // Into the pinned top-bar corner, beside Install.
  screen.sensorStatus = mountSensorStatus(document.querySelector('#sensor-slot'), {
    supported: pages.sensorPages.supported,
    showIosGuide: pages.sensorPages.showIosGuide,
    sensor: core.sensor,
    open: navigation.openSensor,
  });
  topBar.syncCorner();
  screen.levelScreen = createLevelScreenHost({
    settings: core.settings.get,
    build: () => buildAppLevelScreen(root, core, pages, screen),
  });
}

function buildAppLevelScreen(root: HTMLElement, core: Core, pages: Pages, screen: Screen) {
  const { boxes, sound } = core;
  const { hitch } = core.optionDeps;
  const { boxListPage, sensorPage } = pages.sensorPages;
  const landscape = window.matchMedia('(orientation: landscape)');
  return buildLevelScreen(root, {
    sensor: core.sensor,
    settings: core.settings.get,
    calibration: core.effectiveCalibration,
    // A page is open: the user is reading, phone in hand.
    isPaused: () =>
      pages.settingsSurface.isOpen() ||
      pages.infoPage.isOpen() ||
      sensorPage.isOpen() ||
      pages.onboarding.isOpen(),
    refreshStatus() {
      screen.sensorStatus.refresh();
      // The box page's live rows: a no-op unless that page is open.
      boxListPage?.refreshLive();
    },
    boxes,
    hasSensorPage: boxListPage !== null,
    isLandscape: () => landscape.matches,
    isVisible: () => document.visibilityState === 'visible',
    openActiveSensorPage: pages.navigation.openActiveSensorPage,
    retry: () => boxes.retry(),
    usePhoneSensor: () => boxes.usePhoneSensor(),
    playChime: sound.playChime,
    playGuidancePulse: sound.playGuidancePulse,
    speak: sound.speak,
    vibrate: vibrateIfSupported,
    hitching: hitch.isActive,
    hitchOffer: { isDue: hitch.isOfferDue, save: hitch.save, dismiss: hitch.dismissOffer },
  });
}

/** Haptics where the browser has them (not iOS Safari); a no-op elsewhere. */
export function vibrateIfSupported(pattern: VibratePattern): void {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

/** What the badges name (#616): each only while there is a choice to make. */
function choiceNames({ optionDeps: { vehicles, targets } }: Core) {
  return {
    vehicleName: () => {
      const list = vehicles.list();
      const active = list.find((vehicle) => vehicle.id === vehicles.activeId());
      return list.length > 1 && active ? vehicleName(active.name) : null;
    },
    targetName: () =>
      targets.presets().length > 0 ? (targets.activeName() ?? t('targets.normal')) : null,
  };
}
