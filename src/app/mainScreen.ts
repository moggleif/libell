/** The main screen: the bottom bar's mute, the indicators, and the level screen. */
import { hasStoredMeasurements } from '../data/settingsStore';
import { attachMuteButton } from '../ui/muteButton';
import type { Core, Screen } from './core';
import { mountLamps, mountSensorStatus, mountTargetBadge } from './indicatorWiring';
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
  screen.targetBadge = mountTargetBadge(document.querySelector('#indicators'), {
    activeName: () => core.optionDeps.targets.activeName(),
    open: navigation.openTargets,
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
  const { externalSensors, sound } = core;
  const { externalSensorPage, sensorPage } = pages.sensorPages;
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
      externalSensorPage?.refreshLive();
    },
    externalSensors,
    hasSensorPage: externalSensorPage !== null,
    isLandscape: () => landscape.matches,
    isVisible: () => document.visibilityState === 'visible',
    openActiveSensorPage: pages.navigation.openActiveSensorPage,
    retry: () => externalSensors.retry(),
    usePhoneSensor: () => externalSensors.usePhoneSensor(),
    playChime: sound.playChime,
    playGuidancePulse: sound.playGuidancePulse,
    vibrate(pattern) {
      if ('vibrate' in navigator) navigator.vibrate(pattern);
    },
  });
}
