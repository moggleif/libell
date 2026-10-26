/**
 * Parts of the app that are not on the first screen load after it (ADR
 * 0024): when the phone is idle, or at once on first use. Every part is
 * precached, so a part that cannot load means a newer version has replaced
 * it; the app then reloads onto that version, or says it has no connection.
 */
import { t } from '../ui/i18n';
import { showToast } from '../ui/toast';

export interface LazyPartDeps {
  isOnline(): boolean;
  reload(): void;
  toast(text: string): void;
}

const browserDeps: LazyPartDeps = {
  isOnline: () => navigator.onLine,
  reload: () => location.reload(),
  toast: (text) => void showToast(text),
};

/** `fetch`, run once however often it is asked for; `undefined` when the
 * part could not load, after telling the user what happens next. */
export function lazyPart<T>(
  fetch: () => Promise<T>,
  deps: LazyPartDeps = browserDeps,
): () => Promise<T | undefined> {
  let pending: Promise<T | undefined> | undefined;
  return () =>
    (pending ??= fetch().catch(() => {
      pending = undefined;
      recover(deps);
      return undefined;
    }));
}

function recover(deps: LazyPartDeps): void {
  if (!deps.isOnline()) {
    deps.toast(t('update.offline'));
    return;
  }
  deps.toast(t('update.updating'));
  deps.reload();
}

/** Runs `task` once the phone has nothing more urgent to do, and within two
 * seconds at the latest. */
export function whenIdle(task: () => void, scope: Pick<Window, 'setTimeout'> = window): void {
  if ('requestIdleCallback' in scope) {
    (scope as Window).requestIdleCallback(() => task(), { timeout: 2000 });
  } else {
    scope.setTimeout(task, 200);
  }
}

/** A page whose module loads later, opened and closed from one button. */
export interface LazyPageModule {
  isOpen(): boolean;
  open(): void;
  attach(button: HTMLButtonElement): void;
}

export interface LazyPage<P> {
  isOpen(): boolean;
  /** Fetches and mounts the page now, if not already. */
  load(): Promise<P | undefined>;
}

/**
 * A page behind `button` whose module `fetchPage` loads and mounts. A tap
 * before it has loaded loads it and opens it; once loaded, the page's own
 * `attach` owns the button.
 */
export function lazyPage<P extends LazyPageModule>(
  button: HTMLButtonElement | null,
  fetchPage: () => Promise<P>,
  deps?: LazyPartDeps,
): LazyPage<P> {
  let page: P | undefined;
  const openOnFirstTap = (): void => void load().then((loaded) => loaded?.open());
  const load = lazyPart(async () => {
    const loaded = await fetchPage();
    page = loaded;
    if (button) {
      button.removeEventListener('click', openOnFirstTap);
      loaded.attach(button);
    }
    return loaded;
  }, deps);
  button?.addEventListener('click', openOnFirstTap);
  return { isOpen: () => page?.isOpen() ?? false, load };
}
