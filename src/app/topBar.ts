/**
 * The top bar and the bottom bar's labels (#392, step 5): Install and
 * Share, the translated labels, the version footer, and tapping the name
 * to check for an update (#301).
 */
import { attachUpdateCheck, installUpdateReload } from '../ui/appUpdate';
import { t } from '../ui/i18n';
import { setupInstallButton } from '../ui/install';
import { setupShareButton } from '../ui/share';

export interface TopBar {
  /** Re-measures the pinned top-right corner; call after it changes. */
  syncCorner(): void;
}

export function setupTopBar(doc: Document = document, version = __APP_VERSION__): TopBar {
  const $ = <T extends Element>(selector: string) => doc.querySelector<T>(selector);
  const installButton = $<HTMLButtonElement>('#install-button');
  const installHint = $<HTMLElement>('#install-hint');
  if (installButton && installHint) setupInstallButton(installButton, installHint);
  const shareButton = $<HTMLButtonElement>('#share-button');
  if (shareButton) setupShareButton(shareButton);

  if (installButton) installButton.textContent = t('topbar.install');
  if (installHint) installHint.textContent = t('install.hint');
  $('#settings-button')?.setAttribute('aria-label', t('bottombar.settings'));
  $('#help-button')?.setAttribute('aria-label', t('bottombar.help'));

  // The pinned top-right corner (Install, then the sensor icon) sits out
  // of the flex flow, so the bar reserves its measured width or an
  // in-flow item can slide underneath it (#244). Measured rather than
  // assumed: the Install label's width differs per language, and the
  // corner holds one control, two, or none.
  const corner = $<HTMLElement>('#topbar-corner');
  function syncCorner(): void {
    const bar = $<HTMLElement>('.topbar');
    if (!bar || !corner) return;
    const width = corner.getBoundingClientRect().width;
    bar.style.setProperty('--topbar-corner', `${Math.ceil(width)}px`);
    bar.classList.toggle('topbar--has-corner', width > 0);
  }
  // Install comes and goes on its own schedule (the browser's prompt event
  // fires well after load; the button hides once installed), so the
  // reservation follows its `hidden` attribute.
  if (installButton) {
    new MutationObserver(syncCorner).observe(installButton, {
      attributes: true,
      attributeFilter: ['hidden'],
    });
  }
  syncCorner();

  const versionFooter = $<HTMLElement>('#app-version');
  if (versionFooter && version) versionFooter.textContent = `v${version}`;

  // A new worker taking over reloads the page into it once.
  installUpdateReload();
  const identity = $<HTMLElement>('.topbar__identity');
  if (identity) attachUpdateCheck(identity);

  return { syncCorner };
}
