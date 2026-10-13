/**
 * What the box's own page says, as pure functions: no DOM, so every decision
 * is tested on its own.
 */
import type { Calibration } from '../domain/calibration';
import type { GravityVector } from '../domain/leveling';
import type { SensorState } from '../sensor/orientation';
import type { BoxConnection } from './boxConnection';
import { t } from './i18n';
import { tiltDegreesText } from './tiltText';

export function headerText(connection: BoxConnection, batteryPercent: number | null): string {
  const state = t(`box.state.${connection}`);
  if (connection !== 'connected' || batteryPercent === null) return state;
  return `${state} · ${t('box.state.battery', { value: `${Math.round(batteryPercent)} %` })}`;
}

export function showsConnectButton(canConnect: boolean, connection: BoxConnection): boolean {
  return canConnect && (connection === 'notConnected' || connection === 'lost');
}

export function connectButtonText(connecting: boolean, isActive: boolean): string {
  if (connecting) return t('sensorSource.status.connecting');
  return isActive ? t('sensorFallback.retry') : t('box.connect');
}

/** Without a tilt: empty beside a position, a dash without one. */
export function tiltLineText(tilt: Calibration | null, hasPosition: boolean): string {
  if (tilt) {
    const separator = hasPosition ? ' · ' : '';
    return `${separator}${tiltDegreesText(tilt)}`;
  }
  return hasPosition ? '' : t('sensorStatus.reading', { value: '—' });
}

function celsiusText(temperatureCelsius: number | null | undefined): string {
  return temperatureCelsius == null
    ? t('sensorSource.detail.notAvailable')
    : `${temperatureCelsius.toFixed(1)}°C`;
}

export function temperatureText(temperatureCelsius: number | null | undefined): string {
  return t('sensorSource.detail.temperature', { value: celsiusText(temperatureCelsius) });
}

/** `lastSampleAt` is `performance.now()`-based (monotonic, page-relative),
 * never a wall-clock date. */
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
  temperatureCelsius: number | null | undefined;
  deviceId: string | null;
  lastSampleAge: string;
  rawAccel: GravityVector | null;
  firmwareLabel: string | null;
  statusBytes: Uint8Array | null;
}

/** The copied debug text, with the same translated labels as the rows on
 * screen (#524); the values stay raw, as a bug report needs them. */
export function debugSummaryText(snapshot: DebugSnapshot): string {
  const notAvailable = t('sensorSource.detail.notAvailable');
  return [
    `Libell ${snapshot.name} · ${t('sensorStatus.debug')}`,
    t('sensorStatus.debug.state', { value: snapshot.state }),
    temperatureText(snapshot.temperatureCelsius),
    t('sensorStatus.debug.deviceId', { value: snapshot.deviceId ?? notAvailable }),
    t('sensorStatus.debug.lastSample', { value: snapshot.lastSampleAge }),
    t('sensorStatus.debug.rawAccel', { value: rawAccelText(snapshot.rawAccel) ?? notAvailable }),
    t('sensorStatus.debug.firmwareTier', { value: snapshot.firmwareLabel ?? notAvailable }),
    t('sensorStatus.debug.rawStatusBytes', {
      value: hexBytes(snapshot.statusBytes) ?? notAvailable,
    }),
  ].join('\n');
}
