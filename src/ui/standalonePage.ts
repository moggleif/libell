/**
 * A standalone full-screen page (screen-cleanup follow-up): its own single
 * history entry (so Android back/gesture closes it) and a ✕ to close
 * explicitly — never a "‹ back" that could reveal some other, unrelated
 * screen underneath. That was a real bug in an earlier version of the "?"
 * page, which shared the old ☰ Settings menu's own history depth: its back
 * button could pop through and reveal the Settings drawer by mistake.
 *
 * Used by the Settings page, the "?" info page, and the External sensor
 * page — each owns exactly one of these, fully independent of the other
 * two: none of their CONTENT or open/close state is ever shared, and none
 * of their back/close actions can ever reveal one of the others.
 *
 * The one thing genuinely shared is routing a single `popstate` event to
 * the right page: `history.back()`'s popstate is a *global* window event —
 * every open page's own listener would otherwise see it and close too,
 * even one a user never actually asked to close (in real use each page
 * covers the full screen, so at most one is ever reachable to open at
 * once — but nothing should rely on that to stay correct). A tiny
 * module-level stack of open pages fixes this: only the most recently
 * opened page reacts to the next back-navigation, same as a real
 * navigation stack, and it still only ever closes itself.
 */
import { setVisible } from './motion';
import { t } from './i18n';

export interface StandalonePage {
  /** The page element, appended to the document body. */
  element: HTMLElement;
  /** Callers append their content here. */
  body: HTMLElement;
  /** True while the page is showing — the app pauses guidance. */
  isOpen(): boolean;
  /** Open programmatically (e.g. from a warning lamp or badge tap). */
  open(): void;
  /** Close programmatically (e.g. after a successful Save). */
  close(): void;
  /** Wires a button to toggle this page open/closed. */
  attach(button: HTMLButtonElement): void;
  setTitle(title: string): void;
}

// Most-recently-opened last — only the top entry reacts to the next
// `popstate`. Each entry closes exactly the page that pushed it, nothing
// else, so this coordinates *which* page reacts without ever letting one
// page's back action affect another's content or visibility.
const openStack: (() => void)[] = [];
// Set right before this module's own `history.back()` call (from close()),
// so the one popstate it produces doesn't also pop the stack a second
// time — that call's own effect has already been applied directly.
let suppressNextPopstate = false;

window.addEventListener('popstate', () => {
  if (suppressNextPopstate) {
    suppressNextPopstate = false;
    return;
  }
  openStack.pop()?.();
});

export function createStandalonePage(initialTitle: string, onOpen?: () => void): StandalonePage {
  const page = document.createElement('div');
  page.className = 'menu-page';
  page.hidden = true;

  const header = document.createElement('div');
  header.className = 'menu-page__header';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  // Reuses the ‹ back button's styling (big, tappable) — ✕ here means
  // "close this page", the same meaning the ☰ menu's own drawer-level ✕
  // always had, never a step back into something else.
  closeButton.className = 'menu-page__back';
  closeButton.setAttribute('aria-label', t('menu.close'));
  closeButton.textContent = '✕';
  const titleEl = document.createElement('h2');
  titleEl.className = 'menu-page__title';
  titleEl.tabIndex = -1;
  titleEl.textContent = initialTitle;
  header.append(closeButton, titleEl);

  const body = document.createElement('div');
  body.className = 'menu-page__body';

  page.append(header, body);

  let open = false;

  /** Applies the closed state directly — never calls history.back() itself,
   * so this is safe to use both from a real close() and as this page's
   * popstate reaction (already-consumed history entry, nothing left to pop). */
  function applyClosed(): void {
    open = false;
    setVisible(page, false);
  }

  function show(): void {
    // Already open (e.g. the warning lamp jumps to a specific tab while
    // this page is already showing another one) — switch content via
    // onOpen without pushing a second history entry, which would desync
    // this page's single-entry close from the real history stack.
    if (open) {
      onOpen?.();
      return;
    }
    open = true;
    history.pushState({ libellStandalonePage: 1 }, '');
    openStack.push(applyClosed);
    setVisible(page, true);
    titleEl.focus();
    onOpen?.();
  }

  function close(): void {
    if (!open) return;
    applyClosed();
    const at = openStack.lastIndexOf(applyClosed);
    if (at !== -1) openStack.splice(at, 1);
    suppressNextPopstate = true;
    history.back();
  }

  closeButton.addEventListener('click', close);

  return {
    element: page,
    body,
    isOpen: () => open,
    open: show,
    close,
    attach(button) {
      button.addEventListener('click', () => (open ? close() : show()));
    },
    setTitle(title) {
      titleEl.textContent = title;
    },
  };
}
