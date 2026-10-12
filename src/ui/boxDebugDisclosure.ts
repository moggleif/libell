/**
 * The box page's "Debug info" disclosure (`boxStatusPage.ts`): raw values
 * straight off a box with the `debugBytes` capability (today the EasyLevel)
 * — device id, last-sample age, the raw accel triplet, firmware tier, the
 * raw status bytes as hex — plus the #212 connect-delay workaround. Closed
 * by default, same native-<details> discipline as the settings page's
 * Advanced disclosure (#157), and hidden while the box is not in use:
 * there is no raw box data to show.
 */
import { MAX_EASYLEVEL_CONNECT_DELAY_MS } from '../domain/settings';
import type { ExternalSensorHealth } from '../sensor/externalSensors';
import type { BoxStatusOptions } from './boxStatusPage';
import {
  ageText,
  debugSummaryText,
  hexBytes,
  rawAccelText,
  temperatureText,
} from './boxStatusText';
import { createElement } from './dom';
import { t } from './i18n';
import { showToast } from './toast';

export interface BoxDebugDisclosure {
  element: HTMLElement;
  /** Re-reads the live rows; cheap enough every frame. */
  refresh(isActive: boolean, health: ExternalSensorHealth | null): void;
  /** Re-reads the stored connect delay into its controls — once per page
   * open, never per frame, see `createConnectDelayControls`. */
  syncConnectDelay(): void;
}

const textRow = (className = 'menu__text') => createElement('p', className);

type DebugRows = Record<
  'temperature' | 'deviceId' | 'lastSample' | 'rawAccel' | 'firmwareTier' | 'rawStatusBytes',
  HTMLElement
>;

function labelledField(caption: string, input: HTMLInputElement): HTMLLabelElement {
  const field = createElement('label', 'settings__field');
  const captionText = document.createElement('span');
  captionText.textContent = caption;
  field.append(captionText, input);
  return field;
}

/**
 * Connect-delay workaround (#212): an experimental hardware-compatibility
 * knob, not a normal setting, so it lives here rather than the settings
 * panel, styled as the settings form's own toggles.
 *
 * `sync` is called once per page open, deliberately NOT from `refresh()`:
 * `refresh()` runs every animation frame while the page is open, and
 * re-asserting `.value`/`.checked` on every frame would fight the user
 * mid-edit (a keystroke into the ms field getting reset before the next one
 * lands).
 */
function createConnectDelayControls(options: BoxStatusOptions): {
  elements: HTMLElement[];
  sync(): void;
} {
  const hint = textRow('settings__hint');
  hint.textContent = t('sensorStatus.debug.connectDelay.intro');
  const enableInput = createElement('input', 'settings__checkbox');
  enableInput.type = 'checkbox';
  const msInput = document.createElement('input');
  msInput.type = 'number';
  msInput.min = '0';
  msInput.max = String(MAX_EASYLEVEL_CONNECT_DELAY_MS);
  msInput.step = '50';

  function sync(): void {
    const { enabled, ms } = options.getEasyLevelConnectDelay();
    enableInput.checked = enabled;
    msInput.value = String(ms);
    msInput.disabled = !enabled;
  }
  function commit(): void {
    msInput.disabled = !enableInput.checked;
    options.setEasyLevelConnectDelay(enableInput.checked, Number(msInput.value));
  }
  enableInput.addEventListener('change', commit);
  msInput.addEventListener('change', commit);

  const elements = [
    hint,
    labelledField(t('sensorStatus.debug.connectDelay.enable'), enableInput),
    labelledField(t('sensorStatus.debug.connectDelay.ms'), msInput),
  ];
  return { elements, sync };
}

function createCopyButton(options: BoxStatusOptions): HTMLButtonElement {
  const button = createElement('button', 'menu__action');
  button.type = 'button';
  button.textContent = t('sensorStatus.debug.copy');
  button.addEventListener('click', () => {
    const text = debugSummaryText({
      name: options.sensor.displayName,
      state: options.getSensorState(),
      deviceId: options.getDeviceId(),
      lastSampleAge: ageText(options.getLastSampleAt(), performance.now()),
      rawAccel: options.getRawAccel(),
      firmwareLabel: options.getHealth()?.firmwareLabel ?? null,
      statusBytes: options.getEasyLevelStatusBytes(),
    });
    void navigator.clipboard.writeText(text).then(
      () => showToast(t('sensorStatus.debug.copied')),
      () => showToast(t('sensorStatus.debug.copy.failed')),
    );
  });
  return button;
}

/** The raw rows; only read while the box is in use. */
function refreshDebugRows(
  options: BoxStatusOptions,
  rows: DebugRows,
  health: ExternalSensorHealth | null,
): void {
  const notAvailable = t('sensorSource.detail.notAvailable');
  rows.deviceId.textContent = t('sensorStatus.debug.deviceId', {
    value: options.getDeviceId() ?? notAvailable,
  });
  rows.lastSample.textContent = t('sensorStatus.debug.lastSample', {
    value: ageText(options.getLastSampleAt(), performance.now()),
  });
  rows.rawAccel.textContent = t('sensorStatus.debug.rawAccel', {
    value: rawAccelText(options.getRawAccel()) ?? notAvailable,
  });
  rows.firmwareTier.textContent = t('sensorStatus.debug.firmwareTier', {
    value: health?.firmwareLabel ?? notAvailable,
  });
  rows.rawStatusBytes.textContent = t('sensorStatus.debug.rawStatusBytes', {
    value: hexBytes(options.getEasyLevelStatusBytes()) ?? notAvailable,
  });
}

export function createBoxDebugDisclosure(options: BoxStatusOptions): BoxDebugDisclosure {
  const capabilities = options.sensor.capabilities;
  const element = createElement('details', 'menu__detail sensor-status__debug');
  const summary = createElement('summary', 'sensor-status__debug-summary');
  summary.textContent = t('sensorStatus.debug');
  const intro = textRow();
  intro.textContent = t('sensorStatus.debug.intro');
  const rows: DebugRows = {
    temperature: textRow(),
    deviceId: textRow(),
    lastSample: textRow(),
    rawAccel: textRow(),
    firmwareTier: textRow(),
    rawStatusBytes: textRow(),
  };
  const connectDelay = createConnectDelayControls(options);

  element.append(summary, intro);
  // Only the rows this device can actually fill (#268, ADR 0016).
  if (capabilities.temperature) element.append(rows.temperature);
  element.append(rows.deviceId, rows.lastSample, rows.rawAccel);
  if (capabilities.firmwareVersion) element.append(rows.firmwareTier);
  if (capabilities.debugBytes) element.append(rows.rawStatusBytes);
  element.append(createCopyButton(options), ...connectDelay.elements);

  function refresh(isActive: boolean, health: ExternalSensorHealth | null): void {
    rows.temperature.textContent = temperatureText(health?.temperatureCelsius);
    element.hidden = !isActive;
    if (isActive) refreshDebugRows(options, rows, health);
  }
  return { element, refresh, syncConnectDelay: connectDelay.sync };
}
