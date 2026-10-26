import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CountingChoiceValue } from '../data/countingStore';
import { showCountingChoice, type CountingChoiceOptions } from '../ui/countingChoice';
import { browserCountingGate, decideCountingFirst, type CountingGateDeps } from './countingGate';

function setup(
  overrides: Partial<CountingGateDeps> = {},
  stored: CountingChoiceValue | null = null,
) {
  let shown: CountingChoiceOptions | null = null;
  const order: string[] = [];
  const deps: CountingGateDeps = {
    demo: false,
    refusesTracking: () => false,
    choice: () => stored,
    setOn: (on) => void order.push(on ? 'stored on' : 'stored off'),
    show: (options) => {
      order.push('shown');
      shown = options;
    },
    ...overrides,
  };
  const then = vi.fn(() => void order.push('then'));
  decideCountingFirst(deps, then);
  return { then, order, shown: () => shown };
}

describe('decideCountingFirst (#699)', () => {
  it('asks first when nothing is chosen, and the app waits for the answer', () => {
    const { then, order } = setup();
    expect(order).toEqual(['shown']);
    expect(then).not.toHaveBeenCalled();
  });

  it.each([
    [true, 'stored on'],
    [false, 'stored off'],
  ] as const)('stores the answer (%s) before the app goes on', (on, stored) => {
    const { order, shown } = setup();
    shown()!.onChoose(on);
    expect(order).toEqual(['shown', stored, 'then']);
  });

  it.each(['on', 'off'] as const)('never asks again once "%s" is chosen', (stored) => {
    const { order } = setup({}, stored);
    expect(order).toEqual(['then']);
  });

  it('does not ask when the browser asks not to be tracked, and stores nothing', () => {
    const { order } = setup({ refusesTracking: () => true });
    expect(order).toEqual(['then']);
  });

  it('does not ask in ?demo', () => {
    const { order } = setup({ demo: true });
    expect(order).toEqual(['then']);
  });
});

describe('browserCountingGate (#713)', () => {
  let stored: Map<string, string>;

  function useBrowser(nav: { globalPrivacyControl?: boolean; doNotTrack?: string } = {}) {
    stored = new Map();
    vi.stubGlobal('navigator', nav);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    });
  }

  afterEach(() => vi.unstubAllGlobals());

  it('passes ?demo through and shows the real choice screen', () => {
    useBrowser();
    expect(browserCountingGate(true).demo).toBe(true);
    expect(browserCountingGate(false).show).toBe(showCountingChoice);
  });

  it.each([
    ['Global Privacy Control', { globalPrivacyControl: true }, true],
    ['Do Not Track', { doNotTrack: '1' }, true],
    ['neither', {}, false],
  ] as const)('reads %s from the browser', (_, nav, refuses) => {
    useBrowser(nav);
    expect(browserCountingGate(false).refusesTracking()).toBe(refuses);
  });

  it('reads and stores the choice in the counting store', () => {
    useBrowser();
    const gate = browserCountingGate(false);
    expect(gate.choice()).toBeNull();
    gate.setOn(true);
    expect(gate.choice()).toBe('on');
    gate.setOn(false);
    expect(gate.choice()).toBe('off');
  });
});
