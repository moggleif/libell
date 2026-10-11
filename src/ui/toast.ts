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

/**
 * A toast with one action button (#328: "Saved · Undo"). Stays longer
 * than a plain toast, since it asks for a decision; the action removes
 * it at once. Replacing it early is the caller's job (`remove()` on the
 * returned element).
 */
export function showActionToast(text: string, action: string, onAction: () => void): HTMLElement {
  const toast = document.createElement('div');
  toast.className = 'toast toast--action';
  toast.setAttribute('role', 'status');
  const label = document.createElement('span');
  label.textContent = text;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toast__action';
  button.textContent = action;
  button.addEventListener('click', () => {
    toast.remove();
    onAction();
  });
  toast.append(label, button);
  document.body.append(toast);

  const hide = (): void => {
    toast.classList.remove('is-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    window.setTimeout(() => toast.remove(), 400);
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setTimeout(() => toast.remove(), 6000);
    return toast;
  }
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(hide, 6000);
  return toast;
}
