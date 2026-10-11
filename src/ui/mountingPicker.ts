/**
 * "How is the box mounted?" by tapping a side of the vehicle (#314, the
 * #309 UX review). A top-down picture of the user's own vehicle — a
 * motorhome or a caravan — with one button at each of its four sides.
 * Each button shows the box turned so its reference side (the Xparkle
 * box's back, the EasyLevel box's arrow) points out to that side; the
 * user taps where it points. The box drawn inside the vehicle follows the
 * choice, so it shows at once what was picked.
 *
 * Replaces the EasyLevel box's four-option dropdown (R43) and, as the
 * main way, the lift-the-vehicle guide (#293), which stays as a quiet
 * link for anyone unsure.
 */
import {
  EASYLEVEL_PLACEMENTS,
  FACINGS,
  type EasyLevelPlacement,
  type Facing,
} from '../domain/mountingFacing';
import type { VehicleType } from '../domain/settings';
import { t } from './i18n';

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

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
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
 * The EasyLevel box from above in one of its manual's two placements
 * (#359): the box turned so its wide or its short side faces the front,
 * and in both an arrow on the lid pointing forward. Sized like the real
 * box (94 × 58 mm).
 */
function placementGlyph(placement: EasyLevelPlacement): SVGGElement {
  const group = svgEl('g', { class: 'box-glyph' });
  const [w, h] = placement === 'wide' ? [30, 18] : [18, 30];
  group.append(
    svgEl('rect', {
      x: String(-w / 2),
      y: String(-h / 2),
      width: String(w),
      height: String(h),
      class: 'box-glyph__body',
    }),
    // The arrow on the lid, pointing forward.
    svgEl('line', {
      x1: '0',
      y1: String(h / 2 - 4),
      x2: '0',
      y2: String(-h / 2 + 7),
      class: 'box-glyph__arrow',
    }),
    svgEl('polygon', {
      points: `0,${-h / 2 + 3} -4,${-h / 2 + 8} 4,${-h / 2 + 8}`,
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
  if (type === 'caravan') {
    svg.append(
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
      svgEl('rect', {
        x: '15',
        y: '96',
        width: '7',
        height: '20',
        class: 'mounting-picker__wheel',
      }),
      svgEl('rect', {
        x: '78',
        y: '96',
        width: '7',
        height: '20',
        class: 'mounting-picker__wheel',
      }),
    );
  } else {
    svg.append(
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
    );
    for (const [x, y] of [
      [13, 30],
      [80, 30],
      [13, 118],
      [80, 118],
    ] as const) {
      svg.append(
        svgEl('rect', {
          x: String(x),
          y: String(y),
          width: '7',
          height: '18',
          class: 'mounting-picker__wheel',
        }),
      );
    }
  }
  const front = svgEl('text', {
    x: '50',
    y: type === 'caravan' ? '48' : '52',
    'text-anchor': 'middle',
    class: 'mounting-picker__front',
  });
  front.textContent = `${t('diagram.front').toUpperCase()} ↑`;
  svg.append(front);
  if (glyph) {
    const placed = svgEl('g', { transform: 'translate(50 100)' });
    placed.append(glyph);
    svg.append(placed);
  }
  return svg;
}

export function createMountingPicker(options: MountingPickerOptions): MountingPicker {
  const element = document.createElement('div');
  element.className = 'mounting-picker';

  const prompt = document.createElement('p');
  prompt.className = 'menu__text';
  // A box lying flat with an arrow has its own two-choice picker below
  // (#359); this one only ever asks the upright box.
  prompt.textContent = t('mounting.prompt.upright');
  prompt.hidden = options.shape !== 'upright';

  const grid = document.createElement('div');
  grid.className = 'mounting-picker__grid';
  const center = document.createElement('div');
  center.className = 'mounting-picker__center';

  const buttons = new Map<Facing, HTMLButtonElement>();
  for (const facing of FACINGS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mounting-picker__button mounting-picker__button--${facing}`;
    const label = t(`mounting.facing.${facing}`);
    button.setAttribute('aria-label', label);
    button.title = label;
    const icon = svgEl('svg', { viewBox: '-22 -22 44 44', 'aria-hidden': 'true' });
    icon.append(boxGlyph(options.shape, facing));
    button.append(icon);
    button.addEventListener('click', () => {
      options.setFacing(facing);
      refresh();
    });
    buttons.set(facing, button);
    grid.append(button);
  }
  grid.append(center);
  element.append(prompt, grid);

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

export interface PlacementPickerOptions {
  getVehicleType(): VehicleType;
  /** The picked placement, or null until one is picked. */
  getPlacement(): EasyLevelPlacement | null;
  setPlacement(placement: EasyLevelPlacement): void;
}

/**
 * The EasyLevel box's placement (#359), as its manual has it: an arrow on
 * the lid points forward, and the user taps the picture whose box faces
 * the front the way theirs does, wide side or short side. Two pictures of
 * the vehicle with the box in it, each named under it — no rotations to
 * think about, and none the manual does not allow.
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
