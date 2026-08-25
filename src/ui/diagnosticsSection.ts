/**
 * Sensor diagnostics page (#133, R36): a development/support view — never
 * shown during normal leveling, reached only by a deliberate menu entry
 * (grouped with Feedback/About in `menu.ts`'s "OTHER" list). This also
 * absorbs the brief's separate "angle/engineering detail view" idea: raw
 * vs. calibrated roll/pitch is a subset of what this page already needs to
 * show, so it doesn't warrant a second screen. R8's always-visible
 * main-screen degree readout is unaffected — this is a separate, deeper
 * view opened deliberately.
 *
 * Every value is read live through seams other menu pages already use —
 * `OrientationSensor.getSource()/getState()/getLastSampleAt()` (#128/#132,
 * ADR 0014), the effective target preset (#122), and the app version
 * (`about.ts`'s `__APP_VERSION__` pattern) — nothing here is recomputed or
 * duplicated.
 *
 * Sample rate is reported, not measured: precisely timing frame arrivals
 * would need its own always-on collector, for a support-only page that is
 * opened rarely and briefly. The phone sensor's `devicemotion`/
 * `deviceorientation` fire continuously once granted — tens of Hz, per
 * `orientation.ts` — so "continuous (~60 Hz)" is an honest, simple
 * description; EasyLevel's BLE notifications are event-driven with no
 * fixed clock (the same reasoning `staleness.ts` already gives for its
 * more generous timeout), so it is described as such rather than given a
 * fabricated number.
 *
 * Battery/RSSI reuse `sensorSourceSection.ts`'s exact "not available yet"
 * wording (#123/#129) rather than a second, slightly different phrasing —
 * this page must never relax that honesty rule either.
 */
import type { Calibration, SensorSource } from '../domain/settings';
import type { SensorState } from '../sensor/orientation';
import { t } from './i18n';
import { showToast } from './toast';

export interface DiagnosticsOptions {
  /** Which source is feeding gravity readings right now (#128). */
  getSensorSource(): SensorSource;
  /** The active sensor's current state (#129). */
  getSensorState(): SensorState;
  /** `performance.now()` at the last accepted sample, or null (#132). */
  getLastSampleAt(): number | null;
  /** Raw (uncalibrated) roll/pitch, or null before the first sample. */
  getRawTilt(): Calibration | null;
  /** Calibrated roll/pitch — the same effective calibration (sensor bias +
   * vehicle zero + active target) the leveling math itself uses — or null
   * before the first sample. */
  getCalibratedTilt(): Calibration | null;
  /** The active target preset's name (#122), or null for "Normal". */
  getActiveTargetName(): string | null;
}

/** A fully-resolved, translated snapshot — the shape both the on-page rows
 * and "Copy diagnostics" render from, so the two can never drift apart. */
export interface DiagnosticsSnapshot {
  source: SensorSource;
  state: SensorState;
  sampleRate: string;
  lastSampleAge: string;
  rawTilt: string;
  calibratedTilt: string;
  target: string;
  battery: string;
  rssi: string;
  version: string;
}

function sampleRateText(source: SensorSource): string {
  return source === 'easylevel' ? t('diagnostics.rate.easylevel') : t('diagnostics.rate.phone');
}

/** "0.4 s ago" from a `performance.now()`-based sample timestamp — never
 * `calibrationAge.ts`'s wall-clock "(14 days ago)": `getLastSampleAt()` is
 * monotonic and page-relative (#132), not a `Date.now()` epoch value. */
function lastSampleAgeText(lastSampleAt: number | null, nowMs: number): string {
  if (lastSampleAt === null) return '—';
  const seconds = Math.max(0, (nowMs - lastSampleAt) / 1000);
  return t('diagnostics.age', { s: seconds.toFixed(1) });
}

function tiltText(tilt: Calibration | null): string {
  if (tilt === null) return '—';
  return `${t('diagnostics.roll')} ${tilt.rollDeg.toFixed(1)}°, ${t('diagnostics.pitch')} ${tilt.pitchDeg.toFixed(1)}°`;
}

/** Builds the translated snapshot every render (rows + copy text) works
 * from. `nowMs` is a parameter (default `performance.now()`) purely so the
 * age calculation stays testable without real timers. */
