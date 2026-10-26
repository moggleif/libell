// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lazyPage, lazyPart, whenIdle, type LazyPageModule, type LazyPartDeps } from './lazyPart';

function fakeDeps(online = true) {
  const toasts: string[] = [];
  const deps = {
    isOnline: () => online,
    reload: vi.fn(),
    toast: (text: string) => void toasts.push(text),
  } satisfies LazyPartDeps;
  return { deps, toasts };
}

describe('lazyPart', () => {
  it('fetches the part once, however often it is asked for', async () => {
    const fetch = vi.fn(async () => 'help');
    const load = lazyPart(fetch, fakeDeps().deps);
    const [first, second] = await Promise.all([load(), load()]);
    expect(await load()).toBe('help');
    expect([first, second]).toEqual(['help', 'help']);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reloads onto the new version when a part has gone, online', async () => {
    const { deps, toasts } = fakeDeps(true);
    const load = lazyPart(() => Promise.reject(new Error('404')), deps);
    expect(await load()).toBeUndefined();
    expect(toasts).toEqual(['Updating to the new version…']);
    expect(deps.reload).toHaveBeenCalledTimes(1);
  });

  it('says there is no connection, and tries again on the next use, offline', async () => {
    const { deps, toasts } = fakeDeps(false);
    const fetch = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('help');
    const load = lazyPart(fetch, deps);
    expect(await load()).toBeUndefined();
    expect(toasts).toEqual(["No connection, can't check for updates"]);
    expect(deps.reload).not.toHaveBeenCalled();
    expect(await load()).toBe('help');
  });
});

describe('whenIdle', () => {
  afterEach(() => vi.useRealTimers());

  it('waits for the phone to be idle, at most two seconds', () => {
    const requestIdleCallback = vi.fn();
    const task = vi.fn();
    whenIdle(task, { requestIdleCallback, setTimeout } as unknown as Window);
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 2000 });
    expect(task).not.toHaveBeenCalled();
    requestIdleCallback.mock.calls[0]![0]();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('falls back to a short timeout where the browser has no idle callback (Safari)', () => {
    vi.useFakeTimers();
    const task = vi.fn();
    whenIdle(task, { setTimeout } as unknown as Window);
    expect(task).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(task).toHaveBeenCalledTimes(1);
  });
});

/** A page module that opens and closes from its button, like a standalone page. */
function fakePage(): LazyPageModule & { opens: number } {
  let open = false;
  const page = {
    opens: 0,
    isOpen: () => open,
    open() {
      page.opens += 1;
      open = true;
    },
    attach(button: HTMLButtonElement) {
      button.addEventListener('click', () => (open = !open));
    },
  };
  return page;
}

describe('lazyPage', () => {
  it('opens the page on a tap before it has loaded', async () => {
    const button = document.createElement('button');
    const page = fakePage();
    const lazy = lazyPage(button, async () => page, fakeDeps().deps);
    expect(lazy.isOpen()).toBe(false);
    button.click();
    await vi.waitFor(() => expect(lazy.isOpen()).toBe(true));
    expect(page.opens).toBe(1);
  });

  it('hands the button to the page once loaded, so a tap toggles it', async () => {
    const button = document.createElement('button');
    const page = fakePage();
    const lazy = lazyPage(button, async () => page, fakeDeps().deps);
    expect(await lazy.load()).toBe(page);
    button.click();
    expect(lazy.isOpen()).toBe(true);
    button.click();
    expect(lazy.isOpen()).toBe(false);
    expect(page.opens).toBe(0);
  });

  it('loads without a button', async () => {
    const page = fakePage();
    const lazy = lazyPage(null, async () => page, fakeDeps().deps);
    expect(await lazy.load()).toBe(page);
    expect(lazy.isOpen()).toBe(false);
  });
});
