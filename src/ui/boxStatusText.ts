/**
 * What the box's own page (`boxStatusPage.ts`) says for each state, as pure
 * functions of the values it reads — no DOM, so every decision is tested on
 * its own (#416).
 */
import type { Calibration } from '../domain/settings';
import type { GravityVector } from '../domain/leveling';
import type { SensorState } from '../sensor/orientation';
import type { BoxConnection } from './boxConnection';
import { t } from './i18n';

/** The header line: the state, with the battery once it is known (#332). */
export function headerText(connection: BoxConnection, batteryPercent: number | null): string {
  const state = t(`box.state.${connection}`);
  if (connection !== 'connected' || batteryPercent === null) return state;
  return `${state} · ${t('box.state.battery', { value: `${Math.round(batteryPercent)} %` })}`;
}

/** Whether the header offers its one button: whenever the box is not
 * delivering, and only when the page can connect at all (#314). */
export function showsConnectButton(canConnect: boolean, connection: BoxConnection): boolean {
  return canConnect && (connection === 'notConnected' || connection === 'lost');
}

export function connectButtonText(connecting: boolean, isActive: boolean): string {
  if (connecting) return t('sensorSource.status.connecting');
  return isActive ? t('sensorFallback.retry') : t('box.connect');
}

/**
 * The tilt half of the live line (#332): after the box's position when
 * there is one ("✓ Stands upright · Side…"), else on its own. Without a
 * tilt it is empty beside a position, and a dash without one (#343).
 */
export function tiltLineText(tilt: Calibration | null, hasPosition: boolean): string {
  if (tilt) {
    const separator = hasPosition ? ' · ' : '';
    return `${separator}${t('tilt.sideSide')} ${tilt.rollDeg.toFixed(1)}° · ${t('tilt.frontBack')} ${tilt.pitchDeg.toFixed(1)}°`;
  }
  return hasPosition ? '' : t('sensorStatus.reading', { value: '—' });
}

export function temperatureText(temperatureCelsius: number | null | undefined): string {
  return t('sensorSource.detail.temperature', {
    value:
      temperatureCelsius == null
        ? t('sensorSource.detail.notAvailable')
        : `${temperatureCelsius.toFixed(1)}°C`,
  });
}

/** "0.4 s ago" from a `performance.now()`-based sample timestamp — never a
 * wall-clock date, since `getLastSampleAt()` is monotonic and
 * page-relative, not a `Date.now()` epoch value. */
export function ageText(lastSampleAt: number | null, nowMs: number): string {
  if (lastSampleAt === null) return '—';
  const seconds = Math.max(0, (nowMs - lastSampleAt) / 1000);
  return t('sensorStatus.debug.age', { s: seconds.toFixed(1) });
}

export function hexBytes(bytes: Uint8Array | null): string | null {
  if (!bytes) return null;
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

export function rawAccelText(rawAccel: GravityVector | null): string | null {
  return rawAccel ? `${rawAccel.x}, ${rawAccel.y}, ${rawAccel.z}` : null;
}

export interface DebugSnapshot {
  name: string;
  state: SensorState;
  deviceId: string | null;
  lastSampleAge: string;
  rawAccel: GravityVector | null;
  firmwareLabel: string | null;
  statusBytes: Uint8Array | null;
}

/** The plain-text summary the debug disclosure copies. */
export function debugSummaryText(snapshot: DebugSnapshot): string {
  const notAvailable = t('sensorSource.detail.notAvailable');
  return [
    `Libell ${snapshot.name} debug info`,
    `Connection state: ${snapshot.state}`,
    `Device ID: ${snapshot.deviceId ?? notAvailable}`,
    `Last sample: ${snapshot.lastSampleAge}`,
    `Raw accelerometer (x/y/z): ${rawAccelText(snapshot.rawAccel) ?? notAvailable}`,
    `Firmware: ${snapshot.firmwareLabel ?? notAvailable}`,
    `Raw status bytes: ${hexBytes(snapshot.statusBytes) ?? notAvailable}`,
  ].join('\n');
}
