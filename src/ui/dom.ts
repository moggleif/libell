/** `document.createElement` with its class names set — the one step nearly
 * every hand-built element starts with (ADR 0001: no framework). */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}
