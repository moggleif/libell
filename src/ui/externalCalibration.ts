/**
 * Zeroing the active external sensor from the calibration section, where a
 * user looks for calibration. The same action as on the box's own page
 * (R34), asynchronous for a box that zeroes itself.
 */
import type { CaptureResult } from '../domain/calibration';
import { captureMessage, externalStatusText } from './calibrationText';
import type { CalibrationOptions } from './calibrationSection';
import { button, createElement, paragraph } from './dom';
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
  const body = modern ? 'calibration-card__body' : 'menu__text';
  const intro = paragraph(body, t('calibration.external.intro'));
  const zeroButton = button('menu__action', t('sensorSource.install.now'));
  const status = createElement('p', 'menu__text menu__text--status');
  // Shown only while a steep zero's warning is up (#624).
  const undo = button('menu__action menu__action--secondary', t('calibration.undo'));
  undo.hidden = true;
  // #515: the phone cards are hidden meanwhile; say why and how back.
  const phoneHidden = paragraph(
    body,
    t('calibration.external.phoneHidden', { disconnect: t('sensorSource.disconnect') }),
  );
  element.append(heading, intro, zeroButton, status, undo, phoneHidden);
  if (options.openBoxPage) {
    element.append(button('link-button', t('pose.openSensorPage'), () => options.openBoxPage?.()));
  }
  return { element, heading, zeroButton, status, undo };
}

export function createExternalCalibration(
  options: CalibrationOptions,
  modern: boolean,
): ExternalCalibration {
  const { element, heading, zeroButton, status, undo } = createParts(options, modern);
  let restore: (() => void) | null = null;

  function refresh(message?: string): void {
    const external = options.getBox?.() ?? null;
    element.hidden = external === null;
    undo.hidden = true;
    status.classList.remove('menu__text--warning');
    if (!external) return;
    heading.textContent = t('calibration.external.h');
    status.textContent = externalStatusText(external.offset, external.capturedAt, message);
  }

  function show(result: CaptureResult, name: string): void {
    const message = captureMessage(result);
    restore = message.undo;
    refresh(message.text ?? t('calibration.external.done', { name }));
    if (!restore) return;
    status.classList.add('menu__text--warning');
    undo.hidden = false;
  }

  function zero(): void {
    const name = options.getBox?.()?.name ?? '';
    const result = options.calibrateBox?.() ?? null;
    if (!(result instanceof Promise)) return show(result, name);
    zeroButton.disabled = true;
    refresh(t('calibration.external.working'));
    void result.then((answer) => {
      zeroButton.disabled = false;
      show(answer, name);
    });
  }
  zeroButton.addEventListener('click', zero);
  undo.addEventListener('click', () => {
    restore?.();
    restore = null;
    refresh();
  });

  return { element, refresh, isWaiting: () => zeroButton.disabled };
}
