// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { markReopenSettings, takeReopenSettings } from './reopenSettings';

describe('reopen Settings after a reload (#345)', () => {
  beforeEach(() => sessionStorage.clear());

  it('is false on an ordinary start', () => {
    expect(takeReopenSettings()).toBe(false);
  });

  it('is true once after a mark, then false again', () => {
    markReopenSettings();
    expect(takeReopenSettings()).toBe(true);
    expect(takeReopenSettings()).toBe(false);
  });
});
