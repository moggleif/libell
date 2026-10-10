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
import { FACINGS, type Facing } from '../domain/mountingFacing';
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

function vehicleDrawing(type: VehicleType, shape: BoxShape, facing: Facing | null): SVGSVGElement {
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
  if (facing) {
    const placed = svgEl('g', { transform: 'translate(50 100)' });
    placed.append(boxGlyph(shape, facing));
    svg.append(placed);
  }
  return svg;
}

export function createMountingPicker(options: MountingPickerOptions): MountingPicker {
  const element = document.createElement('div');
  element.className = 'mounting-picker';

  const prompt = document.createElement('p');
  prompt.className = 'menu__text';
  prompt.textContent = t(
    options.shape === 'upright' ? 'mounting.prompt.upright' : 'mounting.prompt.flat',
  );

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
    center.replaceChildren(vehicleDrawing(options.getVehicleType(), options.shape, picked));
  }

  refresh();
  return { element, refresh };
}
