// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { markReopenSettings, takeReopenSettings } from './reopenSettings';

describe('reopen Settings after a reload (#345)', () => {
  beforeEach(() => sessionStorage.clear());

  it('is null on an ordinary start', () => {
    expect(takeReopenSettings()).toBeNull();
  });

  it('gives General once after a plain mark, then null again', () => {
    markReopenSettings();
    expect(takeReopenSettings()).toBe('general');
    expect(takeReopenSettings()).toBeNull();
  });

  // #615: adding, removing or switching a vehicle comes back to Vehicle.
  it('gives the section marked', () => {
    markReopenSettings('vehicle');
    expect(takeReopenSettings()).toBe('vehicle');
  });

  it('ignores a mark that names no section', () => {
    sessionStorage.setItem('libell.reopenSettings', '1');
    expect(takeReopenSettings()).toBeNull();
  });
});