export function buildSnapshot(
  options: DiagnosticsOptions,
  version: string | null,
  nowMs: number = performance.now(),
): DiagnosticsSnapshot {
  const source = options.getSensorSource();
  // Battery/RSSI (#123/#129): always "not available" today, and only ever
  // meaningful for an external source — an em dash for the phone, exactly
  // like every other absent external-only field on this page (AC: "all
  // external-only fields simply show '—'").
  const availability = source === 'easylevel' ? t('sensorSource.detail.notAvailable') : '—';
  return {
    source,
    state: options.getSensorState(),
    sampleRate: sampleRateText(source),
    lastSampleAge: lastSampleAgeText(options.getLastSampleAt(), nowMs),
    rawTilt: tiltText(options.getRawTilt()),
    calibratedTilt: tiltText(options.getCalibratedTilt()),
    target: options.getActiveTargetName() ?? t('targets.normal'),
    battery: availability,
    rssi: availability,
    version: version ?? t('diagnostics.version.unknown'),
  };
}

/** Plain-text block for "Copy diagnostics" (#133) — suitable for pasting
 * into a bug report. Built entirely from an already-resolved snapshot, so
 * it never triggers a network call of its own (R12's no-backend
 * philosophy, same as `feedback.ts`). Exported for direct unit testing of
 * the text shape. */
export function formatDiagnosticsText(s: DiagnosticsSnapshot): string {
  return [
    'Libell diagnostics',
    `Version: ${s.version}`,
    `Sensor source: ${s.source}`,
    `Connection state: ${s.state}`,
    `Sample rate: ${s.sampleRate}`,
    `Last sample: ${s.lastSampleAge}`,
    `Raw tilt: ${s.rawTilt}`,
    `Calibrated tilt: ${s.calibratedTilt}`,
    `Target: ${s.target}`,
    `Battery: ${s.battery}`,
    `RSSI: ${s.rssi}`,
  ].join('\n');
}

export interface DiagnosticsSection {
  element: HTMLElement;
  refresh(): void;
}

/**
 * @param version the build's version string, or null when it has none —
 *   same injection pattern as `about.ts`'s `createAboutSection`, reusing
 *   the identical `__APP_VERSION__` mechanism rather than recomputing it.
 */
export function createDiagnosticsSection(
  options: DiagnosticsOptions,
  version: string | null = __APP_VERSION__,
): DiagnosticsSection {
  const body = document.createElement('div');

  const intro = document.createElement('p');
  intro.className = 'menu__text';
  intro.textContent = t('diagnostics.intro');
  body.append(intro);

  function addRow(): HTMLParagraphElement {
    const row = document.createElement('p');
    row.className = 'menu__text';
    body.append(row);
    return row;
  }
  const sourceRow = addRow();
  const stateRow = addRow();
  const rateRow = addRow();
  const ageRow = addRow();
  const rawRow = addRow();
  const calibratedRow = addRow();
  const targetRow = addRow();
  const batteryRow = addRow();
  const rssiRow = addRow();
  const versionRow = addRow();

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'menu__action';
  copyButton.textContent = t('diagnostics.copy');
  body.append(copyButton);

  function refresh(): void {
    const s = buildSnapshot(options, version);
    sourceRow.textContent = t('diagnostics.row.source', { value: s.source });
    stateRow.textContent = t('diagnostics.row.state', { value: s.state });
    rateRow.textContent = t('diagnostics.row.sampleRate', { value: s.sampleRate });
    ageRow.textContent = t('diagnostics.row.lastSampleAge', { value: s.lastSampleAge });
    rawRow.textContent = t('diagnostics.row.rawTilt', { value: s.rawTilt });
    calibratedRow.textContent = t('diagnostics.row.calibratedTilt', { value: s.calibratedTilt });
    targetRow.textContent = t('diagnostics.row.target', { value: s.target });
    batteryRow.textContent = t('diagnostics.row.battery', { value: s.battery });
    rssiRow.textContent = t('diagnostics.row.rssi', { value: s.rssi });
    versionRow.textContent = t('diagnostics.row.version', { value: s.version });
  }

  copyButton.addEventListener('click', () => {
    const text = formatDiagnosticsText(buildSnapshot(options, version));
    void navigator.clipboard.writeText(text).then(
      () => showToast(t('diagnostics.copied')),
      () => showToast(t('diagnostics.copy.failed')),
    );
  });

  refresh();
  return { element: body, refresh };
}
