/**
 * The full-screen dialog shared by the first-start screens and the
 * shared-setup confirmation (#710): a modal overlay named by its heading,
 * with one card. While it is open the rest of the page is inert, and closing
 * it gives focus back to whatever opened it (#537).
 */
import { createElement } from './dom';
import { holdFocus, type FocusHold } from './focusHold';

export interface DialogHeading {
  className: string;
  text: string;
}

export interface DialogOptions {
  className: string;
  cardClassName: string;
  /** The id of the heading that names the dialog. */
  headingId: string;
  /** Builds that heading. Left out when the caller draws its own, as the
   * guide does for each of its steps. */
  heading?: DialogHeading;
}

export interface Dialog {
  overlay: HTMLElement;
  card: HTMLElement;
  /** Only when `heading` was given; the caller places it in the card. */
  heading: HTMLHeadingElement | null;
  /** Puts the dialog on screen, holds focus in it and moves focus to the heading. */
  open(): void;
  close(): void;
  /** A click handler that closes the dialog, then runs `then`. */
  closeThen(then: () => void): () => void;
}

export function createDialog(
  options: DialogOptions & { heading: DialogHeading },
): Dialog & { heading: HTMLHeadingElement };
export function createDialog(options: DialogOptions): Dialog;
export function createDialog(options: DialogOptions): Dialog {
  const overlay = createElement('div', options.className);
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', options.headingId);
  const card = createElement('div', options.cardClassName);
  overlay.append(card);
  const heading = options.heading ? buildHeading(options.headingId, options.heading) : null;
  let hold: FocusHold | null = null;

  function close(): void {
    overlay.remove();
    hold?.release();
  }

  return {
    overlay,
    card,
    heading,
    open() {
      document.body.append(overlay);
      hold = holdFocus(overlay);
      heading?.focus();
    },
    close,
    closeThen: (then) => () => {
      close();
      then();
    },
  };
}

function buildHeading(id: string, { className, text }: DialogHeading): HTMLHeadingElement {
  const heading = createElement('h2', className);
  heading.id = id;
  heading.tabIndex = -1;
  heading.textContent = text;
  return heading;
}
