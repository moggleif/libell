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
export function setVisible(el: HTMLElement, visible: boolean, visibleClass = 'is-visible'): void {
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

  if (reduceMotion) {
    el.classList.remove(visibleClass);
    el.hidden = true;
    return;
  }
  el.classList.remove(visibleClass);
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    el.hidden = true;
    el.removeEventListener('transitionend', onEnd);
  };
  const onEnd = (event: TransitionEvent) => {
    if (event.target === el) finish();
  };
  el.addEventListener('transitionend', onEnd);
  // Fallback in case no transition actually runs (e.g. the element has
  // no matching transition-property) — never leave it un-hidden.
  window.setTimeout(finish, 400);
}
