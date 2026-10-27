/** Small transient confirmations ("Link copied!", "Diagnostics copied!"). */
import { button, createElement, paragraph } from './dom';

/** Fades/slides the toast in and out instead of appearing and
 * vanishing instantly; skipped under `prefers-reduced-motion`. Returns the
 * element so a caller can drop it early when a follow-up replaces it. */
export function showToast(text: string): HTMLElement {
  const toast = paragraph('toast', text);
  toast.setAttribute('role', 'status');
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
 * A toast with one action button ("Saved · Undo"). Stays longer
 * than a plain toast, since it asks for a decision; the action removes
 * it at once. Replacing it early is the caller's job (`remove()` on the
 * returned element).
 */
export function showActionToast(text: string, action: string, onAction: () => void): HTMLElement {
  const toast = createElement('div', 'toast toast--action');
  toast.setAttribute('role', 'status');
  const label = document.createElement('span');
  label.textContent = text;
  const actionButton = button('toast__action', action, () => {
    toast.remove();
    onAction();
  });
  toast.append(label, actionButton);
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
