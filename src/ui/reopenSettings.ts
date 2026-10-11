/**
 * Back to Settings after a reload (#345). Changing Appearance or Language
 * reloads the app — both decide things built once at start-up — and the
 * reload used to drop the user on the main screen, left to remember how to
 * get back to try the other choice. Theme never did, since it applies live.
 *
 * The settings form marks the reload here just before it happens, and start-
 * up takes the mark and reopens Settings › General. `sessionStorage`, not
 * `localStorage`: the mark belongs to this one reload in this one tab, and
 * must never reopen Settings on a later, ordinary start. Storage that throws
 * (private mode, blocked site data) just means the old behavior.
 */
const KEY = 'libell.reopenSettings';

export function markReopenSettings(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // No storage: the reload lands on the main screen, as before.
  }
}

/** True once after `markReopenSettings`; clears the mark. */
export function takeReopenSettings(): boolean {
  try {
    const marked = sessionStorage.getItem(KEY) === '1';
    sessionStorage.removeItem(KEY);
    return marked;
  } catch {
    return false;
  }
}
