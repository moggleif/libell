/**
 * The bottom bar's mute button: draws muted or not, and hands each
 * tap to `toggle`, which reports the new state.
 */
import { t } from './i18n';

export interface MuteButtonElements {
  button: HTMLButtonElement | null;
  /** The speaker's sound waves, shown while sound is on. */
  waves: SVGPathElement | null;
  /** The cross, shown while muted. */
  mute: SVGPathElement | null;
}

export function attachMuteButton(elements: MuteButtonElements, toggle: () => boolean): void {
  const { button, waves, mute } = elements;
  function draw(muted: boolean): void {
    button?.classList.toggle('bottombar__button--muted', muted);
    button?.setAttribute(
      'aria-label',
      t(muted ? 'bottombar.sound.unmute' : 'bottombar.sound.mute'),
    );
    waves?.toggleAttribute('hidden', muted);
    mute?.toggleAttribute('hidden', !muted);
  }
  button?.addEventListener('click', () => draw(toggle()));
  draw(false);
}
