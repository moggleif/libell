import { describe, expect, it } from 'vitest';
import {
  calibrationStatusText,
  captureMessage,
  expandedStep,
  externalStatusText,
  pillFor,
  stepTitle,
} from './calibrationText';
import { setLanguage, t } from './i18n';

setLanguage('en');

const tilt = { rollDeg: 1.04, pitchDeg: -0.25 };

describe('calibrationStatusText (#416)', () => {
  it('says a message first, whatever is stored', () => {
    expect(calibrationStatusText('phone', tilt, null, true, 'oops')).toBe('oops');
  });

  it('is empty in the checklist, whose step title says it', () => {
    expect(calibrationStatusText('vehicle', tilt, null, true)).toBe('');
  });

  it('gives the numbers, or says there are none', () => {
    expect(calibrationStatusText('phone', tilt, null, false)).toBe(
      'Calibrated: front/back −0.3°, side/side +1.0°.',
    );
    expect(calibrationStatusText('vehicle', tilt, null, false)).toBe(
      'Vehicle zero: front/back −0.3°, side/side +1.0°.',
    );
    expect(calibrationStatusText('phone', null, null, false)).toBe(t('calibration.status.none'));
    expect(calibrationStatusText('vehicle', null, null, false)).toBe(
      t('calibration.vehicle.status.none'),
    );
  });

  it('ignores an empty message', () => {
    expect(calibrationStatusText('phone', null, null, false, '')).toBe(
      t('calibration.status.none'),
    );
  });
});

describe('pillFor', () => {
  it('is done, or pending for the phone and none for the vehicle', () => {
    expect(pillFor('phone', true)).toEqual({
      text: t('calibration.pill.done'),
      className: 'calibration-card__pill calibration-card__pill--done',
    });
    expect(pillFor('phone', false)).toEqual({
      text: t('calibration.pill.notDone'),
      className: 'calibration-card__pill calibration-card__pill--pending',
    });
    expect(pillFor('vehicle', false)).toEqual({
      text: t('calibration.pill.none'),
      className: 'calibration-card__pill',
    });
  });
});

describe('stepTitle', () => {
  it('says done, or names the step', () => {
    expect(stepTitle('phone', true, null)).toBe(t('calibration.step.phone.done'));
    expect(stepTitle('phone', false, null)).toBe(t('calibration.sensor.h'));
    expect(stepTitle('vehicle', true, null)).toBe(t('calibration.step.vehicle.done'));
    expect(stepTitle('vehicle', false, null)).toBe(t('calibration.vehicle.h'));
  });
});

describe('expandedStep', () => {
  it('follows the next undone step', () => {
    expect(expandedStep(null, false, false)).toBe('phone');
    expect(expandedStep(null, true, false)).toBe('vehicle');
    expect(expandedStep(null, false, true)).toBe('phone');
    expect(expandedStep(null, true, true)).toBe('none');
  });

  it('keeps the step opened or closed by the user', () => {
    expect(expandedStep('vehicle', false, false)).toBe('vehicle');
    expect(expandedStep('none', false, false)).toBe('none');
  });
});

describe('captureMessage (#411)', () => {
  it('offers "anyway" only for a tilt warning', () => {
    expect(captureMessage({ warning: 'tilted' })).toEqual({ text: 'tilted', warned: true });
    expect(captureMessage('no sensor')).toEqual({ text: 'no sensor', warned: false });
    expect(captureMessage(null)).toEqual({ text: null, warned: false });
  });
});

describe('externalStatusText (#290)', () => {
  it('says a message, else the box zero or that there is none', () => {
    expect(externalStatusText(tilt, null, 'working')).toBe('working');
    expect(externalStatusText(tilt, null, '')).toBe('');
    expect(externalStatusText(tilt, null)).toBe('Zero: front/back −0.3°, side/side +1.0°.');
    expect(externalStatusText(null, null)).toBe(t('sensorSource.install.status.none'));
  });
});
