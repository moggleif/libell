// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import {
  buildSnapshot,
  createDiagnosticsSection,
  formatDiagnosticsText,
  type DiagnosticsOptions,
} from './diagnosticsSection';
import { setLanguage, t } from './i18n';

setLanguage('en');

function makeOptions(overrides: Partial<DiagnosticsOptions> = {}): DiagnosticsOptions {
  return {
    getSensorSource: () => 'phone',
    getSensorState: () => 'granted',
    getLastSampleAt: () => null,
    getRawTilt: () => null,
    getCalibratedTilt: () => null,
    getActiveTargetName: () => null,
    getEasyLevelStatus: () => null,
    ...overrides,
  };
}

describe('diagnostics snapshot (#133, R36)', () => {
  it('shows "Normal" for the effective target when none is active', () => {
    const s = buildSnapshot(makeOptions(), '1.2.0');
    expect(s.target).toBe(t('targets.normal'));
  });

  it("shows the active target preset's own name verbatim", () => {
    const s = buildSnapshot(makeOptions({ getActiveTargetName: () => 'Shower drain' }), '1.2.0');
    expect(s.target).toBe('Shower drain');
  });

  it('reports battery/RSSI as "—" for the phone source, never a fabricated value', () => {
    const s = buildSnapshot(makeOptions({ getSensorSource: () => 'phone' }), '1.2.0');
    expect(s.battery).toBe('—');
    expect(s.rssi).toBe('—');
  });

  it('reuses sensorSourceSection\'s exact "not available yet" wording for EasyLevel before the first status notification', () => {
    const s = buildSnapshot(makeOptions({ getSensorSource: () => 'easylevel' }), '1.2.0');
    expect(s.battery).toBe(t('sensorSource.detail.notAvailable'));
    expect(s.temperature).toBe(t('sensorSource.detail.notAvailable'));
    expect(s.rssi).toBe(t('sensorSource.detail.notAvailable'));
  });

  it('shows real battery %/temperature once a status notification has arrived (#123) — RSSI stays "not available yet"', () => {
    const s = buildSnapshot(
      makeOptions({
        getSensorSource: () => 'easylevel',
        getEasyLevelStatus: () => ({
          firmwareTier: 3,
          batteryPercent: 72,
          temperatureCelsius: 19.5,
        }),
      }),
      '1.2.0',
    );
    expect(s.battery).toBe('72%');
    expect(s.temperature).toBe('19.5°C');
    expect(s.rssi).toBe(t('sensorSource.detail.notAvailable'));
  });

  it('never reads getEasyLevelStatus for the phone source, matching the existing "—" rule', () => {
    const getEasyLevelStatus = vi.fn(() => ({
      firmwareTier: 3,
      batteryPercent: 72,
      temperatureCelsius: 19.5,
    }));
    const s = buildSnapshot(
      makeOptions({ getSensorSource: () => 'phone', getEasyLevelStatus }),
      '1.2.0',
    );
    expect(s.battery).toBe('—');
    expect(s.temperature).toBe('—');
    expect(getEasyLevelStatus).not.toHaveBeenCalled();
  });

  it('shows "—" for raw/calibrated tilt and last-sample age before the first sample', () => {
    const s = buildSnapshot(makeOptions(), '1.2.0');
    expect(s.rawTilt).toBe('—');
    expect(s.calibratedTilt).toBe('—');
    expect(s.lastSampleAge).toBe('—');
  });

  it('formats a known last-sample age from performance.now()-relative timestamps', () => {
    const s = buildSnapshot(makeOptions({ getLastSampleAt: () => 1000 }), '1.2.0', 1400);
    expect(s.lastSampleAge).toBe(t('diagnostics.age', { s: '0.4' }));
  });

  it('falls back to "unknown" when the build has no version', () => {
    const s = buildSnapshot(makeOptions(), null);
    expect(s.version).toBe(t('diagnostics.version.unknown'));
  });

  it('describes the phone sample rate honestly as a description, not a measurement', () => {
    const s = buildSnapshot(makeOptions({ getSensorSource: () => 'phone' }), '1.2.0');
    expect(s.sampleRate).toBe(t('diagnostics.rate.phone'));
  });

  it('describes the EasyLevel sample rate as event-driven, not a fixed rate', () => {
    const s = buildSnapshot(makeOptions({ getSensorSource: () => 'easylevel' }), '1.2.0');
    expect(s.sampleRate).toBe(t('diagnostics.rate.easylevel'));
  });
});

