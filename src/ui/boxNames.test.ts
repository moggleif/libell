import { describe, expect, it } from 'vitest';
import { boxNames } from './boxNames';

describe('boxNames (#709)', () => {
  it('lists every supported box as the language joins things', () => {
    expect(boxNames('en')).toBe('EasyLevel and Xparkle RVS01');
    expect(boxNames('sv')).toBe('EasyLevel och Xparkle RVS01');
  });

  it('says "or" where any one of them is meant', () => {
    expect(boxNames('en', 'disjunction')).toBe('EasyLevel or Xparkle RVS01');
    expect(boxNames('de', 'disjunction')).toBe('EasyLevel oder Xparkle RVS01');
  });
});
