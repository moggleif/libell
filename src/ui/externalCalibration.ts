/**
 * Zeroing the active external sensor from the calibration section, where a
 * user looks for calibration. The same action as on the box's own page
 * (R34), asynchronous for a box that zeroes itself.
 */
import type { CaptureResult } from '../domain/calibration';
import { captureMessage, externalStatusText } from './calibrationText';
import type { CalibrationOptions } from './calibrationSection';
import { createElement } from './dom';
import { t } from './i18n';

export interface ExternalCalibration {
  element: HTMLElement;
  refresh(message?: string): void;
  isWaiting(): boolean;
}

function createParts(options: CalibrationOptions, modern: boolean) {
  const element = createElement('div', modern ? 'calibration-card' : '');
  element.hidden = true;
  const heading = createElement('h3', modern ? 'calibration-card__title' : 'menu__heading');
  const intro = createElement('p', modern ? 'calibration-card__body' : 'menu__text');
  intro.textContent = t('calibration.external.intro');
  const zeroButton = createElement('button', 'menu__action');
  zeroButton.type = 'button';
  zeroButton.textContent = t('sensorSource.install.now');
  const status = createElement('p', 'menu__text menu__text--status');
  const anyway = createElement('button', 'menu__action menu__action--secondary');
  anyway.type = 'button';
  anyway.textContent = t('calibration.vehicle.anyway');
  anyway.hidden = true;
  element.append(heading, intro, zeroButton, status, anyway);
  if (options.openExternalSensor) {
    const openBox = createElement('button', 'link-button');
    openBox.type = 'button';
    openBox.textContent = t('pose.openSensorPage');
    openBox.addEventListener('click', () => options.openExternalSensor?.());
    element.append(openBox);
  }
  return { element, heading, zeroButton, status, anyway };
}

export function createExternalCalibration(
  options: CalibrationOptions,
  modern: boolean,
): ExternalCalibration {
  const { element, heading, zeroButton, status, anyway } = createParts(options, modern);

  function refresh(message?: string): void {
    const external = options.getExternalSensor?.() ?? null;
    element.hidden = external === null;
    anyway.hidden = true;
    status.classList.remove('menu__text--warning');
    if (!external) return;
    heading.textContent = t('calibration.external.h');
    status.textContent = externalStatusText(external.offset, external.capturedAt, message);
  }

  function show(result: CaptureResult, name: string): void {
    const { text, warned } = captureMessage(result);
    refresh(text ?? t('calibration.external.done', { name }));
    if (!warned) return;
    status.classList.add('menu__text--warning');
    anyway.hidden = false;
  }

  function zero(goAhead: boolean): void {
    const name = options.getExternalSensor?.()?.name ?? '';
    const result = options.calibrateExternalSensor?.(goAhead) ?? null;
    if (!(result instanceof Promise)) return show(result, name);
    zeroButton.disabled = true;
    refresh(t('calibration.external.working'));
    void result.then((answer) => {
      zeroButton.disabled = false;
      show(answer, name);
    });
  }
  zeroButton.addEventListener('click', () => zero(false));
  anyway.addEventListener('click', () => zero(true));

  return { element, refresh, isWaiting: () => zeroButton.disabled };
}
