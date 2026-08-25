// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorFallbackPrompt } from './sensorFallbackPrompt';
import { setLanguage, t } from './i18n';

setLanguage('en');

describe('createSensorFallbackPrompt (#134)', () => {
  it('starts hidden', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    expect(prompt.element.hidden).toBe(true);
  });

  it('shows the actionable prompt once the sensor is unavailable', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    prompt.update(true);
    expect(prompt.element.hidden).toBe(false);
  });

  it('says plainly, up front, that phone mode needs the phone lying flat', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    prompt.update(true);
    expect(prompt.element.textContent).toContain(t('sensorFallback.phoneHint'));
  });

  it('resolves (hides again) once the caller reports the state is no longer unavailable', () => {
    // unavailable -> resolved, e.g. a successful Retry or a switch to the phone.
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    prompt.update(true);
    prompt.update(false);
    expect(prompt.element.hidden).toBe(true);
  });

  it('tapping Retry calls the retry callback exactly once, one tap one attempt', () => {
    const onRetry = vi.fn();
    const prompt = createSensorFallbackPrompt(onRetry, vi.fn());
    prompt.update(true);
    const retryButton = prompt.element.querySelector('button');
    retryButton?.click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('a failed Retry leaves the prompt shown (no auto-loop, no auto-hide)', () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    prompt.update(true);
    const retryButton = prompt.element.querySelector('button');
    retryButton?.click();
    // The component itself never hides on a click alone — only a fresh
    // update(false) from the caller (a real reconnect) does.
    expect(prompt.element.hidden).toBe(false);
  });

  it('tapping "Use phone sensor" calls the fallback callback exactly once', () => {
    const onUsePhone = vi.fn();
    const prompt = createSensorFallbackPrompt(vi.fn(), onUsePhone);
    prompt.update(true);
    const buttons = prompt.element.querySelectorAll('button');
    buttons[1]?.click();
    expect(onUsePhone).toHaveBeenCalledOnce();
  });

  it("renders both action labels from the issue's own example wording", () => {
    const prompt = createSensorFallbackPrompt(vi.fn(), vi.fn());
    const labels = Array.from(prompt.element.querySelectorAll('button')).map(
      (button) => button.textContent,
    );
    expect(labels).toEqual([t('sensorFallback.retry'), t('sensorFallback.usePhone')]);
  });
});
