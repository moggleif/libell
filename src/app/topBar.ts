/**
 * The top bar and the bottom bar's labels: Install and Share, the
 * translated labels, the version footer, and tapping the name to check
 * for an update.
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
  const installButton = setupInstallAndShare(doc);
  translateLabels(doc);
  const syncCorner = setupCorner(doc, installButton);
  setupVersionAndUpdate(doc, version);
  return { syncCorner };
}

function setupInstallAndShare(doc: Document): HTMLButtonElement | null {
  const installButton = doc.querySelector<HTMLButtonElement>('#install-button');
  const installHint = doc.querySelector<HTMLElement>('#install-hint');
  if (installButton && installHint) setupInstallButton(installButton, installHint);
  const shareButton = doc.querySelector<HTMLButtonElement>('#share-button');
  if (shareButton) setupShareButton(shareButton);
  return installButton;
}

function translateLabels(doc: Document): void {
  const installButton = doc.querySelector('#install-button');
  const installHint = doc.querySelector('#install-hint');
  if (installButton) installButton.textContent = t('topbar.install');
  if (installHint) installHint.textContent = t('install.hint');
  doc.querySelector('#settings-button')?.setAttribute('aria-label', t('bottombar.settings'));
  doc.querySelector('#help-button')?.setAttribute('aria-label', t('bottombar.help'));
}

/**
 * The pinned top-right corner (Install, then the sensor icon) sits out of
 * the flex flow, so the bar reserves its measured width or an in-flow item
 * can slide underneath it. Measured rather than assumed: the Install
 * label's width differs per language, and the corner holds one control,
 * two, or none.
 */
function setupCorner(doc: Document, installButton: HTMLButtonElement | null): () => void {
  const corner = doc.querySelector<HTMLElement>('#topbar-corner');
  function syncCorner(): void {
    const bar = doc.querySelector<HTMLElement>('.topbar');
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
  return syncCorner;
}

/** The version footer, and tapping the name to check for an update. */
function setupVersionAndUpdate(doc: Document, version: string | null): void {
  const versionFooter = doc.querySelector<HTMLElement>('#app-version');
  if (versionFooter && version) versionFooter.textContent = `v${version}`;
  // A new worker taking over reloads the page into it once.
  installUpdateReload();
  const identity = doc.querySelector<HTMLElement>('.topbar__identity');
  if (identity) attachUpdateCheck(identity);
}
