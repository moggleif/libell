// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  attachUpdateCheck,
  checkForUpdate,
  installUpdateReload,
  type UpdatableRegistration,
  RECHECK_AFTER_OPEN_MS,
  UPDATE_CHECK_INTERVAL_MS,
} from './appUpdate';
import { setLanguage, t } from './i18n';

setLanguage('en');

function registration(afterUpdate: { installing?: unknown; waiting?: unknown }, fails = false) {
  const reg: UpdatableRegistration & { installing: unknown; waiting: unknown } = {
    installing: null,
    waiting: null,
    update: vi.fn(async () => {
      if (fails) throw new Error('network');
      reg.installing = afterUpdate.installing ?? null;
      reg.waiting = afterUpdate.waiting ?? null;
    }),
  };
  return reg;
}

const deps = (reg: UpdatableRegistration | undefined, online = true) => ({
  getRegistration: () => Promise.resolve(reg),
  isOnline: () => online,
});

describe('checkForUpdate (#301)', () => {
  it('reports an update on its way when a new worker installs', async () => {
    const reg = registration({ installing: {} });
    expect(await checkForUpdate(deps(reg))).toBe('updating');
    expect(reg.update).toHaveBeenCalledOnce();
  });

  it('counts a waiting worker as an update too', async () => {
    expect(await checkForUpdate(deps(registration({ waiting: {} })))).toBe('updating');
  });

  it('reports the latest version when nothing new is found', async () => {
    expect(await checkForUpdate(deps(registration({})))).toBe('latest');
  });

  it('does not try without a connection', async () => {
    const reg = registration({});
    expect(await checkForUpdate(deps(reg, false))).toBe('offline');
    expect(reg.update).not.toHaveBeenCalled();
  });

  it('treats a failed worker fetch as no connection', async () => {
    expect(await checkForUpdate(deps(registration({}, true)))).toBe('offline');
  });

  it('reports unsupported when no worker is registered', async () => {
    expect(await checkForUpdate(deps(undefined))).toBe('unsupported');
  });

  it('reports unsupported, rather than rejecting, when the lookup fails (#542)', async () => {
    const failing = {
      getRegistration: () => Promise.reject(new Error('blocked')),
      isOnline: () => true,
    };
    expect(await checkForUpdate(failing)).toBe('unsupported');
  });
});

describe('attachUpdateCheck (#301)', () => {
  it('makes the target a labelled, focusable button', () => {
    const el = document.createElement('div');
    attachUpdateCheck(el, deps(registration({})));
    expect(el.getAttribute('role')).toBe('button');
    expect(el.tabIndex).toBe(0);
    expect(el.getAttribute('aria-label')).toBe(t('update.check'));
  });

  it('shows the outcome as a toast on tap', async () => {
    const el = document.createElement('div');
    attachUpdateCheck(el, deps(registration({})));
    el.click();
    await vi.waitFor(() =>
      expect([...document.querySelectorAll('.toast')].map((n) => n.textContent)).toContain(
        t('update.latest'),
      ),
    );
    expect([...document.querySelectorAll('.toast')].map((n) => n.textContent)).not.toContain(
      t('update.checking'),
    );
  });

  it('still shows a result when the worker lookup fails (#542)', async () => {
    const el = document.createElement('div');
    attachUpdateCheck(el, {
      getRegistration: () => Promise.reject(new Error('blocked')),
      isOnline: () => true,
    });
    el.click();
    await vi.waitFor(() =>
      expect([...document.querySelectorAll('.toast')].map((n) => n.textContent)).toContain(
        t('update.unsupported'),
      ),
    );
  });
});

describe('installUpdateReload (#512)', () => {
  const realNavigator = globalThis.navigator;
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'navigator', { value: realNavigator, configurable: true });
  });

  function install(controller: object | null) {
    const container = Object.assign(new EventTarget(), { controller });
    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: container, onLine: true },
      configurable: true,
    });
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    installUpdateReload();
    const change = () => container.dispatchEvent(new Event('controllerchange'));
    return { reload, change };
  }

  it('leaves the very first install alone, and reloads once for the next worker', () => {
    const { reload, change } = install(null);
    change();
    expect(reload).not.toHaveBeenCalled();
    change();
    expect(reload).toHaveBeenCalledOnce();
    change();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('checks quietly on return to the foreground, even when the lookup fails (#542)', async () => {
    const getRegistration = vi.fn(() => Promise.reject(new Error('blocked')));
    const container = Object.assign(new EventTarget(), { controller: null, getRegistration });
    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: container, onLine: true },
      configurable: true,
    });
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    installUpdateReload();
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off('unhandledRejection', unhandled);
    expect(getRegistration).toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('checks quietly every ten minutes while the app stays open (#746)', async () => {
    vi.useFakeTimers();
    try {
      const update = vi.fn(async () => {});
      const getRegistration = vi.fn(async () => ({ update, installing: null, waiting: null }));
      const container = Object.assign(new EventTarget(), { controller: {}, getRegistration });
      Object.defineProperty(globalThis, 'navigator', {
        value: { serviceWorker: container, onLine: true },
        configurable: true,
      });
      const toasts = document.querySelectorAll('.toast').length;
      installUpdateReload();
      await vi.advanceTimersByTimeAsync(RECHECK_AFTER_OPEN_MS);
      update.mockClear();
      await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL_MS - RECHECK_AFTER_OPEN_MS - 1);
      expect(update).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(update).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL_MS);
      expect(update).toHaveBeenCalledTimes(2);
      expect(document.querySelectorAll('.toast')).toHaveLength(toasts);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('checks again half a minute after opening and after each return, for a slow network (#746)', async () => {
    vi.useFakeTimers();
    try {
      const update = vi.fn(async () => {});
      const getRegistration = vi.fn(async () => ({ update, installing: null, waiting: null }));
      const container = Object.assign(new EventTarget(), { controller: {}, getRegistration });
      Object.defineProperty(globalThis, 'navigator', {
        value: { serviceWorker: container, onLine: true },
        configurable: true,
      });
      // Only this install's listener: earlier tests' listeners stay on the document.
      const listen = vi.spyOn(document, 'addEventListener');
      installUpdateReload();
      const onVisible = listen.mock.calls.find(([type]) => type === 'visibilitychange')![1];
      listen.mockRestore();
      await vi.advanceTimersByTimeAsync(RECHECK_AFTER_OPEN_MS - 1);
      expect(update).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(1);
      expect(update).toHaveBeenCalledTimes(2);
      (onVisible as EventListener)(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
      expect(update).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(RECHECK_AFTER_OPEN_MS);
      expect(update).toHaveBeenCalledTimes(4);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('leaves the timed check to the foreground return while hidden (#746)', async () => {
    vi.useFakeTimers();
    const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    try {
      const getRegistration = vi.fn(async () => undefined);
      const container = Object.assign(new EventTarget(), { controller: {}, getRegistration });
      Object.defineProperty(globalThis, 'navigator', {
        value: { serviceWorker: container, onLine: true },
        configurable: true,
      });
      installUpdateReload();
      await vi.advanceTimersByTimeAsync(0);
      getRegistration.mockClear();
      await vi.advanceTimersByTimeAsync(UPDATE_CHECK_INTERVAL_MS);
      expect(getRegistration).not.toHaveBeenCalled();
    } finally {
      hidden.mockRestore();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('reloads on the first change when a worker already controlled the page', () => {
    const { reload, change } = install({});
    change();
    expect(reload).toHaveBeenCalledOnce();
  });
});
