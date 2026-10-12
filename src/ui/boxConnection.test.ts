import { describe, expect, it } from 'vitest';
import { boxConnection } from './boxConnection';

describe('boxConnection (#416)', () => {
  const rejected = () => true;
  const accepted = () => false;

  it('is not connected while another source is in use, whatever else holds', () => {
    expect(boxConnection(false, 'disconnected', rejected)).toBe('notConnected');
  });

  it('is lost once the in-use box drops, before any password verdict', () => {
    let asked = false;
    const verdict = () => (asked = true);
    expect(boxConnection(true, 'disconnected', verdict)).toBe('lost');
    expect(asked).toBe(false);
  });

  it('says password while the box in contact rejects its code, else connected', () => {
    expect(boxConnection(true, 'granted', rejected)).toBe('password');
    expect(boxConnection(true, 'granted', accepted)).toBe('connected');
  });
});