describe('formatDiagnosticsText (#133)', () => {
  it('assembles every field into one plain-text block', () => {
    const text = formatDiagnosticsText(
      buildSnapshot(
        makeOptions({
          getSensorSource: () => 'easylevel',
          getSensorState: () => 'disconnected',
          getRawTilt: () => ({ rollDeg: 1.234, pitchDeg: -2.5 }),
        }),
        '1.2.0',
      ),
    );
    expect(text).toContain('Version: 1.2.0');
    expect(text).toContain('Sensor source: easylevel');
    expect(text).toContain('Connection state: disconnected');
    expect(text).toContain('Raw tilt:');
    expect(text).toContain('1.2');
    expect(text).toContain('Temperature:');
    expect(text.split('\n').length).toBeGreaterThan(5);
  });
});

describe('createDiagnosticsSection (#133) — DOM', () => {
  it('renders every field as translated rows, all in one page', () => {
    const section = createDiagnosticsSection(
      makeOptions({ getSensorSource: () => 'phone', getSensorState: () => 'granted' }),
      '1.2.0',
    );
    const text = section.element.textContent ?? '';
    expect(text).toContain(t('diagnostics.row.source', { value: 'phone' }));
    expect(text).toContain(t('diagnostics.row.state', { value: 'granted' }));
    expect(text).toContain(t('diagnostics.row.version', { value: '1.2.0' }));
  });

  it('works in phone-only mode: external-only fields show "—", not broken/undefined', () => {
    const section = createDiagnosticsSection(makeOptions(), '1.2.0');
    expect(section.element.textContent).not.toContain('undefined');
    expect(section.element.textContent).not.toContain('NaN');
    expect(section.element.textContent).toContain(t('diagnostics.row.battery', { value: '—' }));
    expect(section.element.textContent).toContain(t('diagnostics.row.temperature', { value: '—' }));
  });

  it('re-reads live values on refresh() rather than freezing at creation time', () => {
    let source: 'phone' | 'easylevel' = 'phone';
    const section = createDiagnosticsSection(
      makeOptions({ getSensorSource: () => source }),
      '1.2.0',
    );
    expect(section.element.textContent).toContain(t('diagnostics.row.source', { value: 'phone' }));
    source = 'easylevel';
    section.refresh();
    expect(section.element.textContent).toContain(
      t('diagnostics.row.source', { value: 'easylevel' }),
    );
  });

  it('"Copy diagnostics" writes the assembled text to the clipboard and confirms it', async () => {
    const writeText = vi.fn((_text: string) => Promise.resolve());
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const section = createDiagnosticsSection(
      makeOptions({ getSensorSource: () => 'phone', getSensorState: () => 'granted' }),
      '1.2.0',
    );
    const button = [...section.element.querySelectorAll('button')].find(
      (b) => b.textContent === t('diagnostics.copy'),
    )!;
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledOnce();
    const written = writeText.mock.calls[0]![0];
    expect(written).toContain('Sensor source: phone');
    expect(written).toContain('Connection state: granted');
    expect(document.body.textContent).toContain(t('diagnostics.copied'));
  });

  it('confirms the copy failed rather than pretending success when clipboard access is denied', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('denied')));
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const section = createDiagnosticsSection(makeOptions(), '1.2.0');
    const button = [...section.element.querySelectorAll('button')].find(
      (b) => b.textContent === t('diagnostics.copy'),
    )!;
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(document.body.textContent).toContain(t('diagnostics.copy.failed'));
  });
});
