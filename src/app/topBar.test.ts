// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../ui/i18n';
import type { InstallOffer } from '../ui/install';

vi.mock('../ui/install', () => ({ setupInstallRow: vi.fn() }));
vi.mock('../ui/share', () => ({ setupShareButton: vi.fn() }));
vi.mock('../ui/appUpdate', () => ({ installUpdateReload: vi.fn(), attachUpdateCheck: vi.fn() }));

const { setupInstallRow } = await import('../ui/install');
const { setupShareButton } = await import('../ui/share');
const { attachUpdateCheck, installUpdateReload } = await import('../ui/appUpdate');
const { setupTopBar: setupWith } = await import('./topBar');

const offer: InstallOffer = { kind: () => null, install: () => null, onChange: () => {} };

function setupTopBar(doc: Document, version: string | null) {
  return setupWith(offer, doc, version);
}

function page() {
  document.body.replaceChildren();
  const bar = document.createElement('header');
  bar.className = 'topbar';
  const identity = document.createElement('div');
  identity.className = 'topbar__identity';
  const corner = document.createElement('div');
  corner.id = 'topbar-corner';
  bar.append(identity, corner);
  const row = document.createElement('div');
  row.id = 'install-row';
  const text = document.createElement('p');
  text.id = 'install-text';
  const install = document.createElement('button');
  install.id = 'install-button';
  const close = document.createElement('button');
  close.id = 'install-close';
  const hint = document.createElement('p');
  hint.id = 'install-hint';
  row.append(text, install, close, hint);
  const share = document.createElement('button');
  share.id = 'share-button';
  const settings = document.createElement('button');
  settings.id = 'settings-button';
  const help = document.createElement('button');
  help.id = 'help-button';
  const version = document.createElement('span');
  version.id = 'app-version';
  document.body.append(bar, row, share, settings, help, version);
  return { bar, corner, row, text, install, close, hint, share, settings, help, version, identity };
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

  it('sets up the install row, Share and the update check on their elements', () => {
    const els = page();
    setupTopBar(document, null);
    expect(setupInstallRow).toHaveBeenCalledWith(
      { row: els.row, button: els.install, hint: els.hint, close: els.close },
      offer,
      expect.objectContaining({ isDismissed: expect.any(Function) }),
    );
    expect(setupShareButton).toHaveBeenCalledWith(els.share);
    expect(installUpdateReload).toHaveBeenCalledTimes(1);
    expect(attachUpdateCheck).toHaveBeenCalledWith(els.identity);
  });

  it('translates the labels', () => {
    const els = page();
    setupTopBar(document, null);
    expect(els.text.textContent).toBe(t('install.row'));
    expect(els.install.textContent).toBe(t('topbar.install'));
    expect(els.close.getAttribute('aria-label')).toBe(t('install.close'));
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

  it('copes with a page that has none of its elements (#523)', () => {
    document.body.replaceChildren();
    const bar = setupTopBar(document, '1.0.0');
    expect(() => bar.syncCorner()).not.toThrow();
    expect(setupInstallRow).not.toHaveBeenCalled();
    expect(setupShareButton).not.toHaveBeenCalled();
    expect(attachUpdateCheck).not.toHaveBeenCalled();
    expect(installUpdateReload).toHaveBeenCalledTimes(1);
  });

  it('skips the install row without its hint, but still labels the button (#523)', () => {
    const els = page();
    els.hint.remove();
    setupTopBar(document, null);
    expect(setupInstallRow).not.toHaveBeenCalled();
    expect(els.install.textContent).toBe(t('topbar.install'));
  });
});
