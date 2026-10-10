/**
 * Getting a new deployment onto the phone (#301). The service worker is
 * registered with `registerType: 'autoUpdate'`, so a new worker activates
 * on its own — but the open page keeps running the old assets until it is
 * reloaded, and an installed app brought back from the background never
 * asks for one. Users had to close and reopen the app, sometimes twice.
 *
 * So: when a new worker takes control of an already-controlled page, the
 * page reloads once into it; the app checks again whenever it returns to
 * the foreground; and tapping the name / version in the top bar checks on
 * demand, with a toast saying what happened.
 */

import { t } from './i18n';
import { showToast } from './toast';

export type UpdateCheckResult = 'updating' | 'latest' | 'offline' | 'unsupported';

/** The slice of `ServiceWorkerRegistration` the check needs. */
export interface UpdatableRegistration {
  update(): Promise<unknown>;
  readonly installing: unknown;
  readonly waiting: unknown;
}

export interface UpdateCheckDeps {
  getRegistration: () => Promise<UpdatableRegistration | undefined>;
  isOnline: () => boolean;
}

/**
 * Asks the server for a newer service worker. 'updating' means one is on
 * its way; the controller-change reload (see `installUpdateReload`) then
 * brings the page onto it.
 */
export async function checkForUpdate(deps: UpdateCheckDeps): Promise<UpdateCheckResult> {
  if (!deps.isOnline()) return 'offline';
  const registration = await deps.getRegistration();
  if (!registration) return 'unsupported';
  try {
    await registration.update();
  } catch {
    // A failed fetch of the worker script is, to the user, no connection.
    return 'offline';
  }
  return registration.installing || registration.waiting ? 'updating' : 'latest';
}

/** The toast text for each outcome. */
export function updateMessage(result: UpdateCheckResult): string {
  switch (result) {
    case 'updating':
      return t('update.updating');
    case 'latest':
      return t('update.latest');
    case 'offline':
      return t('update.offline');
    case 'unsupported':
      return t('update.unsupported');
  }
}

function browserDeps(): UpdateCheckDeps {
  return {
    getRegistration: () =>
      'serviceWorker' in navigator
        ? navigator.serviceWorker.getRegistration()
        : Promise.resolve(undefined),
    isOnline: () => navigator.onLine,
  };
}

/**
 * Reloads once when a new worker takes over a page that already had one.
 * The very first install also fires `controllerchange` (the worker claims
 * its clients) — that page is already current, so it is left alone.
 */
export function installUpdateReload(): void {
  if (!('serviceWorker' in navigator)) return;
  const container = navigator.serviceWorker;
  let hadController = container.controller !== null;
  let reloading = false;
  container.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  // An installed app resumed from the background does not navigate, so
  // the browser never re-checks the worker on its own.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForUpdate(browserDeps());
  });
}

/** Makes `target` a button that checks for a new version on tap. */
export function attachUpdateCheck(
  target: HTMLElement,
  deps: UpdateCheckDeps = browserDeps(),
): void {
  target.setAttribute('role', 'button');
  target.tabIndex = 0;
  target.setAttribute('aria-label', t('update.check'));
  target.classList.add('topbar__identity--tappable');

  let busy = false;
  const run = async () => {
    if (busy) return;
    busy = true;
    const checking = showToast(t('update.checking'));
    try {
      const result = await checkForUpdate(deps);
      checking.remove();
      showToast(updateMessage(result));
    } finally {
      busy = false;
    }
  };
  target.addEventListener('click', () => void run());
  target.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void run();
    }
  });
}
