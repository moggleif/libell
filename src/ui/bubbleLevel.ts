/**
 * Round bubble level (issue #7) — secondary to the RV diagram.
 *
 * The bubble drifts opposite the tilt (like a real spirit level, it moves
 * toward the high side) and turns green when within tolerance. `update` is
 * called from the main requestAnimationFrame loop, never straight from
 * sensor events. Easing is skipped when the user prefers reduced motion.
 */
import type { LevelingResult } from '../domain/leveling';

export interface BubbleLevel {
  element: HTMLElement;
  update(result: LevelingResult): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Degrees of tilt that push the bubble to the edge of its travel. */
const FULL_SCALE_DEG = 5;
const CENTER = 60;
const TRAVEL_RADIUS = 40;

export function createBubbleLevel(): BubbleLevel {
  const container = document.createElement('div');
  container.className = 'bubble-level';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Bubble level');

  const dial = document.createElementNS(SVG_NS, 'circle');
  dial.setAttribute('cx', String(CENTER));
  dial.setAttribute('cy', String(CENTER));
  dial.setAttribute('r', '56');
  dial.setAttribute('class', 'bubble-level__dial');

  const ring = document.createElementNS(SVG_NS, 'circle');
  ring.setAttribute('cx', String(CENTER));
  ring.setAttribute('cy', String(CENTER));
  ring.setAttribute('r', '14');
  ring.setAttribute('class', 'bubble-level__ring');

  const bubble = document.createElementNS(SVG_NS, 'circle');
  bubble.setAttribute('r', '10');
  bubble.setAttribute('class', 'bubble-level__bubble');

  svg.append(dial, ring, bubble);
  container.append(svg);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let x = CENTER;
  let y = CENTER;

  return {
    element: container,
    update(result) {
      // The bubble floats toward the high side: negative roll = right side
      // low = high side left, so the bubble moves left (negative x).
      const targetX =
        CENTER + Math.max(-1, Math.min(1, result.rollDeg / FULL_SCALE_DEG)) * TRAVEL_RADIUS;
      const targetY =
        CENTER + Math.max(-1, Math.min(1, result.pitchDeg / FULL_SCALE_DEG)) * TRAVEL_RADIUS;
      if (reduceMotion.matches) {
        x = targetX;
        y = targetY;
      } else {
        // Light easing on top of the sensor EMA keeps the motion fluid.
        x += (targetX - x) * 0.3;
        y += (targetY - y) * 0.3;
      }
      bubble.setAttribute('cx', x.toFixed(2));
      bubble.setAttribute('cy', y.toFixed(2));
      bubble.setAttribute(
        'class',
        result.isLevel
          ? 'bubble-level__bubble bubble-level__bubble--level'
          : 'bubble-level__bubble',
      );
    },
  };
}
