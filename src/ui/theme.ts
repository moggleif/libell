/**
 * Applies the theme setting: 'system' follows the phone (no attribute,
 * the prefers-color-scheme media query decides), 'light'/'dark' force a
 * palette via the data-theme attribute on <html>. The browser-chrome
 * theme-color metas are synced to the palette actually in effect, read
 * from the CSS token so no hex value lives in TypeScript.
 */
import type { ThemeSetting } from '../domain/settings';

export function applyTheme(theme: ThemeSetting): void {
  const rootEl = document.documentElement;
  if (theme === 'system') delete rootEl.dataset.theme;
  else rootEl.dataset.theme = theme;
  const surface = getComputedStyle(rootEl).getPropertyValue('--surface').trim();
  if (surface) {
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = surface;
    }
  }
}

/** Re-apply when the phone's scheme flips while the app is open. */
export function followSystemTheme(getTheme: () => ThemeSetting): void {
  window
    .matchMedia('(prefers-color-scheme: light)')
    .addEventListener('change', () => applyTheme(getTheme()));
}
