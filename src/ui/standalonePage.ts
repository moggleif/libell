/**
 * A standalone full-screen page: its own single history entry (so Android
 * back/gesture closes it) and a ✕ to close — never a "‹ back" that could
 * reveal some other, unrelated screen underneath (a field bug when the "?"
 * page shared the ☰ menu's history depth and popped through to its drawer).
 *
 * Each page is fully independent; the one thing shared is routing
 * `popstate`, a *global* window event that every open page's listener
 * would otherwise see. A module-level stack of open pages makes only the
 * most recently opened page react, and it only ever closes itself.
 */
import { holdFocus, type FocusHold } from './focusHold';
import { setVisible } from './motion';
import { t } from './i18n';
import { createElement } from './dom';

export interface StandalonePage {
  /** The page element, appended to the document body. */
  element: HTMLElement;
  /** Callers append their content here. */
  body: HTMLElement;
  /** True while the page is showing — the app pauses guidance. */
  isOpen(): boolean;
  /** Open programmatically (e.g. from a warning lamp or badge tap). */
  open(): void;
  /** Close programmatically (e.g. after a successful Save). `after` runs
   * once this close's own back-navigation has landed, so it can safely
   * open another page. */
  close(after?: () => void): void;
  /** Wires a button to toggle this page open/closed. */
  attach(button: HTMLButtonElement): void;
  setTitle(title: string): void;
}

// Most-recently-opened last — only the top entry reacts to the next
// `popstate`, and closes exactly the page that pushed it.
const openStack: (() => void)[] = [];
// Set right before this module's own `history.back()` call (from close()),
// so the one popstate it produces doesn't also pop the stack a second
// time — that call's own effect has already been applied directly.
let suppressNextPopstate = false;
// What to run once that suppressed popstate has landed. Deferred one
// more task, so every other popstate listener (the Classic ☰ menu's own
// depth counter) has seen this event before `after` opens anything.
let afterSuppressedPopstate: (() => void) | null = null;

window.addEventListener('popstate', () => {
  if (suppressNextPopstate) {
    suppressNextPopstate = false;
    const after = afterSuppressedPopstate;
    afterSuppressedPopstate = null;
    if (after) setTimeout(after, 0);
    return;
  }
  openStack.pop()?.();
});

/** One page's elements and whether it is open; the functions below work on
 * one. */
interface Page {
  readonly element: HTMLElement;
  readonly titleEl: HTMLHeadingElement;
  readonly onOpen: (() => void) | undefined;
  open: boolean;
  /** Keeps focus inside while open, and returns it to the opener (#537). */
  hold: FocusHold | null;
  /** Applies the closed state directly — never calls history.back() itself,
   * so this is safe to use both from a real close() and as this page's
   * popstate reaction (already-consumed history entry, nothing left to
   * pop). Made once per page: the open stack finds it by identity. */
  readonly applyClosed: () => void;
}

export function createStandalonePage(initialTitle: string, onOpen?: () => void): StandalonePage {
  const { element, closeButton, titleEl, body } = createPageElements(initialTitle);
  const page: Page = {
    element,
    titleEl,
    onOpen,
    open: false,
    hold: null,
    applyClosed: () => {
      page.open = false;
      setVisible(element, false);
      page.hold?.release();
      page.hold = null;
    },
  };
  const close = (after?: () => void): void => closePage(page, after);
  closeButton.addEventListener('click', () => close());
  return {
    element,
    body,
    isOpen: () => page.open,
    open: () => show(page),
    close,
    attach(button) {
      button.addEventListener('click', () => (page.open ? close() : show(page)));
    },
    setTitle(title) {
      titleEl.textContent = title;
    },
  };
}

function createPageElements(initialTitle: string) {
  const element = createElement('div', 'menu-page');
  element.hidden = true;
  const header = createElement('div', 'menu-page__header');
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  // Reuses the ‹ back button's styling (big, tappable); ✕ means "close this
  // page", never a step back into something else.
  closeButton.className = 'menu-page__back';
  closeButton.setAttribute('aria-label', t('menu.close'));
  closeButton.textContent = '✕';
  const titleEl = createElement('h2', 'menu-page__title');
  titleEl.tabIndex = -1;
  titleEl.textContent = initialTitle;
  header.append(closeButton, titleEl);
  const body = createElement('div', 'menu-page__body');
  element.append(header, body);
  return { element, closeButton, titleEl, body };
}

function show(page: Page): void {
  // Already open (e.g. the warning lamp jumps to a specific tab while this
  // page is already showing another one) — switch content via onOpen
  // without pushing a second history entry, which would desync this page's
  // single-entry close from the real history stack.
  if (page.open) {
    page.onOpen?.();
    return;
  }
  page.open = true;
  history.pushState({ libellStandalonePage: 1 }, '');
  openStack.push(page.applyClosed);
  setVisible(page.element, true);
  page.hold = holdFocus(page.element);
  page.titleEl.focus();
  page.onOpen?.();
}

function closePage(page: Page, after?: () => void): void {
  if (!page.open) return;
  page.applyClosed();
  const at = openStack.lastIndexOf(page.applyClosed);
  if (at !== -1) openStack.splice(at, 1);
  suppressNextPopstate = true;
  afterSuppressedPopstate = after ?? null;
  history.back();
}
