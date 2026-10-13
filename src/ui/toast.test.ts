// @vitest-environment happy-dom
//
// Toasts must leave the screen on their own (#512): every consumer test
// only checks that one appears.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showActionToast, showToast } from './toast';

function reduceMotion(reduce: boolean): void {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: reduce } as MediaQueryList);
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.replaceChildren();
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((step) => {
    step(0);
    return 0;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('a plain toast', () => {
  it('slides in, then leaves when its fade ends after 2.5 s', () => {
    reduceMotion(false);
    const toast = showToast('Saved');
    expect(toast.isConnected).toBe(true);
    expect(toast.classList.contains('is-visible')).toBe(true);
    vi.advanceTimersByTime(2500);
    expect(toast.classList.contains('is-visible')).toBe(false);
    toast.dispatchEvent(new Event('transitionend'));
    expect(toast.isConnected).toBe(false);
  });

  it('leaves 400 ms after the fade starts even if the transition never ends', () => {
    reduceMotion(false);
    const toast = showToast('Saved');
    vi.advanceTimersByTime(2899);
    expect(toast.isConnected).toBe(true);
    vi.advanceTimersByTime(1);
    expect(toast.isConnected).toBe(false);
  });

  it('under reduced motion appears and leaves at 2.5 s with no fade', () => {
    reduceMotion(true);
    const toast = showToast('Saved');
    expect(toast.classList.contains('is-visible')).toBe(false);
    vi.advanceTimersByTime(2499);
    expect(toast.isConnected).toBe(true);
    vi.advanceTimersByTime(1);
    expect(toast.isConnected).toBe(false);
  });
});

describe('a toast with an action', () => {
  it('stays 6 s, then fades out and leaves', () => {
    reduceMotion(false);
    const toast = showActionToast('Saved', 'Undo', vi.fn());
    vi.advanceTimersByTime(5999);
    expect(toast.classList.contains('is-visible')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(toast.classList.contains('is-visible')).toBe(false);
    vi.advanceTimersByTime(400);
    expect(toast.isConnected).toBe(false);
  });

  it('under reduced motion leaves at 6 s with no fade', () => {
    reduceMotion(true);
    const toast = showActionToast('Saved', 'Undo', vi.fn());
    vi.advanceTimersByTime(5999);
    expect(toast.isConnected).toBe(true);
    vi.advanceTimersByTime(1);
    expect(toast.isConnected).toBe(false);
  });

  it('leaves at once and runs the action when it is tapped', () => {
    reduceMotion(false);
    const onAction = vi.fn();
    const toast = showActionToast('Saved', 'Undo', onAction);
    toast.querySelector('button')!.click();
    expect(toast.isConnected).toBe(false);
    expect(onAction).toHaveBeenCalledOnce();
  });
});
