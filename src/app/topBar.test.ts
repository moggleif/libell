// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../ui/i18n';

vi.mock('../ui/install', () => ({ setupInstallButton: vi.fn() }));
vi.mock('../ui/share', () => ({ setupShareButton: vi.fn() }));
vi.mock('../ui/appUpdate', () => ({ installUpdateReload: vi.fn(), attachUpdateCheck: vi.fn() }));

const { setupInstallButton } = await import('../ui/install');
const { setupShareButton } = await import('../ui/share');
const { attachUpdateCheck, installUpdateReload } = await import('../ui/appUpdate');
const { setupTopBar } = await import('./topBar');

function page() {
  document.body.replaceChildren();
  const bar = document.createElement('header');
  bar.className = 'topbar';
  const identity = document.createElement('div');
  identity.className = 'topbar__identity';
  const corner = document.createElement('div');
  corner.id = 'topbar-corner';
  const install = document.createElement('button');
  install.id = 'install-button';
  corner.append(install);
  bar.append(identity, corner);
  const hint = document.createElement('p');
  hint.id = 'install-hint';
  const share = document.createElement('button');
  share.id = 'share-button';
  const settings = document.createElement('button');
  settings.id = 'settings-button';
  const help = document.createElement('button');
  help.id = 'help-button';
  const version = document.createElement('span');
  version.id = 'app-version';
  document.body.append(bar, hint, share, settings, help, version);
  return { bar, corner, install, hint, share, settings, help, version, identity };
}

describe('setupTopBar', () => {
  it('names the action bar in the chosen language (#535)', () => {
    page();
    const nav = document.createElement('nav');
    nav.className = 'bottombar';
    nav.setAttribute('aria-label', 'Actions');
    document.body.append(nav);
    setupTopBar(document, null);
    expect(nav.getAttribute('aria-label')).toBe(t('bottombar.label'));
  });

  beforeEach(() => vi.clearAllMocks());

  it('sets up Install, Share and the update check on their elements', () => {
    const els = page();
    setupTopBar(document, null);
    expect(setupInstallButton).toHaveBeenCalledWith(els.install, els.hint);
    expect(setupShareButton).toHaveBeenCalledWith(els.share);
    expect(installUpdateReload).toHaveBeenCalledTimes(1);
    expect(attachUpdateCheck).toHaveBeenCalledWith(els.identity);
  });

  it('translates the labels', () => {
    const els = page();
    setupTopBar(document, null);
    expect(els.install.textContent).toBe(t('topbar.install'));
    expect(els.hint.textContent).toBe(t('install.hint'));
    expect(els.settings.getAttribute('aria-label')).toBe(t('bottombar.settings'));
    expect(els.help.getAttribute('aria-label')).toBe(t('bottombar.help'));
  });

  it('shows the version, or nothing without one', () => {
    let els = page();
    setupTopBar(document, '1.2.0 – CR7');
    expect(els.version.textContent).toBe('v1.2.0 – CR7');
    els = page();
    setupTopBar(document, null);
    expect(els.version.textContent).toBe('');
  });

  it('reserves the measured width of the corner', () => {
    const els = page();
    let width = 0;
    els.corner.getBoundingClientRect = () => ({ width }) as DOMRect;
    const bar = setupTopBar(document, null);
    expect(els.bar.style.getPropertyValue('--topbar-corner')).toBe('0px');
    expect(els.bar.classList.contains('topbar--has-corner')).toBe(false);
    width = 87.2;
    bar.syncCorner();
    expect(els.bar.style.getPropertyValue('--topbar-corner')).toBe('88px');
    expect(els.bar.classList.contains('topbar--has-corner')).toBe(true);
  });

  it('re-measures when Install shows or hides', async () => {
    const els = page();
    let width = 0;
    els.corner.getBoundingClientRect = () => ({ width }) as DOMRect;
    setupTopBar(document, null);
    width = 40;
    els.install.hidden = true;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(els.bar.style.getPropertyValue('--topbar-corner')).toBe('40px');
  });

  it('copes with a page that has none of its elements (#523)', () => {
    document.body.replaceChildren();
    const bar = setupTopBar(document, '1.0.0');
    expect(() => bar.syncCorner()).not.toThrow();
    expect(setupInstallButton).not.toHaveBeenCalled();
    expect(setupShareButton).not.toHaveBeenCalled();
    expect(attachUpdateCheck).not.toHaveBeenCalled();
    expect(installUpdateReload).toHaveBeenCalledTimes(1);
  });

  it('skips Install without its hint, but still labels the button (#523)', () => {
    const els = page();
    els.hint.remove();
    setupTopBar(document, null);
    expect(setupInstallButton).not.toHaveBeenCalled();
    expect(els.install.textContent).toBe(t('topbar.install'));
  });
});
