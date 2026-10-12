/**
 * "How is the box mounted?" by tapping a side of the vehicle: a top-down
 * picture of the user's own vehicle with one button at each of its four
 * sides. Each button shows the box turned so its reference side (the
 * Xparkle box's back, the EasyLevel box's arrow) points out to that side.
 * The box drawn inside the vehicle follows the choice.
 */
import {
  EASYLEVEL_PLACEMENTS,
  FACINGS,
  type EasyLevelPlacement,
  type Facing,
} from '../domain/mountingFacing';
import type { VehicleType } from '../domain/settings';
import { t } from './i18n';
import { svgEl } from './svg';

/** An upright box is seen edge-on from above (a thin bar); a flat one is
 * seen face-on (a squarer block). */
export type BoxShape = 'upright' | 'flat';

export interface MountingPickerOptions {
  shape: BoxShape;
  getVehicleType(): VehicleType;
  /** The picked facing, or null when nothing (or a mirrored lift-learned
   * mapping no facing describes) is stored. */
  getFacing(): Facing | null;
  setFacing(facing: Facing): void;
}

export interface MountingPicker {
  element: HTMLElement;
  refresh(): void;
}

const DEGREES: Record<Facing, number> = { front: 0, right: 90, rear: 180, left: 270 };

/** The box from above, its reference side up (toward "front") before
 * rotation: a filled edge plus a small arrow pointing out from it. */
function boxGlyph(shape: BoxShape, facing: Facing): SVGGElement {
  const group = svgEl('g', { transform: `rotate(${DEGREES[facing]})`, class: 'box-glyph' });
  const [w, h] = shape === 'upright' ? [32, 12] : [26, 20];
  group.append(
    svgEl('rect', {
      x: String(-w / 2),
      y: String(-h / 2),
      width: String(w),
      height: String(h),
      class: 'box-glyph__body',
    }),
    svgEl('rect', {
      x: String(-w / 2),
      y: String(-h / 2),
      width: String(w),
      height: '4',
      class: 'box-glyph__ref',
    }),
    svgEl('polygon', {
      points: `0,${-h / 2 - 7} -4,${-h / 2 - 2} 4,${-h / 2 - 2}`,
      class: 'box-glyph__ref',
    }),
  );
  return group;
}

/**
 * The EasyLevel box from above in one of its manual's two placements,
 * drawn like the real lid: a near-square lid on a base whose
 * mounting tabs stick out at the long sides' ends, and the lid's two
 * arrows — one up, one to the left, as printed on it. Long side forward
 * is the box as printed (the up arrow forward); short side forward is the
 * same box a quarter turn clockwise (the left arrow forward), the official
 * app's `sensor_Placing` 2 and Libell's `rotated90`.
 */
function placementGlyph(placement: EasyLevelPlacement): SVGGElement {
  const group = svgEl('g', {
    class: 'box-glyph',
    transform: `scale(1.15) rotate(${placement === 'wide' ? 0 : 90})`,
  });
  group.append(
    // Base with its two mounting tabs (the long sides).
    svgEl('rect', {
      x: '-22',
      y: '-11',
      width: '44',
      height: '22',
      rx: '2',
      class: 'box-glyph__body',
    }),
    // The lid.
    svgEl('rect', {
      x: '-15',
      y: '-14',
      width: '30',
      height: '28',
      rx: '3',
      class: 'box-glyph__body',
    }),
    // Up arrow (forward when the long side faces the front).
    svgEl('polygon', {
      points: '4,-12 10,-5 6.5,-5 6.5,0 1.5,0 1.5,-5 -2,-5',
      class: 'box-glyph__ref',
    }),
    // Left arrow.
    svgEl('polygon', {
      points: '-13,6 -6,0 -6,3.5 2,3.5 2,8.5 -6,8.5 -6,12',
      class: 'box-glyph__ref',
    }),
  );
  return group;
}

function vehicleDrawing(type: VehicleType, glyph: SVGGElement | null): SVGSVGElement {
  const svg = svgEl('svg', {
    viewBox: '0 0 100 160',
    class: 'mounting-picker__vehicle',
    'aria-hidden': 'true',
  });
  svg.append(...(type === 'caravan' ? caravanShapes() : motorhomeShapes()), frontLabel(type));
  if (glyph) {
    const placed = svgEl('g', { transform: 'translate(50 100)' });
    placed.append(glyph);
    svg.append(placed);
  }
  return svg;
}

function caravanShapes(): SVGElement[] {
  return [
    svgEl('polyline', { points: '38,30 50,6 62,30', class: 'mounting-picker__drawbar' }),
    svgEl('circle', { cx: '50', cy: '6', r: '4', class: 'mounting-picker__wheel' }),
    svgEl('rect', {
      x: '22',
      y: '30',
      width: '56',
      height: '124',
      rx: '8',
      class: 'mounting-picker__body',
    }),
    wheel(15, 96, 20),
    wheel(78, 96, 20),
  ];
}

