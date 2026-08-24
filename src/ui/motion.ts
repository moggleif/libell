/**
 * Show/hide an element with a CSS transition instead of an instant
 * `hidden` flip (issue #105). The element keeps using `hidden` for real
 * removal (accessibility, layout, click-through) — this only delays
 * setting it until the closing transition has actually finished, and
 * removes it immediately (no animation) under `prefers-reduced-motion`.
 *
 * The element's own CSS drives what "visible" looks like via the
 * `is-visible` class (opacity/transform, see styles.css); this module
 * knows nothing about *how* something animates, only *when*.
 */
/**
 * A hide call in flight arms a `transitionend` listener plus a fallback
 * timer (below) that forcibly sets `hidden` once. Tracked per element so
 * a later call on the same element — a hide while already hidden, or a
 * show that interrupts an in-flight hide — can cancel it first;
 * otherwise that stale timer fires on its own schedule and can force the
 * element hidden again after it was legitimately re-shown (field bug:
 * opening a menu page straight from closed calls render() at the
 * intermediate depth, hiding the still-hidden page and arming a no-op
 * hide's timer, which then force-closes the page ~400ms after it
 * actually opened).
 */
const pendingHide = new WeakMap<
  HTMLElement,
  { timeoutId: ReturnType<typeof setTimeout>; onEnd: (event: TransitionEvent) => void }
>();

function cancelPendingHide(el: HTMLElement): void {
  const pending = pendingHide.get(el);
  if (!pending) return;
  window.clearTimeout(pending.timeoutId);
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
  // Fallback in case no transition actually runs (e.g. the element has
  // no matching transition-property) — never leave it un-hidden.
  const timeoutId = window.setTimeout(finish, 400);
  pendingHide.set(el, { timeoutId, onEnd });
}
