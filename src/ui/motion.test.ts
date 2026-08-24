// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { setVisible } from './motion';

/** Stubs matchMedia so `(prefers-reduced-motion: reduce)` resolves as given. */
function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia,
  );
}

describe('setVisible', () => {
  it('shows immediately and adds the visible class on the next frame', async () => {
    stubReducedMotion(false);
    const el = document.createElement('div');
    el.hidden = true;
    document.body.append(el);

    setVisible(el, true);
    expect(el.hidden).toBe(false); // unhidden synchronously, so layout/focus work right away
    expect(el.classList.contains('is-visible')).toBe(false); // not yet — else it can't transition

    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(el.classList.contains('is-visible')).toBe(true);
  });

  it('removes the class immediately but waits for the transition to hide (#105)', async () => {
    stubReducedMotion(false);
    const el = document.createElement('div');
    el.classList.add('is-visible');
    document.body.append(el);

    setVisible(el, false);
    expect(el.classList.contains('is-visible')).toBe(false);
    expect(el.hidden).toBe(false); // still in layout — the close transition is playing

    el.dispatchEvent(new Event('transitionend'));
    expect(el.hidden).toBe(true);
  });

  it('hides after the fallback timeout if no transition ever fires', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const el = document.createElement('div');
    el.classList.add('is-visible');
    document.body.append(el);

    setVisible(el, false);
    expect(el.hidden).toBe(false);
    vi.advanceTimersByTime(400);
    expect(el.hidden).toBe(true);
    vi.useRealTimers();
  });

  it('a no-op hide on an already-hidden element must not arm a timer that force-closes a later show (field bug)', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const el = document.createElement('div');
    el.hidden = true; // already hidden — e.g. menu.ts's render() calling
    // setVisible(page, false) while depth passes through 1 on its way to 2.
    document.body.append(el);

    setVisible(el, false); // a redundant hide call — must be a true no-op
    setVisible(el, true); // a real, immediately-following show

    expect(el.hidden).toBe(false);
    vi.advanceTimersByTime(400); // the stale hide's fallback timer, if armed
    expect(el.hidden).toBe(false); // must still be open — this is the bug
    vi.useRealTimers();
  });

  it('a show cancels a hide that is still mid-transition, so its fallback timer cannot fire later', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const el = document.createElement('div');
    el.classList.add('is-visible');
    document.body.append(el);

    setVisible(el, false); // starts closing — hidden stays false, timer armed
    expect(el.hidden).toBe(false);
    setVisible(el, true); // re-opened before the close transition settled

    vi.advanceTimersByTime(400); // the interrupted hide's fallback timer
    expect(el.hidden).toBe(false); // must not have been forced shut
    vi.useRealTimers();
  });

  it('skips the transition entirely under prefers-reduced-motion', () => {
    stubReducedMotion(true);
    const el = document.createElement('div');
    el.hidden = true;
    document.body.append(el);

    setVisible(el, true);
    expect(el.hidden).toBe(false);
    expect(el.classList.contains('is-visible')).toBe(true);

    setVisible(el, false);
    expect(el.hidden).toBe(true);
    expect(el.classList.contains('is-visible')).toBe(false);
  });
});