function motorhomeShapes(): SVGElement[] {
  return [
    svgEl('rect', {
      x: '20',
      y: '6',
      width: '60',
      height: '148',
      rx: '12',
      class: 'mounting-picker__body',
    }),
    svgEl('path', {
      d: 'M27 26 Q50 14 73 26 L70 36 Q50 28 30 36 Z',
      class: 'mounting-picker__glass',
    }),
    wheel(13, 30, 18),
    wheel(80, 30, 18),
    wheel(13, 118, 18),
    wheel(80, 118, 18),
  ];
}

function wheel(x: number, y: number, height: number): SVGElement {
  return svgEl('rect', {
    x: String(x),
    y: String(y),
    width: '7',
    height: String(height),
    class: 'mounting-picker__wheel',
  });
}

function frontLabel(type: VehicleType): SVGElement {
  const front = svgEl('text', {
    x: '50',
    y: type === 'caravan' ? '48' : '52',
    'text-anchor': 'middle',
    class: 'mounting-picker__front',
  });
  front.textContent = `${t('diagram.front').toUpperCase()} ↑`;
  return front;
}

export function createMountingPicker(options: MountingPickerOptions): MountingPicker {
  const element = document.createElement('div');
  element.className = 'mounting-picker';
  const grid = document.createElement('div');
  grid.className = 'mounting-picker__grid';
  const center = document.createElement('div');
  center.className = 'mounting-picker__center';

  const buttons = new Map<Facing, HTMLButtonElement>();
  for (const facing of FACINGS) {
    const button = createFacingButton(options.shape, facing, () => {
      options.setFacing(facing);
      refresh();
    });
    buttons.set(facing, button);
    grid.append(button);
  }
  grid.append(center);
  element.append(createUprightPrompt(options.shape), grid);

  function refresh(): void {
    const picked = options.getFacing();
    for (const [facing, button] of buttons) {
      const on = facing === picked;
      button.classList.toggle('is-picked', on);
      button.setAttribute('aria-pressed', String(on));
    }
    center.replaceChildren(
      vehicleDrawing(options.getVehicleType(), picked ? boxGlyph(options.shape, picked) : null),
    );
  }

  refresh();
  return { element, refresh };
}

/** A box lying flat with an arrow has its own two-choice picker below;
 * this one only ever asks the upright box. */
function createUprightPrompt(shape: BoxShape): HTMLParagraphElement {
  const prompt = document.createElement('p');
  prompt.className = 'menu__text';
  prompt.textContent = t('mounting.prompt.upright');
  prompt.hidden = shape !== 'upright';
  return prompt;
}

function createFacingButton(shape: BoxShape, facing: Facing, onPick: () => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `mounting-picker__button mounting-picker__button--${facing}`;
  const label = t(`mounting.facing.${facing}`);
  button.setAttribute('aria-label', label);
  button.title = label;
  const icon = svgEl('svg', { viewBox: '-22 -22 44 44', 'aria-hidden': 'true' });
  icon.append(boxGlyph(shape, facing));
  button.append(icon);
  button.addEventListener('click', onPick);
  return button;
}

export interface PlacementPickerOptions {
  getVehicleType(): VehicleType;
  /** The picked placement, or null until one is picked. */
  getPlacement(): EasyLevelPlacement | null;
  setPlacement(placement: EasyLevelPlacement): void;
}

/**
 * The EasyLevel box's placement, as its manual has it: the user taps the
 * picture whose box faces the front the way theirs does, wide side or
 * short side — no rotations to think about, and none the manual does not
 * allow.
 */
export function createPlacementPicker(options: PlacementPickerOptions): MountingPicker {
  const element = document.createElement('div');
  element.className = 'placement-picker';

  const prompt = document.createElement('p');
  prompt.className = 'menu__text';
  prompt.textContent = t('mounting.prompt.arrow');

  const row = document.createElement('div');
  row.className = 'placement-picker__row';
  const parts = new Map<EasyLevelPlacement, { button: HTMLButtonElement; picture: HTMLElement }>();
  for (const placement of EASYLEVEL_PLACEMENTS) {
    const choice = document.createElement('div');
    choice.className = 'placement-picker__choice';
    const picture = document.createElement('div');
    picture.className = 'placement-picker__picture';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `placement-picker__button placement-picker__button--${placement}`;
    button.textContent = t(`mounting.placement.${placement}`);
    const pick = () => {
      options.setPlacement(placement);
      refresh();
    };
    button.addEventListener('click', pick);
    // The picture is the bigger target; the button stays the one control
    // keyboards and screen readers reach.
    picture.addEventListener('click', pick);
    choice.append(picture, button);
    row.append(choice);
    parts.set(placement, { button, picture });
  }
  element.append(prompt, row);

  function refresh(): void {
    const picked = options.getPlacement();
    for (const [placement, { button, picture }] of parts) {
      const on = placement === picked;
      button.classList.toggle('is-picked', on);
      button.setAttribute('aria-pressed', String(on));
      picture.classList.toggle('is-picked', on);
      picture.replaceChildren(vehicleDrawing(options.getVehicleType(), placementGlyph(placement)));
    }
  }

  refresh();
  return { element, refresh };
}
