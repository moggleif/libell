// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { svgEl } from './svg';

describe('svgEl (#419)', () => {
  it('creates the element in the SVG namespace', () => {
    const rect = svgEl('rect', {});
    expect(rect.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(rect.tagName.toLowerCase()).toBe('rect');
  });

  it('sets every attribute as given, hyphenated names included', () => {
    const text = svgEl('text', { x: '12', 'text-anchor': 'middle', class: 'label' });
    expect(text.getAttribute('x')).toBe('12');
    expect(text.getAttribute('text-anchor')).toBe('middle');
    expect(text.getAttribute('class')).toBe('label');
    expect(text.attributes).toHaveLength(3);
  });

  it('sets the text only when one is given, as plain text', () => {
    expect(svgEl('text', {}).textContent).toBe('');
    const text = svgEl('text', {}, '<b>Step 1</b>');
    expect(text.textContent).toBe('<b>Step 1</b>');
    expect(text.children).toHaveLength(0);
  });
});
