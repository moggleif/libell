// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { t } from './i18n';
import { attachMuteButton } from './muteButton';

function elements() {
  const button = document.createElement('button');
  const ns = 'http://www.w3.org/2000/svg';
  const waves = document.createElementNS(ns, 'path') as SVGPathElement;
  const mute = document.createElementNS(ns, 'path') as SVGPathElement;
  mute.setAttribute('hidden', '');
  return { button, waves, mute };
}

describe('attachMuteButton', () => {
  it('draws the unmuted state at once', () => {
    const els = elements();
    attachMuteButton(els, () => false);
    expect(els.button.getAttribute('aria-label')).toBe(t('bottombar.sound.mute'));
    expect(els.button.classList.contains('bottombar__button--muted')).toBe(false);
    expect(els.waves.hasAttribute('hidden')).toBe(false);
    expect(els.mute.hasAttribute('hidden')).toBe(true);
  });

  it('draws whatever the toggle reports after each click', () => {
    const els = elements();
    let muted = false;
    attachMuteButton(els, () => (muted = !muted));
    els.button.click();
    expect(els.button.getAttribute('aria-label')).toBe(t('bottombar.sound.unmute'));
    expect(els.button.classList.contains('bottombar__button--muted')).toBe(true);
    expect(els.waves.hasAttribute('hidden')).toBe(true);
    expect(els.mute.hasAttribute('hidden')).toBe(false);
    els.button.click();
    expect(els.button.getAttribute('aria-label')).toBe(t('bottombar.sound.mute'));
    expect(els.waves.hasAttribute('hidden')).toBe(false);
  });

  it('tolerates missing elements, still drawing the ones that exist (#526)', () => {
    const waves = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const mute = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    attachMuteButton({ button: null, waves, mute }, () => true);
    expect(waves.hasAttribute('hidden')).toBe(false);
    expect(mute.hasAttribute('hidden')).toBe(true);
  });
});
