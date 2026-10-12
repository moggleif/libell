/**
 * Back to Settings after a reload. Changing Appearance or Language reloads
 * the app (both are built once at start-up); the settings form marks the
 * reload here, and start-up takes the mark and reopens Settings › General.
 * `sessionStorage`, not `localStorage`: the mark belongs to this one reload
 * in this one tab and must never reopen Settings on a later, ordinary start.
 */
const KEY = 'libell.reopenSettings';

export function markReopenSettings(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // No storage (private mode, blocked site data): land on the main screen.
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
