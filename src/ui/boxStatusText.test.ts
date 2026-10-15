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

const EASYLEVEL_ROWS = {
  temperature: true,
  firmwareVersion: true,
  debugBytes: true,
  versionBytes: false,
};
const XPARKLE_ROWS = {
  temperature: false,
  firmwareVersion: false,
  debugBytes: false,
  versionBytes: true,
};

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
    expect(tiltLineText(tilt, true)).toBe(' · Front/back −0.3° · Side/side +1.3°');
    expect(tiltLineText(tilt, false)).toBe('Front/back −0.3° · Side/side +1.3°');
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

  it('summarises everything the disclosure shows, temperature included (#402)', () => {
    const text = debugSummaryText({
      name: 'EasyLevel',
      state: 'granted',
      temperatureCelsius: 19.54,
      deviceId: null,
      lastSampleAge: '—',
      rawAccel: { x: 1, y: 2, z: 3 },
      firmwareLabel: '3',
      statusBytes: new Uint8Array([255]),
      versionBytes: null,
      capabilities: EASYLEVEL_ROWS,
    });
    expect(text.split('\n')).toEqual([
      'Libell EasyLevel · Debug info',
      'Connection state: granted',
      'Temperature: 19.5°C',
      'Device ID: Not available yet',
      'Last sample: —',
      'Raw accelerometer (x/y/z): 1, 2, 3',
      'Firmware tier: 3',
      'Raw status bytes: ff',
    ]);
  });

  it('uses the same labels as the screen, in the chosen language (#524)', () => {
    setLanguage('sv');
    try {
      const lines = debugSummaryText({
        name: 'Xparkle',
        state: 'granted',
        temperatureCelsius: null,
        deviceId: 'dev-1',
        lastSampleAge: '—',
        rawAccel: null,
        firmwareLabel: null,
        statusBytes: null,
        versionBytes: new Uint8Array([0x53, 0x01]),
        capabilities: XPARKLE_ROWS,
      }).split('\n');
      expect(lines).toContain(t('sensorStatus.debug.deviceId', { value: 'dev-1' }));
      expect(lines).toContain(t('sensorStatus.debug.versionBytes', { value: '53 01' }));
      expect(lines).toContain(t('sensorStatus.debug.state', { value: 'granted' }));
      expect(lines[0]).toBe(`Libell Xparkle · ${t('sensorStatus.debug')}`);
    } finally {
      setLanguage('en');
    }
  });

  it('says the temperature is not available before the box has sent one (#402)', () => {
    const text = debugSummaryText({
      name: 'EasyLevel',
      state: 'granted',
      temperatureCelsius: null,
      deviceId: null,
      lastSampleAge: '—',
      rawAccel: null,
      firmwareLabel: null,
      statusBytes: null,
      versionBytes: null,
      capabilities: EASYLEVEL_ROWS,
    });
    expect(text.split('\n')).toContain('Temperature: Not available yet');
  });

  it('copies only the rows the box has: the Xparkle’s serial number, no accelerometer (#597)', () => {
    const text = debugSummaryText({
      name: 'Xparkle RVS01',
      state: 'granted',
      temperatureCelsius: null,
      deviceId: 'dev-1',
      lastSampleAge: '—',
      rawAccel: { x: 0, y: 0, z: 9.81 },
      firmwareLabel: null,
      statusBytes: null,
      versionBytes: null,
      capabilities: XPARKLE_ROWS,
    });
    expect(text.split('\n')).toEqual([
      'Libell Xparkle RVS01 · Debug info',
      'Connection state: granted',
      'Device ID: dev-1',
      'Last sample: —',
      'Serial number and firmware (raw): Not available yet',
    ]);
  });
});
