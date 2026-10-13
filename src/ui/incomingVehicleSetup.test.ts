// @vitest-environment happy-dom
//
// Pins the shared-setup confirmation (R41) before it is split (#483): what
// it lists for each vehicle type, in which unit, and what each button does.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { showIncomingVehicleSetup } from './incomingVehicleSetup';
import { setLanguage, t } from './i18n';
import type { VehicleGeometry } from '../domain/vehicleShare';

setLanguage('en');

afterEach(() => {
  document.body.replaceChildren();
});

const MOTORHOME: VehicleGeometry = {
  vehicleType: 'motorhome',
  rearAxle: 'single',
  wheelbaseMm: 3800,
  trackWidthFrontMm: 1800,
  trackWidthRearMm: 1900,
  rampStepHeightsMm: [40, 80],
  rampCount: 2,
  drainPosition: 'left',
};

function show(geometry: VehicleGeometry, displayUnit: 'mm' | 'cm' = 'mm') {
  const onApply = vi.fn();
  const onDismiss = vi.fn();
  showIncomingVehicleSetup({ geometry, displayUnit, onApply, onDismiss });
  const overlay = document.querySelector<HTMLElement>('.incoming-setup')!;
  return { overlay, onApply, onDismiss };
}

function rows(overlay: HTMLElement): [string, string][] {
  const terms = [...overlay.querySelectorAll('dt')].map((dt) => dt.textContent ?? '');
  const values = [...overlay.querySelectorAll('dd')].map((dd) => dd.textContent ?? '');
  return terms.map((term, i) => [term, values[i] ?? '']);
}

describe('the incoming vehicle setup confirmation (#483)', () => {
  it('is a labelled modal dialog with a heading, an intro and a reminder', () => {
    const { overlay } = show(MOTORHOME);
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');
    const heading = overlay.querySelector('h2')!;
    expect(overlay.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.textContent).toBe(t('setup.incoming.h'));
    expect(overlay.querySelector('.incoming-setup__intro')?.textContent).toBe(
      t('setup.incoming.intro'),
    );
    expect(overlay.querySelector('.incoming-setup__reminder')?.textContent).toBe(
      t('setup.incoming.reminder'),
    );
  });

  it("lists a motorhome's whole geometry", () => {
    const { overlay } = show(MOTORHOME);
    expect(rows(overlay)).toEqual([
      [t('settings.vehicle'), t('vehicle.motorhome')],
      [t('settings.rearAxle'), t('axle.single')],
      [t('settings.wheelbase'), '3800 mm'],
      [t('settings.trackFront'), '1800 mm'],
      [t('settings.trackRear'), '1900 mm'],
      [t('settings.steps'), '40 mm, 80 mm'],
      [t('settings.rampCount'), '2'],
      [t('settings.drain'), t('drain.left')],
    ]);
  });

  it('leaves out what a caravan does not have, and names its axle-to-jockey length', () => {
    const { overlay } = show({ ...MOTORHOME, vehicleType: 'caravan', rampStepHeightsMm: [] });
    expect(rows(overlay)).toEqual([
      [t('settings.vehicle'), t('vehicle.caravan')],
      [t('settings.axle'), t('axle.single')],
      [t('settings.axleToJockey'), '3800 mm'],
      [t('settings.trackRear'), '1900 mm'],
      [t('settings.steps'), '—'],
      [t('settings.drain'), t('drain.left')],
    ]);
  });

  it('shows lengths in the unit chosen on this phone', () => {
    const { overlay } = show(MOTORHOME, 'cm');
    expect(rows(overlay)[2]).toEqual([t('settings.wheelbase'), '380 cm']);
  });

  it('applies on Apply and closes', () => {
    const { overlay, onApply, onDismiss } = show(MOTORHOME);
    const [dismiss, apply] = overlay.querySelectorAll<HTMLButtonElement>('button');
    expect(dismiss!.textContent).toBe(t('setup.incoming.dismiss'));
    expect(apply!.textContent).toBe(t('setup.incoming.apply'));
    apply!.click();
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(overlay.isConnected).toBe(false);
  });

  it('changes nothing on Dismiss, and closes', () => {
    const { overlay, onApply, onDismiss } = show(MOTORHOME);
    overlay.querySelector<HTMLButtonElement>('button')!.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
    expect(overlay.isConnected).toBe(false);
  });
});

describe('focus in the shared-setup dialog (#537)', () => {
  it('moves focus to its heading, keeps Tab inside, and gives focus back on close', () => {
    const main = document.createElement('main');
    const opener = document.createElement('button');
    main.append(opener);
    document.body.append(main);
    opener.focus();
    const { overlay } = show(MOTORHOME);
    expect(document.activeElement).toBe(overlay.querySelector('.incoming-setup__heading'));
    expect(main.hasAttribute('inert')).toBe(true);
    overlay.querySelector<HTMLButtonElement>('button')!.click();
    expect(main.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });
});
