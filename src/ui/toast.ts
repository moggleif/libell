/**
 * Small transient confirmation ("Link copied!", "Diagnostics copied!") —
 * originally `share.ts`'s private helper, pulled out here (#133) so the
 * diagnostics page's "Copy diagnostics" confirmation reuses the exact same
 * pattern instead of a second one-off implementation.
 */

/** Fades/slides the toast in and out (#105) instead of appearing and
 * vanishing instantly; skipped under `prefers-reduced-motion`. Returns the
 * element so a caller can drop it early when a follow-up replaces it. */
export function showToast(text: string): HTMLElement {
  const toast = document.createElement('p');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = text;
  document.body.append(toast);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    window.setTimeout(() => toast.remove(), 2500);
    return toast;
  }
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback in case the transition never fires.
    window.setTimeout(() => toast.remove(), 400);
  }, 2500);
  return toast;
}
