/**
 * Share button in the top bar: opens the phone's native share sheet
 * (Web Share API) with the app's address. Where the API is missing
 * (mostly desktop browsers) the address is copied to the clipboard
 * instead, confirmed by a small toast.
 */
import { t } from './i18n';
import { showToast } from './toast';

/** Exported for `vehicleShare.ts` (#207), which builds a link from this
 * same base address plus an encoded fragment. */
export function appUrl(): string {
  return new URL(import.meta.env.BASE_URL, location.origin).href;
}

/** Native share sheet, falling back to a clipboard copy (then a plain
 * toast if there is no clipboard either) — the exact behavior the app
 * link button below already had, generalized so `vehicleShare.ts` can
 * share a different URL through the same path rather than duplicating it. */
export async function shareOrCopyLink(url: string, text: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Libell', text, url });
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
}

export function setupShareButton(button: HTMLButtonElement): void {
  button.setAttribute('aria-label', t('topbar.share'));
  button.title = t('topbar.share');
  button.addEventListener('click', () => {
    void shareOrCopyLink(appUrl(), t('share.text'));
  });
}
