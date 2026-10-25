/**
 * Installing Libell as an app. Chromium's `beforeinstallprompt` is deferred
 * and replayed on tap; iOS Safari has no install API, so there the offer is
 * a manual "Add to Home Screen" hint. One offer serves both the intro and
 * the install row under the top bar (#691), so a single-use prompt is never
 * replayed twice.
 */

import { isIos } from './platform';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** What tapping Install does: the browser's own dialog, or the iOS hint. */
export type InstallKind = 'prompt' | 'hint';

export interface InstallOffer {
  /** Null when there is nothing to offer. */
  kind(): InstallKind | null;
  /** Replays the browser's prompt; returns what the tap did. */
  install(): InstallKind | null;
  /** Called whenever `kind()` may have changed. */
  onChange(listener: () => void): void;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's pre-standard flag for "launched from the home screen".
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function createInstallOffer(): InstallOffer {
  const listeners: (() => void)[] = [];
  const onChange = (listener: () => void) => void listeners.push(listener);
  if (isStandalone()) return { kind: () => null, install: () => null, onChange };

  const changed = () => listeners.forEach((listener) => listener());
  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  let installed = false;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    changed();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    changed();
  });

  const kind = (): InstallKind | null => {
    if (installed) return null;
    if (deferredPrompt) return 'prompt';
    return isIos() ? 'hint' : null;
  };
  function install(): InstallKind | null {
    const now = kind();
    if (deferredPrompt) {
      // A deferred prompt is single-use; Chromium refires
      // `beforeinstallprompt` later if the user dismisses the dialog.
      void deferredPrompt.prompt();
      deferredPrompt = null;
      changed();
    }
    return now;
  }
  return { kind, install, onChange };
}

export interface InstallRowElements {
  row: HTMLElement;
  button: HTMLButtonElement;
  hint: HTMLElement;
  close: HTMLButtonElement;
}

export interface InstallDismissal {
  isDismissed(): boolean;
  dismiss(): void;
}

/**
 * The row under the top bar: shown while there is something to offer, until
 * its ✕ hides it for good. Out of the top bar, so it never crowds the lamps.
 */
export function setupInstallRow(
  els: InstallRowElements,
  offer: InstallOffer,
  dismissal: InstallDismissal,
): void {
  // Held here too, so a ✕ sticks for this visit even if storage is blocked.
  let dismissed = dismissal.isDismissed();
  function sync(): void {
    const kind = offer.kind();
    els.row.hidden = kind === null || dismissed;
    if (kind === null) els.hint.hidden = true;
  }
  els.button.addEventListener('click', () => {
    if (offer.install() === 'hint') els.hint.hidden = !els.hint.hidden;
  });
  els.close.addEventListener('click', () => {
    dismissed = true;
    dismissal.dismiss();
    sync();
  });
  offer.onChange(sync);
  sync();
}
