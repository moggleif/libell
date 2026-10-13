// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { holdFocus } from './focusHold';

function button(text: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.textContent = text;
  return b;
}

describe('holdFocus (#537)', () => {
  let opener: HTMLButtonElement;
  let main: HTMLElement;
  let page: HTMLElement;

  beforeEach(() => {
    document.body.replaceChildren();
    main = document.createElement('main');
    opener = button('Open');
    main.append(opener);
    page = document.createElement('div');
    page.append(button('Close'));
    document.body.append(main, page);
    opener.focus();
  });

  it('makes everything but the page inert while it is open, so Tab stays inside', () => {
    const hold = holdFocus(page);
    expect(main.hasAttribute('inert')).toBe(true);
    expect(page.hasAttribute('inert')).toBe(false);
    hold.release();
    expect(main.hasAttribute('inert')).toBe(false);
  });

  it('puts focus back on the button that opened the page', () => {
    const hold = holdFocus(page);
    (page.querySelector('button') as HTMLButtonElement).focus();
    hold.release();
    expect(document.activeElement).toBe(opener);
  });

  it('lets a page opened from a held page be used, and restores both in turn', () => {
    const second = document.createElement('div');
    const inner = button('Inner');
    page.append(inner);
    document.body.append(second);
    const first = holdFocus(page);
    expect(second.hasAttribute('inert')).toBe(true);
    inner.focus();
    const nested = holdFocus(second);
    expect(second.hasAttribute('inert')).toBe(false);
    expect(page.hasAttribute('inert')).toBe(true);
    nested.release();
    expect(document.activeElement).toBe(inner);
    expect(page.hasAttribute('inert')).toBe(false);
    expect(second.hasAttribute('inert')).toBe(true);
    first.release();
    expect(second.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('never makes inert the container the page itself lives in', () => {
    const wrapper = document.createElement('div');
    const nestedPage = document.createElement('div');
    wrapper.append(nestedPage);
    document.body.append(wrapper);
    const hold = holdFocus(nestedPage);
    expect(wrapper.hasAttribute('inert')).toBe(false);
    hold.release();
  });
});
