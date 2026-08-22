/**
 * "Install" affordance in the top bar.
 *
 * Chromium fires `beforeinstallprompt`, which is deferred here and replayed
 * when the button is tapped. iOS Safari has no install API at all, so there
 * the button toggles a hint describing the manual Share → "Add to Home
 * Screen" path. When the app already runs standalone (i.e. is installed),
 * the button never appears.
 */

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

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
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

  // No install API on iOS — the button shows the how-to instead.
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
