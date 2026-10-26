export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

/** A plain button: `type="button"`, so it never submits a form it sits in. */
export function button(className: string, label: string, onClick?: () => void): HTMLButtonElement {
  const element = createElement('button', className);
  element.type = 'button';
  element.textContent = label;
  if (onClick) element.addEventListener('click', onClick);
  return element;
}
