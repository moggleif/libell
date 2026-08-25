// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createLevelOverlay } from './levelOverlay';
import { setLanguage, t } from './i18n';

setLanguage('en');

/** Stubs matchMedia so `(prefers-reduced-motion: reduce)` resolves as given. */
function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia,
  );
}

describe('createLevelOverlay', () => {
  it('starts hidden and shows the translated "level" text and a checkmark', () => {
    const overlay = createLevelOverlay();
    expect(overlay.element.hidden).toBe(true);
    expect(overlay.element.textContent).toContain(t('main.level'));
    expect(overlay.element.querySelector('.level-overlay__mark')!.textContent).toBe('✓');
  });

  it('celebrate() shows it, then hides it again after the brief pause (#124 regression guard: unchanged without reduced motion)', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const overlay = createLevelOverlay();
    document.body.append(overlay.element);

    overlay.celebrate();
    expect(overlay.element.hidden).toBe(false);

    vi.advanceTimersByTime(2500);
    // Hiding animates (fade out) unless reduced motion is set — still
    // visible in the DOM until the transition settles or the fallback
    // timeout fires.
    expect(overlay.element.hidden).toBe(false);
    overlay.element.dispatchEvent(new Event('transitionend'));
    expect(overlay.element.hidden).toBe(true);
    vi.useRealTimers();
  });

  it('celebrate() shows and hides instantly, with no animated transition, under prefers-reduced-motion (#124)', () => {
    vi.useFakeTimers();
    stubReducedMotion(true);
    const overlay = createLevelOverlay();
    document.body.append(overlay.element);

    overlay.celebrate();
    expect(overlay.element.hidden).toBe(false);
    expect(overlay.element.classList.contains('is-visible')).toBe(true);

    vi.advanceTimersByTime(2500);
    expect(overlay.element.hidden).toBe(true); // no transitionend needed
    expect(overlay.element.classList.contains('is-visible')).toBe(false);
    vi.useRealTimers();
  });

  it('hideNow() hides immediately with no transition, even mid-celebration (state genuinely changed, e.g. no longer level)', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const overlay = createLevelOverlay();
    document.body.append(overlay.element);

    overlay.celebrate();
    expect(overlay.element.hidden).toBe(false);

    overlay.hideNow();
    expect(overlay.element.hidden).toBe(true);
    expect(overlay.element.classList.contains('is-visible')).toBe(false);

    // The celebration's own auto-hide timer must not fire later and
    // disturb anything (it was cancelled by hideNow()).
    vi.advanceTimersByTime(2500);
    expect(overlay.element.hidden).toBe(true);
    vi.useRealTimers();
  });
});
