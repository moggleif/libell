// @vitest-environment happy-dom
//
// Pins (#735) of the Sensorbox pages, the box's setup steps and the
// calibration cards, written before their hand-built buttons and text
// elements are built with button(), textElement() and paragraph() from
// dom.ts, so the move cannot change any of it: every element, attribute,
// text and child order is compared with the stored snapshot.
import { afterEach, describe, expect, it } from 'vitest';
import type { Calibration } from '../domain/calibration';
import type { SensorSource } from '../domain/settings';
import { NO_TRIM } from '../domain/zeroTrim';
import type { BoxDescriptor } from '../sensor/boxes';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { SensorState } from '../sensor/orientation';
import { XPARKLE_DESCRIPTOR } from '../sensor/xparkleSensor';
import { createCalibrationSection, type CalibrationOptions } from './calibrationSection';
import { describeDom } from './domPin.testing';
import { setLanguage } from './i18n';
import { createIosSensorGuidePage } from './iosSensorGuidePage';
import { createLearnMountingSection } from './learnMountingSection';
import { createSensorFallbackPrompt } from './sensorFallbackPrompt';
import { createSensorPage, type SensorPageOptions } from './sensorPage';
import { createUnsupportedSensorPage } from './unsupportedSensorPage';

setLanguage('en');

afterEach(() => {
  document.body.replaceChildren();
});

const ZERO: Calibration = { rollDeg: 0.4, pitchDeg: -0.2 };

interface BoxState {
  source: SensorSource;
  state: SensorState;
  zeroed: boolean;
  passwordRejected: boolean;
}

function boxOptions(sensor: BoxDescriptor, box: BoxState): SensorPageOptions {
  return {
    sensor,
    getSensorSource: () => box.source,
    getSensorState: () => box.state,
    connectSensor: () => Promise.resolve('granted'),
    disconnectSensor: () => {},
    getHealth: () => ({ batteryPercent: 72, temperatureCelsius: 19.5, firmwareLabel: '3' }),
    getInstallCalibration: () => (box.zeroed ? ZERO : null),
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    clearInstallCalibration: () => {},
    installZeroTrim: {
      hasZero: () => box.zeroed,
      getTrim: () => NO_TRIM,
      nudge: () => {},
      reset: () => {},
    },
    getCalibratedTilt: () => ({ rollDeg: 1.25, pitchDeg: -0.5 }),
    getDeviceId: () => 'device-1',
    getLastSampleAt: () => null,
    getRawAccel: () => null,
    getEasyLevelStatusBytes: () => null,
    getXparkleVersionBytes: () => null,
    getEasyLevelConnectDelay: () => ({ enabled: false, ms: 300 }),
    setEasyLevelConnectDelay: () => {},
    getMounting: () => 'standard',
    setMounting: () => {},
    learnMounting: {
      getRawReading: () => ({ rollDeg: 0, pitchDeg: 0 }),
      getLearnedMounting: () => null,
      setLearnedMounting: () => {},
    },
    getVehicleType: () => 'motorhome',
    offersSilentReconnectTip: () => true,
    password: {
      isRejected: () => box.passwordRejected,
      tryPassword: () => Promise.resolve(true),
    },
  };
}

const BOX_STATES: { name: string; box: BoxState }[] = [
  {
    name: 'the phone in use',
    box: { source: 'phone', state: 'idle', zeroed: false, passwordRejected: false },
  },
  {
    name: 'the box connected and zeroed',
    box: { source: 'xparkle', state: 'granted', zeroed: true, passwordRejected: false },
  },
  {
    name: 'the box connection lost',
    box: { source: 'xparkle', state: 'disconnected', zeroed: true, passwordRejected: false },
  },
  {
    name: 'the box rejecting its password',
    box: { source: 'xparkle', state: 'granted', zeroed: false, passwordRejected: true },
  },
];

