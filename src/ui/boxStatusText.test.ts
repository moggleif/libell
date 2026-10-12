import { describe, expect, it } from 'vitest';
import {
  ageText,
  connectButtonText,
  debugSummaryText,
  headerText,
  hexBytes,
  rawAccelText,
  showsConnectButton,
  temperatureText,
  tiltLineText,
} from './boxStatusText';
import { setLanguage, t } from './i18n';

setLanguage('en');

describe('headerText', () => {
  it('adds the rounded battery to Connected only', () => {
    expect(headerText('connected', 49.5)).toBe('Connected · battery 50 %');
    expect(headerText('connected', null)).toBe(t('box.state.connected'));
    expect(headerText('lost', 80)).toBe(t('box.state.lost'));
    expect(headerText('password', 80)).toBe(t('box.state.password'));
    expect(headerText('notConnected', 80)).toBe(t('box.state.notConnected'));
  });
});

describe('the header button', () => {
  it('is offered while the box is not delivering, if the page can connect', () => {
    expect(showsConnectButton(true, 'notConnected')).toBe(true);
    expect(showsConnectButton(true, 'lost')).toBe(true);
    expect(showsConnectButton(true, 'connected')).toBe(false);
    expect(showsConnectButton(true, 'password')).toBe(false);
    expect(showsConnectButton(false, 'lost')).toBe(false);
  });

  it('says Connecting, Reconnect or Connect', () => {
    expect(connectButtonText(true, true)).toBe(t('sensorSource.status.connecting'));
    expect(connectButtonText(false, true)).toBe(t('sensorFallback.retry'));
    expect(connectButtonText(false, false)).toBe(t('box.connect'));
  });
});

describe('tiltLineText', () => {
  const tilt = { rollDeg: 1.25, pitchDeg: -0.3 };

  it('joins the tilt to a position, or stands alone', () => {
    expect(tiltLineText(tilt, true)).toBe(' · Side/side 1.3° · Front/back -0.3°');
    expect(tiltLineText(tilt, false)).toBe('Side/side 1.3° · Front/back -0.3°');
  });

  it('is empty beside a position and a dash without one when there is no tilt', () => {
    expect(tiltLineText(null, true)).toBe('');
    expect(tiltLineText(null, false)).toBe(t('sensorStatus.reading', { value: '—' }));
  });
});

describe('the debug values', () => {
  it('formats temperature with one decimal, or not available', () => {
    expect(temperatureText(19.54)).toBe('Temperature: 19.5°C');
    expect(temperatureText(null)).toBe('Temperature: Not available yet');
  });

  it('gives the sample age in seconds, never negative, and a dash before any', () => {
    expect(ageText(1000, 1400)).toBe(t('sensorStatus.debug.age', { s: '0.4' }));
    expect(ageText(2000, 1000)).toBe(t('sensorStatus.debug.age', { s: '0.0' }));
    expect(ageText(null, 1000)).toBe('—');
  });

  it('writes bytes as spaced two-digit hex and the accel as x, y, z', () => {
    expect(hexBytes(new Uint8Array([1, 171]))).toBe('01 ab');
    expect(hexBytes(null)).toBeNull();
    expect(rawAccelText({ x: 1, y: -2, z: 3 })).toBe('1, -2, 3');
    expect(rawAccelText(null)).toBeNull();
  });

  it('summarises everything on seven lines for the clipboard', () => {
    const text = debugSummaryText({
      name: 'EasyLevel',
      state: 'granted',
      deviceId: null,
      lastSampleAge: '—',
      rawAccel: { x: 1, y: 2, z: 3 },
      firmwareLabel: '3',
      statusBytes: new Uint8Array([255]),
    });
    expect(text.split('\n')).toEqual([
      'Libell EasyLevel debug info',
      'Connection state: granted',
      'Device ID: Not available yet',
      'Last sample: —',
      'Raw accelerometer (x/y/z): 1, 2, 3',
      'Firmware: 3',
      'Raw status bytes: ff',
    ]);
  });
});
