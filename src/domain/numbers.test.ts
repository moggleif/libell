import { describe, expect, it } from 'vitest';
import { clamp } from './numbers';

describe('clamp (#519)', () => {
  it('holds a value within its range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('leaves NaN as NaN, for the caller to decide', () => {
    expect(clamp(Number.NaN, 0, 10)).toBeNaN();
  });
});
