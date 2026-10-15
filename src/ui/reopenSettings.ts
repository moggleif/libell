/**
 * Back to Settings after a reload. Changing Appearance or Language reloads
 * the app (both are built once at start-up), and so does adding, removing
 * or switching a vehicle (#599); the part of Settings that reloads marks it
 * here, and start-up takes the mark and reopens Settings on that section,
 * so Settings never closes by itself (#615).
 * `sessionStorage`, not `localStorage`: the mark belongs to this one reload
 * in this one tab and must never reopen Settings on a later, ordinary start.
 */
import type { MenuSection } from './menu';

const KEY = 'libell.reopenSettings';
const SECTIONS: readonly MenuSection[] = ['general', 'calibration', 'vehicle', 'ramps', 'targets'];

export function markReopenSettings(section: MenuSection = 'general'): void {
  try {
    sessionStorage.setItem(KEY, section);
  } catch {
    // No storage (private mode, blocked site data): land on the main screen.
  }
}

/** The section marked, once after `markReopenSettings`; clears the mark. */
export function takeReopenSettings(): MenuSection | null {
  try {
    const marked = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return SECTIONS.find((section) => section === marked) ?? null;
  } catch {
    return null;
  }
}
