/**
 * The top bar and the bottom bar's labels: Share and the install row under
 * the bar, the translated labels, the version footer, and tapping the name
 * to check for an update.
 */
import { hasDismissedInstall, markInstallDismissed } from '../data/settingsStore';
import { attachUpdateCheck, installUpdateReload } from '../ui/appUpdate';
import { t } from '../ui/i18n';
import { setupInstallRow, type InstallOffer } from '../ui/install';
import { setupShareButton } from '../ui/share';

export interface TopBar {
  /** Re-measures the pinned top-right corner; call after it changes. */
  syncCorner(): void;
}

export function setupTopBar(
  install: InstallOffer,
  doc: Document = document,
  version = __APP_VERSION__,
): TopBar {
  setupInstallAndShare(doc, install);
  translateLabels(doc);
  const syncCorner = setupCorner(doc);
  setupVersionAndUpdate(doc, version);
  return { syncCorner };
}

function setupInstallAndShare(doc: Document, install: InstallOffer): void {
  const row = doc.querySelector<HTMLElement>('#install-row');
  const button = doc.querySelector<HTMLButtonElement>('#install-button');
  const hint = doc.querySelector<HTMLElement>('#install-hint');
  const close = doc.querySelector<HTMLButtonElement>('#install-close');
  if (row && button && hint && close) {
    setupInstallRow({ row, button, hint, close }, install, {
      isDismissed: () => hasDismissedInstall(),
      dismiss: () => markInstallDismissed(),
    });
  }
  const shareButton = doc.querySelector<HTMLButtonElement>('#share-button');
  if (shareButton) setupShareButton(shareButton);
}

function translateLabels(doc: Document): void {
  const text = doc.querySelector('#install-text');
  const installButton = doc.querySelector('#install-button');
  const installHint = doc.querySelector('#install-hint');
  if (text) text.textContent = t('install.row');
  if (installButton) installButton.textContent = t('topbar.install');
  if (installHint) installHint.textContent = t('install.hint');
  doc.querySelector('#install-close')?.setAttribute('aria-label', t('install.close'));
  doc.querySelector('#settings-button')?.setAttribute('aria-label', t('bottombar.settings'));
  doc.querySelector('#help-button')?.setAttribute('aria-label', t('bottombar.help'));
  doc.querySelector('.bottombar')?.setAttribute('aria-label', t('bottombar.label'));
}

/**
 * The pinned top-right corner (the sensor icon) sits out of the flex flow,
 * so the bar reserves its measured width or an in-flow item can slide
 * underneath it. Measured rather than assumed: the icon comes and goes.
 */
function setupCorner(doc: Document): () => void {
  const corner = doc.querySelector<HTMLElement>('#topbar-corner');
  function syncCorner(): void {
    const bar = doc.querySelector<HTMLElement>('.topbar');
    if (!bar || !corner) return;
    const width = corner.getBoundingClientRect().width;
    bar.style.setProperty('--topbar-corner', `${Math.ceil(width)}px`);
    bar.classList.toggle('topbar--has-corner', width > 0);
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
