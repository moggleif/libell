// @vitest-environment happy-dom
//
// Pins (#710) of the dialog shell the four full-screen overlays build each on
// their own — written before they share one, so the change cannot alter any
// of it: a modal dialog named by its heading, focus on that heading, the page
// behind it inert, and on close the overlay gone, the page given back and
// focus returned to the opener before the caller hears of it. Each overlay's
// opening DOM (tags, every attribute and its value, text, child order) is
// also compared with the stored snapshot.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { showCountingChoice } from './countingChoice';
import { describeDom } from './domPin.testing';
import { setLanguage, t } from './i18n';
import { showIncomingVehicleSetup } from './incomingVehicleSetup';
import { showIntro } from './intro';
import { showOnboarding, type OnboardingOptions } from './onboarding';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';

setLanguage('en');

afterEach(() => {
  document.body.replaceChildren();
});

/** One overlay: how to open it with a callback that fires on close, and
 * which control closes it. */
interface DialogCase {
  name: string;
  selector: string;
  open(onClose: () => void): void;
  closer(overlay: HTMLElement): HTMLButtonElement;
}

function buttonLabelled(overlay: HTMLElement, label: string): HTMLButtonElement {
  const found = [...overlay.querySelectorAll('button')].find((b) => b.textContent === label);
  if (!found) throw new Error(`no button "${label}"`);
  return found;
}

function onboardingOptions(onFinished: () => void): OnboardingOptions {
  return {
    initialSettings: DEFAULT_SETTINGS,
    appearance: DEFAULT_SETTINGS.appearance,
    onSettingsSaved: () => {},
    onFinished,
    getCalibration: () => null,
    calibrate: () => null,
    readTilt: () => ({ rollDeg: 0, pitchDeg: 0 }),
    applyCalibration: () => () => {},
    clearCalibration: () => {},
    getVehicleCalibration: () => null,
    calibrateVehicle: () => null,
    clearVehicleCalibration: () => {},
    getCalibrationCapturedAt: () => null,
    getVehicleCalibrationCapturedAt: () => null,
    checkCalibration: () => 'checked',
    checkVehicleCalibration: () => 'checked',
    sensor: EASYLEVEL_DESCRIPTOR,
    getSensorSource: () => 'phone',
    getSensorState: () => 'idle',
    connectSensor: () => Promise.resolve('unsupported'),
    disconnectSensor: () => {},
    getInstallCalibration: () => null,
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    clearInstallCalibration: () => {},
    getMounting: () => 'standard',
    setMounting: () => {},
  };
}

const DIALOGS: DialogCase[] = [
  {
    name: 'the intro (#691)',
    selector: '.intro',
    open: (onClose) =>
      showIntro({
        install: { kind: () => null, install: () => null, onChange: () => {} },
        onStart: () => {},
        onLookAround: onClose,
      }),
    closer: (overlay) => buttonLabelled(overlay, t('intro.later')),
  },
  {
    name: 'the counting choice (#699)',
    selector: '.counting-choice',
    open: (onClose) => showCountingChoice({ onChoose: onClose }),
    closer: (overlay) => buttonLabelled(overlay, t('counting.no')),
  },
  {
    name: 'the incoming vehicle setup (R41)',
    selector: '.incoming-setup',
    open: (onClose) =>
      showIncomingVehicleSetup({
        geometry: {
          vehicleType: 'motorhome',
          rearAxle: 'single',
          wheelbaseMm: 3800,
          trackWidthFrontMm: 1800,
          trackWidthRearMm: 1900,
          rampStepHeightsMm: [40, 80],
          rampStepless: false,
          rampCount: 2,
          drainPosition: 'left',
        },
        displayUnit: 'mm',
        onApply: () => {},
        onAddAsNew: () => {},
        onDismiss: onClose,
      }),
    closer: (overlay) => buttonLabelled(overlay, t('setup.incoming.dismiss')),
  },
  {
    name: 'the onboarding wizard',
    selector: '.onboarding',
    open: (onClose) => showOnboarding(onboardingOptions(onClose)),
    closer: (overlay) => overlay.querySelector<HTMLButtonElement>('.onboarding__close')!,
  },
];

/** The app behind the overlay, with the button that opened it focused. */
function pageWithOpener(): { main: HTMLElement; opener: HTMLButtonElement } {
  const main = document.createElement('main');
  const opener = document.createElement('button');
  main.append(opener);
  document.body.append(main);
  opener.focus();
  return { main, opener };
}

describe.each(DIALOGS)('the dialog shell of $name (#710)', (dialog) => {
  const overlay = () => document.querySelector<HTMLElement>(dialog.selector);

  it('is a modal dialog at the end of <body>, named by its heading, with focus on it', () => {
    pageWithOpener();
    dialog.open(() => {});
    const shell = overlay()!;
    expect(shell.parentElement).toBe(document.body);
    expect(document.body.lastElementChild).toBe(shell);
    expect(shell.getAttribute('role')).toBe('dialog');
    expect(shell.getAttribute('aria-modal')).toBe('true');
    const heading = document.getElementById(shell.getAttribute('aria-labelledby')!)!;
    expect(shell.contains(heading)).toBe(true);
    expect(heading.tagName).toBe('H2');
    expect(heading.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(heading);
    expect(shell.hasAttribute('inert')).toBe(false);
  });

  it('has a single card as its only child', () => {
    dialog.open(() => {});
    const shell = overlay()!;
    expect(shell.children).toHaveLength(1);
    expect(shell.firstElementChild!.className).toMatch(/__card$/);
  });

  it('keeps the page behind it inert until closed', () => {
    const { main } = pageWithOpener();
    dialog.open(() => {});
    expect(main.hasAttribute('inert')).toBe(true);
    dialog.closer(overlay()!).click();
    expect(main.hasAttribute('inert')).toBe(false);
  });

  it('on close, is gone, gives the page and focus back, and only then tells the caller', () => {
    const { main, opener } = pageWithOpener();
    const seenOnClose = vi.fn(() => ({
      overlayGone: overlay() === null,
      pageInert: main.hasAttribute('inert'),
      focused: document.activeElement,
    }));
    dialog.open(seenOnClose);
    dialog.closer(overlay()!).click();
    expect(seenOnClose).toHaveBeenCalledOnce();
    expect(seenOnClose.mock.results[0]!.value).toEqual({
      overlayGone: true,
      pageInert: false,
      focused: opener,
    });
    expect(document.activeElement).toBe(opener);
  });

  it('draws the same DOM when it opens', () => {
    dialog.open(() => {});
    expect(describeDom(overlay()!)).toMatchSnapshot();
  });
});
