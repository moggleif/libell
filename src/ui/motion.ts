/**
 * Show/hide an element with a CSS transition instead of an instant
 * `hidden` flip. The element keeps using `hidden` for real removal
 * (accessibility, layout, click-through) — this only delays setting it
 * until the closing transition has finished, and skips the animation
 * under `prefers-reduced-motion`.
 *
 * The element's own CSS drives what "visible" looks like via the
 * `is-visible` class; this module knows only *when*, not *how*.
 */
/**
 * A hide in flight arms a `transitionend` listener plus a fallback timer
 * that forcibly sets `hidden`. Tracked per element so a later call — a
 * redundant hide, or a show interrupting the hide — cancels it first;
 * otherwise the stale timer can force the element hidden again after it
 * was legitimately re-shown (field bug: a menu page closed itself ~400ms
 * after opening).
 */
const pendingHide = new WeakMap<
  HTMLElement,
  { timeoutId: ReturnType<typeof setTimeout>; onEnd: (event: TransitionEvent) => void }
>();

function cancelPendingHide(el: HTMLElement): void {
  const pending = pendingHide.get(el);
  if (!pending) return;
  clearTimeout(pending.timeoutId);
  el.removeEventListener('transitionend', pending.onEnd);
  pendingHide.delete(el);
}

export function setVisible(el: HTMLElement, visible: boolean, visibleClass = 'is-visible'): void {
  cancelPendingHide(el);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (visible) {
    el.hidden = false;
    if (reduceMotion) {
      el.classList.add(visibleClass);
      return;
    }
    // Force a reflow so the browser registers the pre-transition state
    // (hidden removed, class not yet added) before the class flips —
    // otherwise both changes can land in the same frame and never
    // transition at all.
    void el.offsetHeight;
    requestAnimationFrame(() => el.classList.add(visibleClass));
    return;
  }

  el.classList.remove(visibleClass);
  // Nothing to transition — and nothing to schedule — if it was already
  // hidden; a redundant hide call must stay a true no-op.
  if (el.hidden) return;

  if (reduceMotion) {
    el.hidden = true;
    return;
  }
  const finish = () => {
    el.hidden = true;
    cancelPendingHide(el);
  };
  const onEnd = (event: TransitionEvent) => {
    if (event.target === el) finish();
  };
  el.addEventListener('transitionend', onEnd);
  // Fallback in case no transition runs (no matching transition-property).
  // Global timers, not window.*: a timer still pending when a test file
  // tears down its DOM must not crash on a missing `window`.
  const timeoutId = setTimeout(finish, 400);
  pendingHide.set(el, { timeoutId, onEnd });
}
