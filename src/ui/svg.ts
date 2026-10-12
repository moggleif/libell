/**
 * The one helper every SVG drawing builds its elements with: an
 * element in the SVG namespace with its attributes set, and optionally
 * its text. DOM is built element by element, never from markup (ADR 0001).
 */
const SVG_NS = 'http://www.w3.org/2000/svg';

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
  text?: string,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
