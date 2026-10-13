// @vitest-environment happy-dom
//
// A setup link is read once (#512): the code leaves the address bar so a
// refresh never asks again.
import { afterEach, describe, expect, it } from 'vitest';
import { takePendingVehicleSetupCode } from './vehicleShare';

afterEach(() => {
  history.replaceState(null, '', '/');
});

describe('takePendingVehicleSetupCode', () => {
  it('returns the code from #setup= and clears it from the address', () => {
    history.replaceState(null, '', '/libell/?demo#setup=abc');
    expect(takePendingVehicleSetupCode()).toBe('abc');
    expect(location.hash).toBe('');
    expect(location.pathname + location.search).toBe('/libell/?demo');
    expect(takePendingVehicleSetupCode()).toBeNull();
  });

  it('leaves any other address untouched', () => {
    history.replaceState(null, '', '/libell/#other');
    expect(takePendingVehicleSetupCode()).toBeNull();
    expect(location.hash).toBe('#other');
  });
});
