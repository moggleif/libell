// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { guardAgainstFraming } from './frameGuard';

function fakeWindow(framed: boolean, topLocation: { href: string } | null) {
  document.body.replaceChildren(document.createElement('p'));
  const self = {} as Window;
  const top = framed
    ? ({
        get location() {
          if (!topLocation) throw new Error('sandboxed');
          return topLocation;
        },
      } as unknown as Window)
    : self;
  return Object.assign(self, {
    self,
    top,
    document,
    location: { href: 'https://example.test/libell/' },
  }) as unknown as Window;
}

describe('guardAgainstFraming', () => {
  it('leaves an unframed page alone', () => {
    guardAgainstFraming(fakeWindow(false, null));
    expect(document.body.children).toHaveLength(1);
  });

  it('blanks a framed page and sends the top window to the app', () => {
    const top = { href: 'https://evil.test/' };
    guardAgainstFraming(fakeWindow(true, top));
    expect(document.body.children).toHaveLength(0);
    expect(top.href).toBe('https://example.test/libell/');
  });

  it('stays blank inside a sandboxed frame', () => {
    expect(() => guardAgainstFraming(fakeWindow(true, null))).not.toThrow();
    expect(document.body.children).toHaveLength(0);
  });
});
