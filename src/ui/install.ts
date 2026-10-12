/**
 * "Install" button in the top bar. Chromium's `beforeinstallprompt` is
 * deferred and replayed on tap; iOS Safari has no install API, so there the
 * button toggles a manual "Add to Home Screen" hint.
 */

import { isIos } from './platform';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's pre-standard flag for "launched from the home screen".
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function setupInstallButton(button: HTMLButtonElement, hint: HTMLElement): void {
  if (isStandalone()) return;

  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    button.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    button.hidden = true;
    hint.hidden = true;
  });

  if (isIos()) {
    button.hidden = false;
  }

  button.addEventListener('click', () => {
    if (deferredPrompt) {
      // A deferred prompt is single-use; Chromium refires
      // `beforeinstallprompt` later if the user dismisses the dialog.
      void deferredPrompt.prompt();
      deferredPrompt = null;
      button.hidden = true;
    } else {
      hint.hidden = !hint.hidden;
    }
  });
}
