import { describe, expect, it } from 'vitest';

/**
 * Smoke test proving the unit-test harness runs in CI. Real behavior tests
 * arrive test-first with their feature issues (see docs/02-REQUIREMENTS.md).
 */
describe('test harness', () => {
  it('runs', () => {
    expect(2 + 2).toBe(4);
  });
});
