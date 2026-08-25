// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorStatusIndicator } from './sensorStatusIndicator';
import { setLanguage } from './i18n';

setLanguage('en');

describe('createSensorStatusIndicator (#129, screen-cleanup follow-up)', () => {
  it('is hidden entirely when Web Bluetooth is unsupported — never a silently broken option', () => {
    const indicator = createSensorStatusIndicator(false, false, vi.fn());
    indicator.update('easylevel', 'granted');
    expect(indicator.element.hidden).toBe(true);
  });

  it('shows a neutral "tap to connect" state while the phone is the active source, once Web Bluetooth exists', () => {
    const indicator = createSensorStatusIndicator(true, false, vi.fn());
    expect(indicator.element.hidden).toBe(false);
    indicator.update('phone', 'granted');
    expect(indicator.element.hidden).toBe(false);
    expect(indicator.element.classList.contains('sensor-status--connected')).toBe(false);
    expect(indicator.element.classList.contains('sensor-status--disconnected')).toBe(false);
    expect(indicator.element.getAttribute('aria-label')).toContain('tap to connect');
  });

  it('shows a distinct connected state once an external source is granted', () => {
    const indicator = createSensorStatusIndicator(true, false, vi.fn());
    indicator.update('easylevel', 'granted');
    expect(indicator.element.classList.contains('sensor-status--connected')).toBe(true);
    expect(indicator.element.classList.contains('sensor-status--disconnected')).toBe(false);
    expect(indicator.element.getAttribute('aria-label')).toContain('connected');
  });

  it('switches to a clearly different (disconnected) state when the connection is lost', () => {
    const indicator = createSensorStatusIndicator(true, false, vi.fn());
    indicator.update('easylevel', 'granted');
    indicator.update('easylevel', 'disconnected');
    expect(indicator.element.classList.contains('sensor-status--disconnected')).toBe(true);
    expect(indicator.element.classList.contains('sensor-status--connected')).toBe(false);
    expect(indicator.element.getAttribute('aria-label')?.toLowerCase()).toContain('lost');
  });

  it('returns to the neutral "tap to connect" state, not hidden, once the source falls back to the phone', () => {
    const indicator = createSensorStatusIndicator(true, false, vi.fn());
    indicator.update('easylevel', 'disconnected');
    indicator.update('phone', 'granted');
    expect(indicator.element.hidden).toBe(false);
    expect(indicator.element.classList.contains('sensor-status--connected')).toBe(false);
    expect(indicator.element.classList.contains('sensor-status--disconnected')).toBe(false);
  });

  it('tapping the indicator navigates to the External sensor page — the only entry point now (screen-cleanup follow-up)', () => {
    const onClick = vi.fn();
    const indicator = createSensorStatusIndicator(true, false, onClick);
    indicator.update('phone', 'granted');
    indicator.element.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  describe('guideOnly (R39, iOS without Web Bluetooth)', () => {
    it('stays visible even without Web Bluetooth, unlike the plain unsupported case', () => {
      const indicator = createSensorStatusIndicator(false, true, vi.fn());
      indicator.update('phone', 'granted');
      expect(indicator.element.hidden).toBe(false);
    });

    it('always shows the guide label, ignoring source/state — there is no live sensor behind it', () => {
      const indicator = createSensorStatusIndicator(false, true, vi.fn());
      indicator.update('easylevel', 'disconnected');
      expect(indicator.element.getAttribute('aria-label')).toContain('setup guide');
      expect(indicator.element.classList.contains('sensor-status--connected')).toBe(false);
      expect(indicator.element.classList.contains('sensor-status--disconnected')).toBe(false);
    });

    it('tapping it still fires onClick, opening the guide page instead of a connect flow', () => {
      const onClick = vi.fn();
      const indicator = createSensorStatusIndicator(false, true, onClick);
      indicator.element.click();
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});
