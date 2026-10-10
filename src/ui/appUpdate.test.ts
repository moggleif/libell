// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { attachUpdateCheck, checkForUpdate, type UpdatableRegistration } from './appUpdate';
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
});