describe.each(BOX_STATES)('the Sensorbox pages with $name (#735)', ({ box }) => {
  it('draw the same DOM', () => {
    const sensors = [EASYLEVEL_DESCRIPTOR, XPARKLE_DESCRIPTOR];
    const page = createSensorPage(sensors, (sensor) => boxOptions(sensor, box));
    page.open();
    page.openSource('xparkle');
    page.refreshLive();
    const frames = [page.element, ...page.statusElements].map(describeDom);
    expect(frames.join('\n\n')).toMatchSnapshot();
  });
});

describe('the pages without Web Bluetooth (#735)', () => {
  it('draw the same DOM on iOS', () => {
    expect(describeDom(createIosSensorGuidePage().element)).toMatchSnapshot();
  });

  it('draw the same DOM in a browser without it', () => {
    expect(describeDom(createUnsupportedSensorPage().element)).toMatchSnapshot();
  });
});

describe('the lost-sensor prompt (#735)', () => {
  it('draws the same DOM with and without an automatic retry', () => {
    const prompt = createSensorFallbackPrompt(
      () => Promise.resolve(),
      () => {},
    );
    prompt.update(true, true);
    const retrying = describeDom(prompt.element);
    prompt.update(true, false);
    expect(`${retrying}\n\n${describeDom(prompt.element)}`).toMatchSnapshot();
  });
});

describe('the learn-the-mounting guide (#735)', () => {
  it('draws the same DOM at every step', () => {
    const readings: Calibration[] = [
      { pitchDeg: 0, rollDeg: 0 },
      { pitchDeg: 0, rollDeg: -3 },
      { pitchDeg: 2, rollDeg: 0 },
    ];
    const guide = createLearnMountingSection({
      name: 'Xparkle',
      getRawReading: () => (readings.length > 1 ? readings.shift()! : readings[0]!),
      getLearnedMounting: () => null,
      setLearnedMounting: () => {},
    });
    guide.refresh();
    const frames = [describeDom(guide.element)];
    for (let step = 0; step < 3; step++) {
      const shown = [...guide.element.querySelectorAll('button')].find(
        (button) => !button.hidden && button.closest('[hidden]') === null,
      )!;
      shown.click();
      frames.push(describeDom(guide.element));
    }
    expect(frames.join('\n\n')).toMatchSnapshot();
  });
});

function calibrationOptions(appearance: 'classic' | 'modern', box: boolean): CalibrationOptions {
  return {
    appearance,
    getCalibration: () => null,
    calibrate: () => null,
    readTilt: () => ({ rollDeg: 1, pitchDeg: 2 }),
    applyCalibration: () => () => {},
    clearCalibration: () => {},
    getVehicleCalibration: () => ZERO,
    calibrateVehicle: () => null,
    getCalibrationCapturedAt: () => null,
    getVehicleCalibrationCapturedAt: () => null,
    checkCalibration: () => 'phone checked',
    checkVehicleCalibration: () => 'vehicle checked',
    clearVehicleCalibration: () => {},
    vehicleZeroTrim: {
      hasZero: () => true,
      getTrim: () => NO_TRIM,
      nudge: () => {},
      reset: () => {},
    },
    isPhoneActive: () => !box,
    getBox: () => (box ? { name: 'Xparkle RVS01', offset: ZERO, capturedAt: null } : null),
    calibrateBox: () => null,
    openBoxPage: () => {},
  };
}

describe('the calibration cards (#735)', () => {
  for (const layout of ['cards', 'checklist', 'wizard'] as const) {
    for (const appearance of ['classic', 'modern'] as const) {
      it(`draw the same DOM (${appearance} ${layout})`, () => {
        const frames = [false, true].map((box) => {
          const section = createCalibrationSection(calibrationOptions(appearance, box), layout);
          section.refresh();
          return describeDom(section.element);
        });
        expect(frames.join('\n\n')).toMatchSnapshot();
      });
    }
  }
});
