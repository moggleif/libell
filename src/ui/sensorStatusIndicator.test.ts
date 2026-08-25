// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorStatusIndicator } from './sensorStatusIndicator';
import { setLanguage } from './i18n';

setLanguage('en');

describe('createSensorStatusIndicator (#129)', () => {
  it('is hidden while the phone is the active source (regression guard: nothing added in phone mode)', () => {
    const indicator = createSensorStatusIndicator(vi.fn());
    indicator.update('phone', 'granted');
    expect(indicator.element.hidden).toBe(true);
  });

  it('shows a neutral connected state once an external source is granted', () => {
    const indicator = createSensorStatusIndicator(vi.fn());
    indicator.update('easylevel', 'granted');
    expect(indicator.element.hidden).toBe(false);
    expect(indicator.element.classList.contains('sensor-status--connected')).toBe(true);
    expect(indicator.element.classList.contains('sensor-status--disconnected')).toBe(false);
    expect(indicator.element.getAttribute('aria-label')).toContain('connected');
  });

  it('switches to a clearly different (disconnected) state when the connection is lost', () => {
    const indicator = createSensorStatusIndicator(vi.fn());
    indicator.update('easylevel', 'granted');
    indicator.update('easylevel', 'disconnected');
    expect(indicator.element.hidden).toBe(false);
    expect(indicator.element.classList.contains('sensor-status--disconnected')).toBe(true);
    expect(indicator.element.classList.contains('sensor-status--connected')).toBe(false);
    expect(indicator.element.getAttribute('aria-label')?.toLowerCase()).toContain('lost');
  });

  it('hides again once the source falls back to the phone (explicit disconnect)', () => {
    const indicator = createSensorStatusIndicator(vi.fn());
    indicator.update('easylevel', 'disconnected');
    indicator.update('phone', 'granted');
    expect(indicator.element.hidden).toBe(true);
  });

  it('tapping the indicator navigates to the sensor settings page', () => {
    const onClick = vi.fn();
    const indicator = createSensorStatusIndicator(onClick);
    indicator.update('easylevel', 'granted');
    indicator.element.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
