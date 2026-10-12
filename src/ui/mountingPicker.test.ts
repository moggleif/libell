// @vitest-environment happy-dom
//
// Pins both mounting pickers (#417) through their options and the DOM they
// build: one button per side (upright box) or per placement (EasyLevel),
// what a tap stores, which choice is marked picked, and the vehicle
// drawing that shows the choice.
import { describe, expect, it, vi } from 'vitest';
import { createMountingPicker, createPlacementPicker, type BoxShape } from './mountingPicker';
import { setLanguage, t } from './i18n';
import { FACINGS, type EasyLevelPlacement, type Facing } from '../domain/mountingFacing';
import type { VehicleType } from '../domain/settings';

setLanguage('en');

function mounting(
  shape: BoxShape,
  facing: Facing | null = null,
  vehicle: VehicleType = 'motorhome',
) {
  let picked = facing;
  let type = vehicle;
  const setFacing = vi.fn((next: Facing) => {
    picked = next;
  });
  const picker = createMountingPicker({
    shape,
    getVehicleType: () => type,
    getFacing: () => picked,
    setFacing,
  });
  const button = (f: Facing): HTMLButtonElement =>
    picker.element.querySelector<HTMLButtonElement>(`.mounting-picker__button--${f}`)!;
  const drawing = (): SVGSVGElement =>
    picker.element.querySelector<SVGSVGElement>('.mounting-picker__center > svg')!;
  return {
    picker,
    setFacing,
    button,
    drawing,
    setVehicle: (next: VehicleType) => {
      type = next;
    },
  };
}

function pressed(buttons: HTMLElement[]): string[] {
  return buttons.map((b) => b.getAttribute('aria-pressed') ?? '');
}

describe('createMountingPicker', () => {
  it('has one labelled button per side, in front, right, rear, left order', () => {
    const { picker, button } = mounting('upright');
    const buttons = [...picker.element.querySelectorAll('.mounting-picker__button')];
    expect(buttons).toEqual(FACINGS.map(button));
    for (const facing of FACINGS) {
      expect(button(facing).getAttribute('aria-label')).toBe(t(`mounting.facing.${facing}`));
      expect(button(facing).title).toBe(t(`mounting.facing.${facing}`));
    }
  });

  it('turns each button’s box to point out its side', () => {
    const { button } = mounting('upright');
    const rotation = (f: Facing) =>
      button(f).querySelector('.box-glyph')!.getAttribute('transform');
    expect(FACINGS.map(rotation)).toEqual([
      'rotate(0)',
      'rotate(90)',
      'rotate(180)',
      'rotate(270)',
    ]);
  });

  it('asks where the back points for an upright box only', () => {
    const upright = mounting('upright').picker.element.querySelector<HTMLElement>('.menu__text')!;
    expect(upright.textContent).toBe(t('mounting.prompt.upright'));
    expect(upright.hidden).toBe(false);
    const flat = mounting('flat').picker.element.querySelector<HTMLElement>('.menu__text')!;
    expect(flat.hidden).toBe(true);
  });

  it('draws an upright box as a thin bar and a flat one as a squarer block', () => {
    const size = (shape: BoxShape) => {
      const body = mounting(shape).button('front').querySelector('.box-glyph__body')!;
      return [body.getAttribute('width'), body.getAttribute('height')];
    };
    expect(size('upright')).toEqual(['32', '12']);
    expect(size('flat')).toEqual(['26', '20']);
  });

  it('marks nothing picked and draws no box until a side is picked', () => {
    const { picker, drawing } = mounting('upright');
    const buttons = [...picker.element.querySelectorAll<HTMLElement>('.mounting-picker__button')];
    expect(pressed(buttons)).toEqual(['false', 'false', 'false', 'false']);
    expect(buttons.some((b) => b.classList.contains('is-picked'))).toBe(false);
    expect(drawing().querySelector('.box-glyph')).toBeNull();
  });

  it('a tap stores the side, marks it picked and draws the box turned that way', () => {
    const { picker, setFacing, button, drawing } = mounting('upright', 'front');
    button('left').click();
    expect(setFacing).toHaveBeenCalledExactlyOnceWith('left');
    const buttons = [...picker.element.querySelectorAll<HTMLElement>('.mounting-picker__button')];
    expect(pressed(buttons)).toEqual(['false', 'false', 'false', 'true']);
    expect(button('left').classList.contains('is-picked')).toBe(true);
    expect(drawing().querySelector('.box-glyph')!.getAttribute('transform')).toBe('rotate(270)');
  });

  it('draws the user’s own vehicle, with FRONT marked, and redraws on refresh', () => {
    const { picker, drawing, setVehicle } = mounting('upright', 'rear');
    expect(drawing().querySelector('.mounting-picker__glass')).not.toBeNull();
    expect(drawing().querySelector('.mounting-picker__drawbar')).toBeNull();
    expect(drawing().querySelector('.mounting-picker__front')!.textContent).toBe(
      `${t('diagram.front').toUpperCase()} ↑`,
    );
    setVehicle('caravan');
    picker.refresh();
    expect(drawing().querySelector('.mounting-picker__drawbar')).not.toBeNull();
    expect(drawing().querySelector('.mounting-picker__glass')).toBeNull();
    expect(drawing().querySelectorAll('.mounting-picker__wheel')).toHaveLength(3);
  });

  it('draws a motorhome with four wheels', () => {
    const { drawing } = mounting('upright');
    expect(drawing().querySelectorAll('.mounting-picker__wheel')).toHaveLength(4);
    expect(drawing().getAttribute('aria-hidden')).toBe('true');
  });

  it('refresh shows a facing stored outside the picker', () => {
    let stored: Facing | null = null;
    const picker = createMountingPicker({
      shape: 'flat',
      getVehicleType: () => 'motorhome',
      getFacing: () => stored,
      setFacing: () => {},
    });
    stored = 'right';
    picker.refresh();
    expect(
      picker.element.querySelector('.mounting-picker__button--right')!.getAttribute('aria-pressed'),
    ).toBe('true');
  });
});

