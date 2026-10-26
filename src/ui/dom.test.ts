// @vitest-environment happy-dom
//
// The small DOM builders every component shares (#710).
import { describe, expect, it, vi } from 'vitest';
import { button } from './dom';

describe('button', () => {
  it('is a plain button, never a form submit, with its class and label', () => {
    const element = button('menu__action', 'Save');
    expect(element.tagName).toBe('BUTTON');
    expect(element.type).toBe('button');
    expect(element.className).toBe('menu__action');
    expect(element.textContent).toBe('Save');
  });

  it('runs its click handler on each click', () => {
    const onClick = vi.fn();
    const element = button('menu__action', 'Save', onClick);
    element.click();
    element.click();
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('inside a form, a click does not submit it', () => {
    const form = document.createElement('form');
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener('submit', onSubmit);
    const element = button('menu__action', 'Save');
    form.append(element);
    element.click();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
