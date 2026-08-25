// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createStandalonePage } from './standalonePage';

describe('createStandalonePage (screen-cleanup follow-up)', () => {
  it('starts closed, with the given title', () => {
    const page = createStandalonePage('Title');
    expect(page.isOpen()).toBe(false);
    expect(page.element.hasAttribute('hidden')).toBe(true);
    expect(page.element.querySelector('.menu-page__title')?.textContent).toBe('Title');
  });

  it('open()/close() toggle synchronously', () => {
    const page = createStandalonePage('Title');
    page.open();
    expect(page.isOpen()).toBe(true);
    expect(page.element.hasAttribute('hidden')).toBe(false);
    page.close();
    expect(page.isOpen()).toBe(false);
  });

  it('the ✕ button closes the page', () => {
    const page = createStandalonePage('Title');
    page.open();
    page.element.querySelector<HTMLButtonElement>('.menu-page__back')!.click();
    expect(page.isOpen()).toBe(false);
  });

  it('attach() toggles open/closed on alternating clicks', () => {
    const page = createStandalonePage('Title');
    const button = document.createElement('button');
    page.attach(button);
    button.click();
    expect(page.isOpen()).toBe(true);
    button.click();
    expect(page.isOpen()).toBe(false);
  });

  it('calls onOpen every time it opens, including a redundant open() while already open', () => {
    const onOpen = vi.fn();
    const page = createStandalonePage('Title', onOpen);
    page.open();
    expect(onOpen).toHaveBeenCalledOnce();
    page.open();
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(page.isOpen()).toBe(true); // still open, not toggled by the second open()
  });

  it('setTitle() updates the header text', () => {
    const page = createStandalonePage('Title');
    page.setTitle('New title');
    expect(page.element.querySelector('.menu-page__title')?.textContent).toBe('New title');
  });

  it('body is where callers append content', () => {
    const page = createStandalonePage('Title');
    const child = document.createElement('p');
    page.body.append(child);
    expect(page.element.querySelector('.menu-page__body')?.contains(child)).toBe(true);
  });

  it('opening one page never affects an unrelated closed one', () => {
    const a = createStandalonePage('A');
    const b = createStandalonePage('B');
    a.open();
    expect(a.isOpen()).toBe(true);
    expect(b.isOpen()).toBe(false);
  });

  // The bug this module-level stack fixes (screen-cleanup follow-up):
  // `history.back()`'s popstate is a *global* window event, so without
  // routing, every open page's own listener would see it and close —
  // including one the user never asked to close. Real UI can only ever
  // have one page open at a time (each covers the full screen, hiding the
  // others' trigger buttons), but nothing in this component should rely
  // on that alone to stay correct.
  it('hardware back (popstate) closes only the most recently opened page, never an earlier one', () => {
    const a = createStandalonePage('A');
    const b = createStandalonePage('B');
    a.open();
    b.open();
    expect(a.isOpen()).toBe(true);
    expect(b.isOpen()).toBe(true);

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(b.isOpen()).toBe(false);
    expect(a.isOpen()).toBe(true); // untouched by B's back-navigation

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(a.isOpen()).toBe(false);
  });
});
