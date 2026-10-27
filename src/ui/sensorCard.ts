/**
 * One box's card on the list: a mark (✓ in use, ! lost, + not in use), the
 * box's name, and one line under it — its state, or a quiet Connect link.
 * The card of the box in use opens that box's own page, where Reconnect,
 * its setup and Disconnect live; the list never offers them itself.
 */
import { boxConnection, type BoxConnection } from './boxConnection';
import { createBoxPasswordBlock } from './boxPasswordBlock';
import { cardMark, cardStateText, connectErrorText } from './boxSetupState';
import { button, createElement, textElement } from './dom';
import { t } from './i18n';
import type { SensorSourceOptions } from './sensorSourceSection';

export interface SensorCard {
  element: HTMLElement;
  refresh(): void;
}

/** The box's name as a button, so its page stays reachable by keyboard;
 * inert (aria-disabled, no chevron) while the box is not in use, since the
 * page behind it is that box's own. */
function createNameButton(
  options: SensorSourceOptions,
  onOpenStatus: (() => void) | undefined,
): { element: HTMLButtonElement; refresh(active: boolean): void } {
  const element = createElement('button', 'sensor-card__name sensor-row__status-button');
  element.type = 'button';
  const name = document.createElement('span');
  name.textContent = options.sensor.displayName;
  element.append(name);
  if (!onOpenStatus) return { element, refresh: () => {} };

  const chevron = textElement('span', 'sensor-row__chevron', '›');
  chevron.setAttribute('aria-hidden', 'true');
  element.append(chevron);
  element.addEventListener('click', () => {
    if (options.getSensorSource() === options.sensor.id) onOpenStatus();
  });
  function refresh(active: boolean): void {
    chevron.hidden = !active;
    element.classList.toggle('sensor-row__status-button--plain', !active);
    if (active) element.removeAttribute('aria-disabled');
    else element.setAttribute('aria-disabled', 'true');
  }
  return { element, refresh };
}

function createConnectLink(options: SensorSourceOptions): HTMLButtonElement {
  const link = button('link-button sensor-card__connect', t('box.connect'));
  link.setAttribute('aria-label', t('sensorSource.connect', { name: options.sensor.displayName }));
  return link;
}

/** Connect from the card: Connecting under the name meanwhile, and what
 * went wrong if it did not succeed. */
function wireConnectLink(
  link: HTMLButtonElement,
  stateLine: HTMLElement,
  options: SensorSourceOptions,
  refresh: () => void,
  onSourceChanged: (() => void) | undefined,
): void {
  link.addEventListener('click', () => {
    link.hidden = true;
    stateLine.hidden = false;
    stateLine.textContent = t('sensorSource.status.connecting');
    void options.connectSensor().then((state) => {
      refresh();
      // Said under the name, with Connect still there to try again.
      const error = connectErrorText(state, options.sensor.displayName);
      if (error) {
        stateLine.hidden = false;
        stateLine.textContent = error;
      }
      onSourceChanged?.();
    });
  });
}

export function createSensorCard(
  options: SensorSourceOptions,
  onOpenStatus: (() => void) | undefined,
  onSourceChanged: (() => void) | undefined,
): SensorCard {
  const element = createElement('div', 'sensor-card');
  const mark = createElement('span', 'sensor-card__mark');
  mark.setAttribute('aria-hidden', 'true');
  const text = createElement('div', 'sensor-card__text');
  const nameButton = createNameButton(options, onOpenStatus);
  const stateLine = createElement('p', 'sensor-card__state');
  const connectLink = createConnectLink(options);
  // A rejected password, with the way out right on the card — hidden the
  // rest of the time.
  const passwordBlock = options.password
    ? createBoxPasswordBlock(options.password, options.sensor.displayName)
    : null;
  text.append(nameButton.element, stateLine, connectLink);
  if (passwordBlock) text.append(passwordBlock.element);
  element.append(mark, text);

  function refresh(): void {
    const active = options.getSensorSource() === options.sensor.id;
    const connection: BoxConnection = boxConnection(
      active,
      options.getSensorState(),
      () => options.password?.isRejected() ?? false,
    );
    mark.textContent = cardMark(connection);
    element.classList.toggle('is-active', connection === 'connected');
    element.classList.toggle('is-lost', connection === 'lost' || connection === 'password');
    connectLink.hidden = active;
    stateLine.hidden = !active;
    stateLine.textContent = cardStateText(connection);
    passwordBlock?.refresh();
    nameButton.refresh(active);
  }

  wireConnectLink(connectLink, stateLine, options, refresh, onSourceChanged);
  return { element, refresh };
}
