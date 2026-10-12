/**
 * Applies the theme setting: 'system' follows the phone (no attribute,
 * the prefers-color-scheme media query decides), 'light'/'dark' force a
 * palette via the data-theme attribute on <html>.
 */
import type { AppearanceSetting, ThemeSetting } from '../domain/settings';

export function applyTheme(theme: ThemeSetting): void {
  const rootEl = document.documentElement;
  if (theme === 'system') delete rootEl.dataset.theme;
  else rootEl.dataset.theme = theme;
  syncThemeColorMeta();
}

/**
 * Applies the visual preset: a `data-appearance` attribute, orthogonal to
 * `data-theme`. 'classic' is the default — no attribute.
 */
export function applyAppearance(appearance: AppearanceSetting): void {
  const rootEl = document.documentElement;
  if (appearance === 'classic') delete rootEl.dataset.appearance;
  else rootEl.dataset.appearance = appearance;
  syncThemeColorMeta();
}

/** The browser-chrome theme-color metas follow whichever palette is
 * actually in effect, read from the CSS token so no hex value lives in
 * TypeScript. */
function syncThemeColorMeta(): void {
  const rootEl = document.documentElement;
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
