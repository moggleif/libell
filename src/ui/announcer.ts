/**
 * A live region that is always in the page and never hidden (#537): text
 * handed to `say` is read once by a screen reader. A region that is un-hidden
 * in the same moment its text changes is often skipped, so the overlays and
 * the status line speak through one of these instead of being live
 * themselves.
 */
import { createElement } from './dom';

export interface Announcer {
  element: HTMLElement;
  /** Reads `text` once; the same text again is read again. */
  say(text: string): void;
}

/** `urgent` interrupts (role="alert"); otherwise it waits its turn. */
export function createAnnouncer(urgent = false): Announcer {
  const element = createElement('div', 'visually-hidden');
  element.setAttribute('role', urgent ? 'alert' : 'status');
  return {
    element,
    say(text) {
      // Emptied first so a repeat of the same words still changes the region.
      element.textContent = '';
      element.textContent = text;
    },
  };
}
