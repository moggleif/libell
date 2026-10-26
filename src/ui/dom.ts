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

/** An element with its class and its text, set as text (never as markup). */
export function textElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text: string,
): HTMLElementTagNameMap[K] {
  const element = createElement(tag, className);
  element.textContent = text;
  return element;
}

export function paragraph(className: string, text: string): HTMLParagraphElement {
  return textElement('p', className, text);
}

/** A link that opens in a tab of its own, with `noopener` so the page it
 * opens cannot reach back into the app. */
export function externalLink(href: string, label: string): HTMLAnchorElement {
  const link = textElement('a', 'menu__link', label);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  return link;
}
