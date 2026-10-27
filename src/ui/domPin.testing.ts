/**
 * For pin tests only (#710, #735): an element tree written out as indented
 * lines, so a snapshot of it shows every change a user or a screen reader
 * could notice. Each line is the tag, its attributes sorted by name (the
 * order they were set in is not something anyone sees) and its own text.
 */
export function describeDom(element: Element, depth = 0): string {
  const attributes = [...element.attributes]
    .map((attribute) => `${attribute.name}=${JSON.stringify(attribute.value)}`)
    .sort();
  const ownText = [...element.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
    .map((node) => JSON.stringify(node.textContent));
  const line = [element.tagName.toLowerCase(), ...attributes, ...ownText].join(' ');
  const children = [...element.children].map((child) => describeDom(child, depth + 1));
  return ['  '.repeat(depth) + line, ...children].join('\n');
}
