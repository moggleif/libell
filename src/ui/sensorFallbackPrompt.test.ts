// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorFallbackPrompt } from './sensorFallbackPrompt';
import { setLanguage, t } from './i18n';

setLanguage('en');

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function buttons(element: HTMLElement): HTMLButtonElement[] {
  return Array.from(element.querySelectorAll('button'));
}

describe('createSensorFallbackPrompt (#134, #313)', () => {
  it('starts hidden', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    expect(prompt.element.hidden).toBe(true);
  });

  it('shows the actionable prompt once the sensor is unavailable', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    prompt.update(true, true);
    expect(prompt.element.hidden).toBe(false);
  });

  it('says it is trying again on its own while a silent retry can still work (#313)', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    prompt.update(true, true);
    expect(prompt.element.textContent).toContain(t('sensorFallback.lost'));
    expect(prompt.element.textContent).toContain(t('sensorFallback.autoRetry'));
  });

  it('never promises an automatic retry that cannot work after a restart (#313)', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    prompt.update(true, false);
    expect(prompt.element.textContent).toContain(t('sensorFallback.connect'));
    expect(prompt.element.textContent).toContain(t('sensorFallback.pick'));
    expect(prompt.element.textContent).not.toContain(t('sensorFallback.autoRetry'));
  });

  it('says nothing about the phone lying flat, and has no sensor-page button (#313)', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    prompt.update(true, true);
    expect(prompt.element.textContent).not.toContain('flat');
    expect(prompt.element.textContent).not.toContain(t('pose.openSensorPage'));
  });

  it('resolves (hides again) once the caller reports the state is no longer unavailable', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    prompt.update(true, true);
    prompt.update(false, true);
    expect(prompt.element.hidden).toBe(true);
  });

  it('tapping Reconnect calls the retry callback exactly once, one tap one attempt', () => {
    const onRetry = vi.fn(() => Promise.resolve());
    const prompt = createSensorFallbackPrompt(onRetry, vi.fn());
    prompt.update(true, true);
    buttons(prompt.element)[0]?.click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('a failed Reconnect leaves the prompt shown and says what to check (#313)', async () => {
    const prompt = createSensorFallbackPrompt(() => Promise.resolve(), vi.fn());
    prompt.update(true, true);
    buttons(prompt.element)[0]?.click();
    await flush();
    prompt.update(true, true);
    expect(prompt.element.hidden).toBe(false);
    expect(prompt.element.textContent).toContain(t('sensorFallback.notFound'));
    // A later loss starts fresh.
    prompt.update(false, true);
    prompt.update(true, true);
    expect(prompt.element.textContent).not.toContain(t('sensorFallback.notFound'));
  });

  it('tapping "Use the phone instead" calls the fallback callback exactly once', () => {
    const onUsePhone = vi.fn();
    const prompt = createSensorFallbackPrompt(vi.fn(), onUsePhone);
    prompt.update(true, true);
    buttons(prompt.element)[1]?.click();
    expect(onUsePhone).toHaveBeenCalledOnce();
  });

  it('has exactly one primary action and one quiet link', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    const [retry, usePhone, ...rest] = buttons(prompt.element);
    expect(retry?.textContent).toBe(t('sensorFallback.retry'));
    expect(usePhone?.textContent).toBe(t('sensorFallback.usePhone'));
    expect(usePhone?.classList.contains('link-button')).toBe(true);
    expect(rest).toHaveLength(0);
  });
});
