// @vitest-environment happy-dom
//
// The screen stays on while leveling (#512): the lock is taken at start
// and taken again whenever the page comes back into view.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { keepScreenAwake } from './wakeLock';

const realNavigator = globalThis.navigator;

function withWakeLock(request: () => Promise<WakeLockSentinel>) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { wakeLock: { request } },
    configurable: true,
  });
}

/** Starts the lock and hands back its visibilitychange handler. */
function start(): (visibility: DocumentVisibilityState) => Promise<void> {
  const add = vi.spyOn(document, 'addEventListener');
  keepScreenAwake();
  const handler = add.mock.calls.find(([type]) => type === 'visibilitychange')?.[1] as
    EventListener | undefined;
  return async (visibility) => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(visibility);
    handler?.(new Event('visibilitychange'));
    await Promise.resolve();
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, 'navigator', { value: realNavigator, configurable: true });
});

describe('keepScreenAwake', () => {
  it('asks for the screen lock at once', () => {
    const request = vi.fn(() => Promise.resolve({} as WakeLockSentinel));
    withWakeLock(request);
    start();
    expect(request).toHaveBeenCalledWith('screen');
  });

  it('asks again when the page comes back after being hidden', async () => {
    const request = vi.fn(() => Promise.resolve({} as WakeLockSentinel));
    withWakeLock(request);
    const show = start();
    await Promise.resolve();
    await show('visible');
    expect(request).toHaveBeenCalledTimes(1); // still held
    await show('hidden');
    await show('visible');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('tries again on the next return after a refusal', async () => {
    const request = vi
      .fn<() => Promise<WakeLockSentinel>>()
      .mockRejectedValueOnce(new Error('low battery'))
      .mockResolvedValue({} as WakeLockSentinel);
    withWakeLock(request);
    const show = start();
    await Promise.resolve();
    await show('visible');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does nothing where the browser has no wake lock', () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    const add = vi.spyOn(document, 'addEventListener');
    keepScreenAwake();
    expect(add).not.toHaveBeenCalled();
  });
});
