/**
 * Share button in the top bar: opens the phone's native share sheet
 * (Web Share API) with the app's address. Where the API is missing
 * (mostly desktop browsers) the address is copied to the clipboard
 * instead, confirmed by a small toast.
 */
import { t } from './i18n';

function appUrl(): string {
  return new URL(import.meta.env.BASE_URL, location.origin).href;
}

function showToast(text: string): void {
  const toast = document.createElement('p');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = text;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2500);
}

export function setupShareButton(button: HTMLButtonElement): void {
  button.setAttribute('aria-label', t('topbar.share'));
  button.title = t('topbar.share');
  button.addEventListener('click', async () => {
    const url = appUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Libell', text: t('share.text'), url });
      } catch {
        // The user closed the share sheet — nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(t('share.copied'));
    } catch {
      // No clipboard either — show the address so it can be noted down.
      showToast(url);
    }
  });
}
