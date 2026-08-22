/**
 * Per-wheel lift list and the "Your RV is level!" confirmation (issue #6).
 *
 * The list shows "Front left: 4.2 cm (≈3 blocks)" per wheel, or "OK" when a
 * wheel needs no lift. When everything is within tolerance a large green
 * message replaces the list. The container is `aria-live` so the
 * level/not-level transition is announced — the user is looking at the
 * vehicle, not the screen.
 */
import { WHEEL_IDS, WHEEL_LABELS, type LevelingResult, type WheelId } from '../domain/leveling';

export interface WheelList {
  element: HTMLElement;
  update(result: LevelingResult): void;
}

export function createWheelList(): WheelList {
  const container = document.createElement('section');
  container.className = 'wheel-list';
  container.setAttribute('aria-live', 'polite');

  const levelMessage = document.createElement('p');
  levelMessage.className = 'wheel-list__level';
  levelMessage.textContent = 'Your RV is level!';
  levelMessage.hidden = true;

  const list = document.createElement('ul');
  list.className = 'wheel-list__items';
  const items = {} as Record<WheelId, HTMLLIElement>;
  for (const id of WHEEL_IDS) {
    const item = document.createElement('li');
    list.append(item);
    items[id] = item;
  }

  container.append(levelMessage, list);

  return {
    element: container,
    update(result) {
      levelMessage.hidden = !result.isLevel;
      list.hidden = result.isLevel;
      if (result.isLevel) return;
      for (const id of WHEEL_IDS) {
        const { liftCm, blocks } = result.wheels[id];
        items[id].textContent =
          liftCm < 0.05
            ? `${WHEEL_LABELS[id]}: OK`
            : `${WHEEL_LABELS[id]}: ${liftCm.toFixed(1)} cm (≈${blocks} block${blocks === 1 ? '' : 's'})`;
      }
    },
  };
}