describe('createPlacementPicker', () => {
  function placement(initial: EasyLevelPlacement | null = null) {
    let picked = initial;
    const setPlacement = vi.fn((next: EasyLevelPlacement) => {
      picked = next;
    });
    const picker = createPlacementPicker({
      getVehicleType: () => 'motorhome',
      getPlacement: () => picked,
      setPlacement,
    });
    const choice = (p: EasyLevelPlacement) => ({
      button: picker.element.querySelector<HTMLButtonElement>(`.placement-picker__button--${p}`)!,
      picture: picker.element.querySelector<HTMLButtonElement>(`.placement-picker__button--${p}`)!
        .previousElementSibling as HTMLElement,
    });
    return { picker, setPlacement, choice };
  }

  it('asks which way the lid arrow points and offers both placements, named', () => {
    const { picker, choice } = placement();
    expect(picker.element.querySelector('.menu__text')!.textContent).toBe(
      t('mounting.prompt.arrow'),
    );
    expect(choice('wide').button.textContent).toBe(t('mounting.placement.wide'));
    expect(choice('short').button.textContent).toBe(t('mounting.placement.short'));
    expect(picker.element.querySelectorAll('.placement-picker__choice')).toHaveLength(2);
  });

  it('draws the box in the vehicle, a quarter turn apart', () => {
    const { choice } = placement();
    const turn = (p: EasyLevelPlacement) =>
      choice(p).picture.querySelector('.box-glyph')!.getAttribute('transform');
    expect(turn('wide')).toBe('scale(1.15) rotate(0)');
    expect(turn('short')).toBe('scale(1.15) rotate(90)');
  });

  it('marks nothing picked until a placement is picked', () => {
    const { choice } = placement();
    expect(choice('wide').button.getAttribute('aria-pressed')).toBe('false');
    expect(choice('short').button.getAttribute('aria-pressed')).toBe('false');
  });

  it('the button stores the placement and marks it picked', () => {
    const { setPlacement, choice } = placement('wide');
    choice('short').button.click();
    expect(setPlacement).toHaveBeenCalledExactlyOnceWith('short');
    expect(choice('short').button.getAttribute('aria-pressed')).toBe('true');
    expect(choice('short').button.classList.contains('is-picked')).toBe(true);
    expect(choice('short').picture.classList.contains('is-picked')).toBe(true);
    expect(choice('wide').button.getAttribute('aria-pressed')).toBe('false');
    expect(choice('wide').picture.classList.contains('is-picked')).toBe(false);
  });

  it('the picture is a tap target too', () => {
    const { setPlacement, choice } = placement();
    choice('wide').picture.click();
    expect(setPlacement).toHaveBeenCalledExactlyOnceWith('wide');
    expect(choice('wide').button.getAttribute('aria-pressed')).toBe('true');
  });
});
